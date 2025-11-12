import React, { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { login, logout } from "../api/authApi";

export default function LoginForm({ onLogin, onLogout, isAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState("info");

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await login(email, password);
      setVariant("success");
      setMessage("✅ Logged in successfully!");
      onLogin();
    } catch (err) {
      const data = err.response?.data;

      let readable = "❌ Login failed.";
      if (typeof data === "string") {
        if (data.toLowerCase().includes("invalid")) readable = "❌ Invalid credentials.";
        else if (data.toLowerCase().includes("password")) readable = "❌ Incorrect password.";
        else if (data.toLowerCase().includes("user")) readable = "❌ Email not registered.";
        else readable = `❌ ${data}`;
      } else if (data?.message) {
        const msg = data.message.toLowerCase();
        if (msg.includes("password")) readable = "❌ Incorrect password.";
        else if (msg.includes("user")) readable = "❌ Email not registered.";
        else readable = `❌ ${data.message}`;
      }

      setVariant("danger");
      setMessage(readable);
    }
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
    setMessage("✅ Logged out.");
    setVariant("info");
  };

  return (
    <div className="p-3 border rounded bg-light">
      {isAuthenticated ? (
        <>
          <Alert variant="success">You are logged in.</Alert>
          <Button variant="danger" onClick={handleLogout} className="w-100">
            Logout
          </Button>
        </>
      ) : (
        <Form onSubmit={handleLogin}>
          <h4 className="mb-3">Login</h4>
          {message && <Alert variant={variant}>{message}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>
          <Button type="submit" variant="primary" className="w-100">
            Login
          </Button>
        </Form>
      )}
    </div>
  );
}
