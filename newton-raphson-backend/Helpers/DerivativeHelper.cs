using MathNet.Symbolics;
using System.Globalization;

namespace newton_raphson_backend.Helpers
{
    public static class DerivativeHelper
    {
        public static string GetDerivative(string functionStr)
        {
            var symbols = SymbolicExpression.Parse(functionStr);
            var derivative = symbols.Differentiate("x");
            return derivative.ToString();
        }
    }
}