import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";

const NewtonRaphsonForm = ({ onStart }) => {
  const [functionStr, setFunctionStr] = useState("x^2 - 2");
  const [initialGuess, setInitialGuess] = useState(1.0);
  const [tolerance, setTolerance] = useState(1e-6);
  const [maxIterations, setMaxIterations] = useState(50);

  const handleSubmit = (e) => {
    e.preventDefault();
    onStart({
      functionStr,
      initialGuess: parseFloat(initialGuess),
      tolerance: parseFloat(tolerance),
      maxIterations: parseInt(maxIterations),
    });
  };

  return (
    <Form onSubmit={handleSubmit} className="p-3 border rounded bg-light">
      <Form.Group className="mb-3">
        <Form.Label>Function f(x)</Form.Label>
        <Form.Control
          value={functionStr}
          onChange={(e) => setFunctionStr(e.target.value)}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Initial Guess</Form.Label>
        <Form.Control
          type="number"
          value={initialGuess}
          onChange={(e) => setInitialGuess(e.target.value)}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Tolerance</Form.Label>
        <Form.Control
          type="number"
          step="any"
          value={tolerance}
          onChange={(e) => setTolerance(e.target.value)}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Max Iterations</Form.Label>
        <Form.Control
          type="number"
          value={maxIterations}
          onChange={(e) => setMaxIterations(e.target.value)}
        />
      </Form.Group>
      <Button type="submit" variant="primary" className="w-100">
        Start Solving
      </Button>
    </Form>
  );
};

export default NewtonRaphsonForm;
