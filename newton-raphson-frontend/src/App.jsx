import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Navbar, Tab, Tabs } from "react-bootstrap";
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
  const [activeTab, setActiveTab] = useState("main");
  const [history, setHistory] = useState([]); // ✅ keep history state here

  // ✅ Check auth on mount
  useEffect(() => {
    axios
      .get(`${API_BASE}/Auth/check`, { withCredentials: true })
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  // ✅ Load history if logged in
  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/NewtonRaphson/history`, {
        withCredentials: true,
      });
      setHistory(res.data);
    } catch (err) {
      console.warn("Failed to load history (maybe not logged in)");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setActiveTab("main");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setHistory([]);
  };

  const handleStart = async (req) => {
    const conn = await connectSignalR(
      (id, prog) => setProgress(prog),
      async (id, data) => {
        setStatus(data.status);
        setResult(data.result);

        // ✅ Reload history when a solve finishes
        if (data.status === "Completed" || data.status.startsWith("Failed")) {
          await loadHistory();
        }
      }
    );
    const res = await startSolve(req);
    setTaskId(res.taskId);
  };

  return (
    <>
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand>Newton–Raphson Solver</Navbar.Brand>
        </Container>
      </Navbar>

      <Container className="py-4" style={{ maxWidth: 800 }}>
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || "main")}
          className="mb-3"
          justify
        >
          <Tab eventKey="main" title="Solver">
            <NewtonRaphsonForm onStart={handleStart} />
            {taskId && (
              <ProgressTracker
                progress={progress}
                status={status}
                result={result}
                onCancel={() => cancelTask(taskId)}
                disabled={status !== "In Progress"}
              />
            )}

            {isAuthenticated ? (
              <HistoryTable items={history} />
            ) : (
              <p className="mt-3 text-muted text-center">
                🔒 Login or Register to view your solve history.
              </p>
            )}
          </Tab>

          <Tab eventKey="login" title="Login">
            <LoginForm
              onLogin={handleLogin}
              onLogout={handleLogout}
              isAuthenticated={isAuthenticated}
            />
          </Tab>

          <Tab eventKey="register" title="Register">
            <RegisterForm />
          </Tab>
        </Tabs>
      </Container>
    </>
  );
}

export default App;
