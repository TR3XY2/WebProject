using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using NCalc;
using System.Collections.Concurrent;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class NewtonRaphsonController : ControllerBase
{
    private readonly IHubContext<ProgressHub> _hubContext;
    private static ConcurrentDictionary<string, TaskProgress> _tasks = new();

    public NewtonRaphsonController(IHubContext<ProgressHub> hubContext)
    {
        _hubContext = hubContext;
    }

    [HttpPost("solve")]
    public async Task<IActionResult> Solve([FromBody] SolveRequest request)
    {
        string taskId = Guid.NewGuid().ToString();
        var progress = new TaskProgress { Id = taskId, Status = "In Progress", Progress = 0 };
        _tasks[taskId] = progress;

        _ = Task.Run(async () =>
        {
            try
            {
                double x = request.InitialGuess;

                for (int i = 0; i < request.MaxIterations; i++)
                {
                    double fx = EvaluateFunction(request.FunctionStr, x);
                    double fPrimeX = EvaluateFunction(request.DerivativeStr, x);

                    if (fPrimeX == 0)
                    {
                        progress.Status = "Failed: Derivative is zero.";
                        break;
                    }

                    double xNext = x - fx / fPrimeX;
                    progress.Progress = (i + 1) * 100.0 / request.MaxIterations;

                    await _hubContext.Clients.All.SendAsync("ProgressUpdate", taskId, progress.Progress);

                    if (Math.Abs(xNext - x) < request.Tolerance)
                    {
                        progress.Status = "Completed";
                        progress.Result = xNext;
                        break;
                    }

                    x = xNext;
                }

                if (progress.Status == "In Progress")
                {
                    progress.Status = "Failed: Max iterations reached.";
                }

                await _hubContext.Clients.All.SendAsync("TaskCompleted", taskId, progress);
            }
            catch (Exception ex)
            {
                progress.Status = $"Failed: {ex.Message}";
                await _hubContext.Clients.All.SendAsync("TaskCompleted", taskId, progress);
            }
        });

        return Ok(new { TaskId = taskId });
    }

    [HttpGet("progress/{taskId}")]
    public IActionResult GetProgress(string taskId)
    {
        if (_tasks.TryGetValue(taskId, out var progress))
            return Ok(progress);

        return NotFound("Task not found.");
    }

    private double EvaluateFunction(string function, double x)
    {
        var expression = new Expression(function);
        expression.Parameters["x"] = x;

        try
        {
            return Convert.ToDouble(expression.Evaluate());
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to evaluate expression '{function}': {ex.Message}");
        }
    }
}