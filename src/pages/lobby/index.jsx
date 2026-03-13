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
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Light Blue Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 z-0"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
      
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md p-6 relative z-20">
        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8 md:p-10">
          
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-primary ring-4 ring-blue-50 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="scale-125"><AppIcon /></div>
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
            
            <p className="text-center text-sm text-slate-500 font-caption animate-pulse font-medium">
              Status: Pending Approval
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
