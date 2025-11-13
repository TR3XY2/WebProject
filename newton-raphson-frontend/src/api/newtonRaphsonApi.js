import axios from "axios";
import * as signalR from "@microsoft/signalr";

const API_BASE = "https://localhost:5001/api/NewtonRaphson";
const HUB_URL = "https://localhost:5001/progressHub";

let connection = null;

export async function connectSignalR(onProgress, onCompleted) {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      transport: signalR.HttpTransportType.WebSockets,
      withCredentials: true,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();

  connection.on("ProgressUpdate", (taskId, progress) => {
    console.log("ProgressUpdate:", taskId, progress);
    onProgress(taskId, progress);
  });

  connection.on("TaskCompleted", (taskId, data) => {
    console.log("TaskCompleted:", taskId, data);
    if (data.status === "Completed") {
      onProgress(taskId, 100); // ✅ ensure progress bar is full
    }
    onCompleted(taskId, data);
  });


  connection.onclose((err) => {
    console.warn("🛑 SignalR disconnected", err);
  });

  connection.onreconnected((connId) => {
    console.log("🔄 SignalR reconnected:", connId);
  });

  // ✅ Wait for connection
  try {
    await connection.start();
    console.log("✅ SignalR connected:", connection.connectionId);
  } catch (err) {
    console.error("❌ SignalR failed to connect:", err);
    throw err;
  }

  return connection;
}

export async function startSolve(request) {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    throw new Error("SignalR not connected");
  }

  try {
    const headers = { "X-Connection-ID": connection.connectionId };
    const response = await axios.post(`${API_BASE}/solve`, request, { headers });
    return response.data;
  } catch (err) {
    const msg =
      err.response?.data ||
      err.response?.data?.detail ||
      err.message ||
      "Unknown error";
    throw new Error(msg);
  }
}

export async function cancelTask(taskId) {
  await axios.post(`${API_BASE}/cancel/${taskId}`);
}
