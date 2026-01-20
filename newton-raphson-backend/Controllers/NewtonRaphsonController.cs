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
        private readonly AppDbContext _db;
        private readonly UserManager<IdentityUser> _userManager;
        private readonly IServiceScopeFactory _scopeFactory;

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
            if (request.MaxIterations > 500 || Math.Abs(request.InitialGuess) > 1e6)
            {
                return BadRequest("Task too large. Max iterations = 500, |InitialGuess| ≤ 1e6.");
            }

            var activeTasks = _tasks.Values.Count(t => t.Status == "In Progress");
            if (activeTasks >= 3)
            {
                return BadRequest("Too many concurrent tasks. Please wait until one finishes.");
            }

            string taskId = Guid.NewGuid().ToString();
            var progress = new TaskProgress { Id = taskId, Status = "In Progress", Progress = 0.0 };
            _tasks[taskId] = progress;

            string? capturedUserId = null;

            if (User?.Identity?.IsAuthenticated == true)
            {
                var userTask = _userManager.GetUserAsync(User);
                userTask.Wait();
                var user = userTask.Result;
                if (user != null)
                    capturedUserId = user.Id;
            }

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

                        progress.Progress = (i + 1) * 100.0 / request.MaxIterations;

                        if (targetClient != null)
                        {
                            try { await targetClient.SendAsync("ProgressUpdate", taskId, progress.Progress); }
                            catch { }
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

                    if (progress.Status == "Completed")
                        progress.Progress = 100.0;

                    if (targetClient != null)
                    {
                        try { await targetClient.SendAsync("TaskCompleted", taskId, progress); }
                        catch { /* ignore */ }
                    }

                    if (!string.IsNullOrEmpty(capturedUserId))
                    {
                        try
                        {
                            using var scope = _scopeFactory.CreateScope();
                            var scopedDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();

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
