import React, { useEffect, useState } from "react";
import { Table, Alert } from "react-bootstrap";
import { getHistory } from "../api/authApi";

export default function HistoryTable() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getHistory();
        setHistory(data);
      } catch (err) {
        setError("Failed to load history (are you logged in?)");
      }
    })();
  }, []);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!history.length) return <Alert variant="info">No history yet.</Alert>;

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
          {history.map((h) => (
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
