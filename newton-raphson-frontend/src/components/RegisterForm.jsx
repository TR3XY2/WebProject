import React, { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { register } from "../api/authApi";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState("info");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await register(email, password);
      setVariant("success");
      setMessage("✅ Account created successfully! You can now log in.");
      setEmail("");
      setPassword("");
    } catch (err) {
      const data = err.response?.data;
      let readable = "❌ Registration failed.";

      if (Array.isArray(data)) {
        const msg = data.map((d) => d.description).join(", ");
        if (msg.toLowerCase().includes("password"))
          readable = "❌ Password must be at least 6 characters and meet requirements.";
        else if (msg.toLowerCase().includes("email"))
          readable = "❌ Invalid email address.";
        else readable = `❌ ${msg}`;
      } else if (typeof data === "string") {
        if (data.toLowerCase().includes("taken"))
          readable = "❌ Email already exists.";
        else if (data.toLowerCase().includes("password"))
          readable = "❌ Weak password. Use at least 6 characters.";
        else readable = `❌ ${data}`;
      } else if (data?.message) {
        const msg = data.message.toLowerCase();
        if (msg.includes("taken")) readable = "❌ Email already registered.";
        else if (msg.includes("password")) readable = "❌ Password too weak.";
        else readable = `❌ ${data.message}`;
      }

      setVariant("danger");
      setMessage(readable);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="p-3 border rounded bg-light">
      <h4 className="mb-3">Register</h4>
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
          placeholder="Create a strong password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Form.Group>
      <Button type="submit" className="w-100" variant="success">
        Register
      </Button>
    </Form>
  );
}
