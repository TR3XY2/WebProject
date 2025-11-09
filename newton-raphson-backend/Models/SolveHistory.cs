using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace newton_raphson_backend.Models
{
    public class SolveHistory
    {
        [Key]
        public int Id { get; set; }

        public string FunctionStr { get; set; } = string.Empty;
        public double InitialGuess { get; set; }
        public double Tolerance { get; set; }
        public int MaxIterations { get; set; }
        public double? Result { get; set; }
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("User")]
        public string UserId { get; set; } = string.Empty;
    }
}
