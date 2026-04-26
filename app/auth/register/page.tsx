"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import { Mail } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      // Supabase free tier caps outbound emails at ~3/hour.
      // The account is still created — attempt a silent sign-in so the
      // user can continue without waiting for a confirmation email.
      if (error.code === "over_email_send_rate_limit") {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (!signInErr && signInData.session) {
          router.push("/onboarding");
        } else {
          toast.error("Limite d'envoi d'emails atteinte. Réessayez dans quelques minutes ou utilisez les identifiants de démonstration.");
        }
        return;
      }
      setLoading(false);
      toast.error(error.message);
      return;
    }

    setLoading(false);

    if (data.session) {
      // Email confirmation disabled — user is immediately authenticated
      router.push("/onboarding");
    } else {
      // Confirmation email sent successfully
      setEmailSent(true);
    }
  }

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <span className="text-lg font-bold text-primary-foreground">T</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tendro</h1>
          </div>
          <div className="rounded-xl border border-border bg-card p-8 shadow-card text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">Vérifiez votre email</h2>
            <p className="mb-1 text-sm text-muted-foreground">
              Un lien de confirmation a été envoyé à
            </p>
            <p className="mb-6 text-sm font-medium text-foreground">{email}</p>
            <p className="text-xs text-muted-foreground">
              Cliquez sur le lien dans l&apos;email pour activer votre compte et accéder à l&apos;onboarding.
            </p>
            <div className="mt-6 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setEmailSent(false)}
                className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                Utiliser une autre adresse
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="text-lg font-bold text-primary-foreground">T</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tendro</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gérez vos appels d&apos;offres avec l&apos;IA</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-card">
          <h2 className="mb-1 text-lg font-semibold text-foreground">Créer un compte</h2>
          <p className="mb-6 text-sm text-muted-foreground">Commencez à répondre aux marchés publics avec l&apos;IA</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Email professionnel"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.com"
              required
            />
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Au moins 8 caractères"
              minLength={8}
              required
            />
            <Button type="submit" loading={loading} className="w-full justify-center">
              Créer mon compte
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
