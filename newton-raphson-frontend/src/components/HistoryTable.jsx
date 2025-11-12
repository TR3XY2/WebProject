import React from "react";
import { Table, Alert } from "react-bootstrap";

export default function HistoryTable({ items }) {
  if (!items) return <Alert variant="info">Loading...</Alert>;
  if (items.length === 0) return <Alert variant="info">No history yet.</Alert>;

  return (
    <div className="mt-4">
      <h5>Your Solve History</h5>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Function</th>
            <th>Initial Guess</th>
            <th>Tolerance</th>
            <th>Iterations</th>
            <th>Result</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {items.map((h) => (
            <tr key={h.id}>
              <td>{h.functionStr}</td>
              <td>{h.initialGuess}</td>
              <td>{h.tolerance}</td>
              <td>{h.maxIterations}</td>
              <td>{h.result ?? "-"}</td>
              <td>{h.status}</td>
              <td>{new Date(h.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
