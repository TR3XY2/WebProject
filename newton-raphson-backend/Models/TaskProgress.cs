using System.Text.Json.Serialization;

namespace newton_raphson_backend.Models
{
    public class TaskProgress
    {
        public string Id { get; set; } = string.Empty;
        public double Progress { get; set; }
        public string Status { get; set; } = "Pending";
        public double? Result { get; set; }

        [JsonIgnore]
        public CancellationTokenSource Cancellation { get; set; } = new();
    }
}