namespace newton_raphson_backend.Models
{
    public class SolveRequest
    {
        public string FunctionStr { get; set; } = string.Empty;
        public string DerivativeStr { get; set; } = string.Empty;
        public double InitialGuess { get; set; }
        public double Tolerance { get; set; }
        public int MaxIterations { get; set; }
    }
}