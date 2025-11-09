import React, { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { login, logout } from "../api/authApi";

export default function LoginForm({ onLogin, onLogout, isAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      setMessage("✅ Logged in!");
      onLogin();
    } catch (err) {
      setMessage("❌ Invalid credentials");
    }
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  return (
    <div className="p-3 border rounded bg-light">
      {isAuthenticated ? (
        <>
          <Alert variant="success">You are logged in as {email || "user"}.</Alert>
          <Button variant="danger" onClick={handleLogout} className="w-100">
            Logout
          </Button>
        </>
      ) : (
        <Form onSubmit={handleLogin}>
          <h4 className="mb-3">Login</h4>
          {message && <Alert variant="info">{message}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
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
