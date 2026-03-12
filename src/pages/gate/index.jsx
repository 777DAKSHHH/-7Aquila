import { useState } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AppIcon from "../../components/AppIcon";

const MASTER_PASSWORD = import.meta.env.VITE_GATE_PASSWORD;

export default function GatePage({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEnter = () => {
    setLoading(true);
    setError("");

    // Small delay to simulate a password check.
    setTimeout(() => {
      if (password === MASTER_PASSWORD) {
        onSuccess();
      } else {
        setError("Incorrect password.");
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8">
        <div className="mb-6 flex justify-center">
          <AppIcon />
        </div>
        <h2 className="mb-6 text-center text-xl text-foreground">
          Master Gate Password
        </h2>
        <p className="mb-4 text-center text-muted-foreground">
          This site is protected. Please enter the password to continue.
        </p>
        <Input
          type="password"
          placeholder="Password"
          value={password}
          autoFocus
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleEnter()}
        />
        {error && <p className="mt-2 text-center text-sm text-error">{error}</p>}
        <Button className="mt-6 w-full" onClick={handleEnter} loading={loading}>
          Enter Site
        </Button>
      </div>
    </div>
  );
}
