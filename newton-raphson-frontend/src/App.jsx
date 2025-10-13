import React, { useEffect, useRef, useState } from "react";
import { Container } from "react-bootstrap";
import NewtonRaphsonForm from "./components/NewtonRaphsonForm";
import ProgressTracker from "./components/ProgressTracker";
import { connectSignalR, startSolve, cancelTask } from "./api/newtonRaphsonApi";

function App() {
  const [taskId, setTaskId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Idle");
  const [result, setResult] = useState(null);
  const connectionRef = useRef(null);
  const taskIdRef = useRef(null); // ✅ holds the latest taskId

  // keep ref updated
  useEffect(() => {
    taskIdRef.current = taskId;
  }, [taskId]);

  // 🔹 Connect to SignalR once
  useEffect(() => {
    (async () => {
      try {
        const conn = await connectSignalR(
          (id, prog) => {
            // ✅ use latest taskId via ref
            if (id === taskIdRef.current) {
              setProgress(prog);
            }
          },
          (id, data) => {
            if (id === taskIdRef.current) {
              setStatus(data.status);
              setResult(data.result ?? null);
            }
          }
        );
        connectionRef.current = conn;
      } catch (err) {
        console.error("SignalR connection failed:", err);
      }
    })();

    return () => {
      const conn = connectionRef.current;
      if (conn && conn.state === "Connected") conn.stop();
    };
  }, []);

  useEffect(() => {
    if (status === "Completed") {
      setProgress(100);
    }
  }, [status]);

  const handleStart = async (request) => {
    try {
      setProgress(0);
      setResult(null);
      setStatus("In Progress");

      const { taskId } = await startSolve(request);
      setTaskId(taskId);
      taskIdRef.current = taskId; // ✅ ensure ref is in sync
    } catch (err) {
      console.error("Start solve failed:", err);
      setStatus("Error");
    }
  };

  const handleCancel = async () => {
    if (!taskIdRef.current) return;
    await cancelTask(taskIdRef.current);
    setStatus("Cancelled");
  };

  return (
    <Container className="p-4" style={{ maxWidth: 600 }}>
      <h2 className="mb-4 text-center">Newton–Raphson Solver</h2>
      <NewtonRaphsonForm onStart={handleStart} />
      {taskId && (
        <ProgressTracker
          progress={progress}
          status={status}
          result={result}
          onCancel={handleCancel}
          disabled={status !== "In Progress"}
        />
      )}
    </Container>
  );
}

export default App;
