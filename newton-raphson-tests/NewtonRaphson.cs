using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Moq;
using newton_raphson_backend.Controllers;
using newton_raphson_backend.Models;

namespace newton_raphson_tests
{
    public class NewtonRaphsonTest
    {
        [Fact]
        public async Task SolveReturnsTaskId()
        {
            // Arrange
            var mockHubContext = new Mock<IHubContext<ProgressHub>>();
            var controller = new NewtonRaphsonController(mockHubContext.Object);

            var request = new SolveRequest
            {
                FunctionStr = "x^2 - 4",
                DerivativeStr = "2*x",
                InitialGuess = 2.0,
                Tolerance = 0.001,
                MaxIterations = 100
            };

            // Act
            var actionResult = controller.Solve(request);
            var result = actionResult as OkObjectResult;

            // Assert
            Assert.NotNull(result);

            var response = Assert.IsType<SolveResponse>(result!.Value);
            Assert.False(string.IsNullOrWhiteSpace(response.TaskId));

            await Task.CompletedTask;
        }
    }
}