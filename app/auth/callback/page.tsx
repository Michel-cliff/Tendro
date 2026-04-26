"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Vérification en cours…");

  useEffect(() => {
    async function handle() {
      try {
        // Exchange the PKCE code for a real session (email confirmation link)
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // If Supabase used the implicit (hash) flow the client already
        // picked up the tokens — just verify the session exists.
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setStatus("Session invalide. Redirection…");
          router.replace("/auth/login");
          return;
        }

        // Route based on whether onboarding is complete
        const { data: company } = await supabase
          .from("companies")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (company) {
          router.replace("/dashboard");
        } else {
          setStatus("Compte confirmé ! Finalisons votre profil…");
          router.replace("/onboarding");
        }
      } catch {
        setStatus("Lien invalide ou expiré. Redirection vers la connexion…");
        setTimeout(() => router.replace("/auth/login"), 2000);
      }
    }

    handle();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
