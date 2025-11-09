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
      setMessage("✅ Registered successfully! You can now log in.");
      setEmail("");
      setPassword("");
    } catch (err) {
      const data = err.response?.data;

      if (Array.isArray(data)) {
        setMessage(data.map((e) => e.description).join(", "));
      } else if (typeof data === "object" && data !== null) {
        setMessage(data.message || "❌ Registration failed.");
      } else if (typeof data === "string") {
        setMessage(data);
      } else {
        setMessage("❌ Registration failed.");
      }

      setVariant("danger");
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@mail.com"
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          required
        />
      </Form.Group>

      <Button type="submit" className="w-100" variant="success">
        Register
      </Button>
    </Form>
  );
}
