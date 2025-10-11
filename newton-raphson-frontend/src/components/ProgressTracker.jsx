import React from "react";
import { ProgressBar, Button, Alert } from "react-bootstrap";

const ProgressTracker = ({ progress, status, result, onCancel, disabled }) => {
  return (
    <div className="mt-4 p-3 border rounded bg-light">
      <h5>Progress</h5>
      <ProgressBar now={progress} label={`${Math.round(progress)}%`} />
      <div className="mt-3">
        <strong>Status:</strong> {status}
      </div>
      {result && (
        <Alert variant="success" className="mt-3">
          Result ≈ {result.toFixed(6)}
        </Alert>
      )}
      <Button
        variant="danger"
        className="mt-3 w-100"
        onClick={onCancel}
        disabled={disabled}
      >
        Cancel
      </Button>
    </div>
  );
};

export default ProgressTracker;
