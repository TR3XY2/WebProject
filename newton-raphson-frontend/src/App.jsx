import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Nav, Navbar } from "react-bootstrap";
import NewtonRaphsonForm from "./components/NewtonRaphsonForm";
import ProgressTracker from "./components/ProgressTracker";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import HistoryTable from "./components/HistoryTable";
import { connectSignalR, startSolve, cancelTask } from "./api/newtonRaphsonApi";

const API_BASE = "https://localhost:5001/api";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Idle");
  const [result, setResult] = useState(null);
  const [taskId, setTaskId] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_BASE}/Auth/check`, { withCredentials: true })
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => setIsAuthenticated(false);

  return (
    <>
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand>Newton–Raphson Solver</Navbar.Brand>
        </Container>
      </Navbar>
      <Container className="py-4" style={{ maxWidth: 800 }}>
        {!isAuthenticated ? (
          <>
            <LoginForm
              onLogin={handleLogin}
              onLogout={handleLogout}
              isAuthenticated={isAuthenticated}
            />
            <div className="mt-3">
              <RegisterForm />
            </div>
          </>
        ) : (
          <>
            <NewtonRaphsonForm
              onStart={async (req) => {
                const conn = await connectSignalR(
                  (id, prog) => setProgress(prog),
                  (id, data) => {
                    setStatus(data.status);
                    setResult(data.result);
                  }
                );
                const res = await startSolve(req);
                setTaskId(res.taskId);
              }}
            />
            {taskId && (
              <ProgressTracker
                progress={progress}
                status={status}
                result={result}
                onCancel={() => cancelTask(taskId)}
                disabled={status !== "In Progress"}
              />
            )}
            <HistoryTable />
          </>
        )}
      </Container>
    </>
  );
}

export default App;
