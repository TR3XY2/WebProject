public class SolveRequest
{
    public string FunctionStr { get; set; }
    public string DerivativeStr { get; set; }
    public double InitialGuess { get; set; }
    public double Tolerance { get; set; }
    public int MaxIterations { get; set; }
}