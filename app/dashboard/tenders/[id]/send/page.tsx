"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Tender } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { ArrowLeft, Sparkles, Send, Paperclip } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";

export default function SendPage() {
  const params = useParams();
  const tenderId = params.id as string;
  const [tender, setTender] = useState<Tender | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.from("tenders").select("*").eq("id", tenderId).single().then(({ data }) => {
      setTender(data);
      if (data?.authority_email) setTo(data.authority_email);
    });
  }, [tenderId]);

  async function generateEmail() {
    setGenerating(true);
    try {
      const res = await fetch("/api/email/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tender_id: tenderId }) });
      if (!res.ok) throw new Error("Erreur de génération");
      const data = await res.json();
      setSubject(data.subject);
      setBody(data.body);
      toast.success("Email généré !");
    } catch (err: any) { toast.error(err.message); } finally { setGenerating(false); }
  }

  async function sendEmail() {
    if (!to || !subject || !body) { toast.error("Remplissez tous les champs"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/email/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tender_id: tenderId, to, subject, body }) });
      if (!res.ok) throw new Error("Erreur d'envoi");
      setSent(true);
      toast.success("Email envoyé avec les pièces jointes !");
    } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link href={`/dashboard/tenders/${tenderId}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Envoyer la candidature</h1>
      {tender && <p className="text-gray-500 text-sm mb-6 line-clamp-1">{tender.title}</p>}
      {sent ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><Send className="w-8 h-8 text-green-600" /></div>
          <h2 className="text-lg font-semibold text-green-800 mb-2">Candidature envoyée !</h2>
          <p className="text-sm text-green-600">Votre dossier a été transmis avec les pièces jointes.</p>
          <Link href={`/dashboard/tenders/${tenderId}`} className="inline-block mt-4"><Button variant="secondary">Retour</Button></Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Aperçu de l&apos;email</h2>
            <Button size="sm" variant="secondary" onClick={generateEmail} loading={generating}><Sparkles className="w-3.5 h-3.5" /> Générer avec l&apos;IA</Button>
          </div>
          <Input label="Destinataire" value={to} onChange={(e) => setTo(e.target.value)} placeholder="contact@acheteur.fr" />
          <Input label="Objet" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Candidature à l'appel d'offres..." />
          <Textarea label="Corps du message" value={body} onChange={(e) => setBody(e.target.value)} rows={10} placeholder="Corps de l'email..." />
          <div className="flex items-center gap-2 py-3 px-4 bg-gray-50 rounded-lg">
            <Paperclip className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">DC1.pdf</span>
            <span className="text-gray-300 mx-1">·</span>
            <span className="text-sm text-gray-600">Memoire_Technique.pdf</span>
          </div>
          <Button onClick={sendEmail} loading={loading} className="w-full justify-center" size="lg"><Send className="w-4 h-4" /> Envoyer la candidature</Button>
        </div>
      )}
    </div>
  );
}
