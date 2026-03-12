import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import AppIcon from "../../components/AppIcon";

export default function Lobby() {
  const navigate = useNavigate();

  useEffect(() => {
    let channel;
    const setupListener = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel("lobby-channel")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "lobby",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("Lobby update:", payload);

            if (payload.new.status === "approved") {
              navigate("/test-selection-dashboard");
            }
          }
        )
        .subscribe();
    };

    setupListener();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="bg-card border border-border p-8 rounded-xl text-center w-[420px]">

        <AppIcon className="mx-auto mb-4" />

        <h1 className="text-2xl font-heading font-semibold text-foreground mb-4">
          Waiting for Host Approval
        </h1>

        <p className="text-muted-foreground">
          You are in the lobby. The instructor will allow you to enter shortly.
        </p>

        <div className="mt-6 animate-pulse text-sm text-muted-foreground">
          Please wait...
        </div>

      </div>
    </div>
  );
}
