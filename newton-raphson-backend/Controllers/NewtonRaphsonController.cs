using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using NCalc;
using newton_raphson_backend.Helpers;
using newton_raphson_backend.Models;
using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace newton_raphson_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NewtonRaphsonController : ControllerBase
    {
        private readonly IHubContext<ProgressHub> _hubContext;
        private static readonly ConcurrentDictionary<string, TaskProgress> _tasks = new();

        public NewtonRaphsonController(IHubContext<ProgressHub> hubContext)
        {
            _hubContext = hubContext;
        }

        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(SolveResponse))]
        [HttpPost("solve")]
        public IActionResult Solve([FromBody] SolveRequest request, [FromHeader(Name = "X-Connection-ID")] string? connectionId = null)
        {
            string taskId = Guid.NewGuid().ToString();
            var progress = new TaskProgress { Id = taskId, Status = "In Progress" };
            _tasks[taskId] = progress;

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

                        await targetClient!.SendAsync("ProgressUpdate", taskId, progress.Progress);

                        if (Math.Abs(xNext - x) < request.Tolerance)
                        {
                            progress.Status = "Completed";
                            progress.Result = xNext;
                            progress.Progress = 100.0; // ✅ force 100% when done
                            break;
                        }

                        x = xNext;
                        await Task.Delay(100); // optional to simulate progress
                    }

                    if (progress.Status == "In Progress")
                    {
                        progress.Status = "Failed: Max iterations reached.";
                    }

                    // ✅ Always send full 100% on completion
                    if (progress.Status == "Completed")
                        progress.Progress = 100.0;

                    await targetClient!.SendAsync("TaskCompleted", taskId, progress);
                }
                catch (Exception ex)
                {
                    progress.Status = $"Failed: {ex.Message}";
                    await _hubContext.Clients.All.SendAsync("TaskCompleted", taskId, progress);
                }
            });

            return Ok(new SolveResponse { TaskId = taskId });
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
