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
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden text-foreground">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950"></div>
      
      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>

      <div className="w-full max-w-md p-6 relative z-10">
        <div className="backdrop-blur-xl bg-card/80 border border-white/10 shadow-2xl rounded-2xl p-8 md:p-10 transform transition-all duration-500">
          
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 ring-4 ring-primary/5 shadow-lg shadow-primary/20 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="scale-150"><AppIcon /></div>
            </div>
            <h2 className="text-3xl font-heading font-bold text-foreground text-center mb-2">
              Waiting Room
            </h2>
            <p className="text-muted-foreground text-center font-caption">
              Your instructor will let you in shortly.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-2 py-4">
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            
            <p className="text-center text-sm text-muted-foreground/80 font-caption animate-pulse">
              Status: Pending Approval
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
