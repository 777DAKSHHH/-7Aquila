import { useState } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AppIcon from "../../components/AppIcon";

const MASTER_PASSWORD = "VII I MMVI";

export default function GatePage({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEnter = () => {
    setLoading(true);
    setError("");

    // A small delay to simulate a check
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
      <div className="w-full max-w-md p-8 bg-card rounded-xl border border-border">
        <div className="flex justify-center mb-6">
          <AppIcon />
        </div>
        <h2 className="text-xl text-center text-foreground mb-6">
          Master Gate Password
        </h2>
        <p className="text-center text-muted-foreground mb-4">
          This site is protected. Please enter the password to continue.
        </p>
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleEnter()}
        />
        {error && <p className="text-sm text-error mt-2 text-center">{error}</p>}
        <Button
          className="mt-6 w-full"
          onClick={handleEnter}
          loading={loading}
        >
          Enter Site
        </Button>
      </div>
    </div>
  );
}