using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using NCalc;
using newton_raphson_backend.Data;
using newton_raphson_backend.Helpers;
using newton_raphson_backend.Models;
using System.Collections.Concurrent;

namespace newton_raphson_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NewtonRaphsonController : ControllerBase
    {
        private readonly IHubContext<ProgressHub> _hubContext;
        private static readonly ConcurrentDictionary<string, TaskProgress> _tasks = new();
        private readonly AppDbContext _db; // only used for normal request handling (not reused in background)
        private readonly UserManager<IdentityUser> _userManager;
        private readonly IServiceScopeFactory _scopeFactory; // use factory to create scopes inside background tasks

        public NewtonRaphsonController(
            IHubContext<ProgressHub> hubContext,
            AppDbContext db,
            UserManager<IdentityUser> userManager,
            IServiceScopeFactory scopeFactory)
        {
            _hubContext = hubContext;
            _db = db;
            _userManager = userManager;
            _scopeFactory = scopeFactory;
        }

        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(SolveResponse))]
        [HttpPost("solve")]
        public IActionResult Solve([FromBody] SolveRequest request, [FromHeader(Name = "X-Connection-ID")] string? connectionId = null)
        {
            // Generate task id and initial progress object
            string taskId = Guid.NewGuid().ToString();
            var progress = new TaskProgress { Id = taskId, Status = "In Progress", Progress = 0.0 };
            _tasks[taskId] = progress;

            // Capture current user id (if authenticated) BEFORE starting background work
            string? capturedUserId = null;

            if (User?.Identity?.IsAuthenticated == true)
            {
                // NOTE: GetUserAsync touches UserManager and the HttpContext; do it synchronously here
                // (still asynchronous because ASP.NET Identity is async)
                var userTask = _userManager.GetUserAsync(User);
                userTask.Wait(); // small synchronous wait – acceptable here because controller request is active
                var user = userTask.Result;
                if (user != null)
                    capturedUserId = user.Id;
            }

            // Start background task (fire-and-forget)
            _ = Task.Run(async () =>
            {
                try
                {
                    double x = request.InitialGuess;
                    string derivativeStr = DerivativeHelper.GetDerivative(request.FunctionStr);

                    var clients = _hubContext?.Clients;
                    IClientProxy? targetClient = string.IsNullOrWhiteSpace(connectionId)
                        ? clients?.All
                        : clients?.Client(connectionId);

                    for (int i = 0; i < request.MaxIterations; i++)
                    {
                        if (progress.Cancellation.IsCancellationRequested)
                        {
                            progress.Status = "Cancelled";
                            break;
                        }

                        double fx = EvaluateFunction(ConvertExpression(request.FunctionStr), x);
                        double fPrimeX = EvaluateFunction(ConvertExpression(derivativeStr), x);

                        if (Math.Abs(fPrimeX) < 1e-10)
                        {
                            progress.Status = "Failed: Derivative is zero.";
                            break;
                        }

                        double xNext = x - fx / fPrimeX;

                        // update progress percent (1..MaxIterations)
                        progress.Progress = (i + 1) * 100.0 / request.MaxIterations;

                        // send incremental progress to clients
                        if (targetClient != null)
                        {
                            try { await targetClient.SendAsync("ProgressUpdate", taskId, progress.Progress); }
                            catch { /* ignore SignalR send errors in background */ }
                        }

                        if (Math.Abs(xNext - x) < request.Tolerance)
                        {
                            progress.Status = "Completed";
                            progress.Result = xNext;
                            progress.Progress = 100.0;
                            break;
                        }

                        x = xNext;
                        await Task.Delay(100); // optional artificial delay
                    }

                    if (progress.Status == "In Progress")
                        progress.Status = "Failed: Max iterations reached.";

                    // ensure completion progress is 100 when completed
                    if (progress.Status == "Completed")
                        progress.Progress = 100.0;

                    // final notification
                    if (targetClient != null)
                    {
                        try { await targetClient.SendAsync("TaskCompleted", taskId, progress); }
                        catch { /* ignore */ }
                    }

                    // ------------------------
                    // persist history if user was authenticated when request started
                    // ------------------------
                    if (!string.IsNullOrEmpty(capturedUserId))
                    {
                        try
                        {
                            // create a new scope and use a fresh DbContext instance (safe for background)
                            using var scope = _scopeFactory.CreateScope();
                            var scopedDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                            // create history record (use capturedUserId)
                            var history = new SolveHistory
                            {
                                FunctionStr = request.FunctionStr,
                                InitialGuess = request.InitialGuess,
                                Tolerance = request.Tolerance,
                                MaxIterations = request.MaxIterations,
                                Result = progress.Result,
                                Status = progress.Status,
                                UserId = capturedUserId,
                                CreatedAt = DateTime.UtcNow
                            };

                            scopedDb.SolveHistories.Add(history);
                            await scopedDb.SaveChangesAsync();
                        }
                        catch (Exception ex)
                        {
                            // log — but don't throw (background task)
                            Console.WriteLine($"Error saving history in background task: {ex}");
                        }
                    }
                }
                catch (Exception ex)
                {
                    progress.Status = $"Failed: {ex.Message}";
                    try { await _hubContext.Clients.All.SendAsync("TaskCompleted", taskId, progress); } catch { }
                }
            });

            // return task id immediately
            return Ok(new SolveResponse { TaskId = taskId });
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            if (User?.Identity?.IsAuthenticated != true)
                return Unauthorized();

            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var history = _db.SolveHistories
                .Where(h => h.UserId == user.Id)
                .OrderByDescending(h => h.CreatedAt)
                .ToList();

            return Ok(history);
        }

        [HttpGet("progress/{taskId}")]
        public IActionResult GetProgress(string taskId)
        {
            if (_tasks.TryGetValue(taskId, out var progress))
                return Ok(progress);
            return NotFound("Task not found.");
        }

        [HttpPost("cancel/{taskId}")]
        public IActionResult Cancel(string taskId)
        {
            if (_tasks.TryGetValue(taskId, out var progress))
            {
                progress.Cancellation.Cancel();
                return Ok("Cancellation requested");
            }
            return NotFound("Task not found.");
        }

        private static double EvaluateFunction(string function, double x)
        {
            var expression = new Expression(function);
            expression.Parameters["x"] = x;
            return Convert.ToDouble(expression.Evaluate());
        }

        private static string ConvertExpression(string input)
        {
            var regex = new System.Text.RegularExpressions.Regex(@"(\w+)\s*\^\s*(\w+)");
            return regex.Replace(input, "Pow($1,$2)");
        }
    }
}
