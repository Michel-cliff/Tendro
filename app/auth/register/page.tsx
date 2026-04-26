"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Compte créé ! Complétez votre profil.");
      router.push("/onboarding");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="text-lg font-bold text-primary-foreground">B</span>
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
