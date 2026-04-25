"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Tender } from "@/types";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Sparkles, Download, FileText } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

interface DC1Fields { objetMarche: string; denominationSociale: string; siret: string; adresse: string; nomRepresentant: string; qualiteRepresentant: string; date: string; }

export default function DocumentsPage() {
  const params = useParams();
  const tenderId = params.id as string;
  const [tender, setTender] = useState<Tender | null>(null);
  const [dc1, setDc1] = useState<DC1Fields | null>(null);
  const [loadingDc1, setLoadingDc1] = useState(false);
  const [loadingMemoire, setLoadingMemoire] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfUrls, setPdfUrls] = useState<{ dc1?: string; memoire?: string } | null>(null);

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Cliquez sur 'Générer avec l'IA' pour créer votre mémoire technique..." })],
    content: "",
    editorProps: { attributes: { class: "prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4" } },
  });

  useEffect(() => {
    supabase.from("tenders").select("*").eq("id", tenderId).single().then(({ data }) => setTender(data));
  }, [tenderId]);

  async function generateDC1() {
    setLoadingDc1(true);
    try {
      const res = await fetch("/api/documents/dc1", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tender_id: tenderId }) });
      if (!res.ok) throw new Error("Erreur de génération DC1");
      setDc1(await res.json());
      toast.success("DC1 pré-rempli !");
    } catch (err: any) { toast.error(err.message); } finally { setLoadingDc1(false); }
  }

  async function generateMemoire() {
    setLoadingMemoire(true);
    try {
      const res = await fetch("/api/documents/memoire", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tender_id: tenderId }) });
      if (!res.ok) throw new Error("Erreur de génération mémoire");
      const data = await res.json();
      editor?.commands.setContent(data.content);
      toast.success("Mémoire technique généré !");
    } catch (err: any) { toast.error(err.message); } finally { setLoadingMemoire(false); }
  }

  async function generatePDF() {
    setLoadingPdf(true);
    try {
      const res = await fetch("/api/documents/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tender_id: tenderId, dc1_fields: dc1, memoire_content: editor?.getText() ?? "" }),
      });
      if (!res.ok) throw new Error("Erreur de génération PDF");
      setPdfUrls(await res.json());
      toast.success("PDFs générés avec signature !");
    } catch (err: any) { toast.error(err.message); } finally { setLoadingPdf(false); }
  }

  return (
    <div className="p-8 max-w-6xl">
      <Link href={`/dashboard/tenders/${tenderId}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Génération des documents</h1>
      {tender && <p className="text-gray-500 text-sm mb-6 line-clamp-1">{tender.title}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> DC1</h2>
            <Button size="sm" onClick={generateDC1} loading={loadingDc1}><Sparkles className="w-3.5 h-3.5" /> Générer</Button>
          </div>
          {dc1 ? (
            <div className="space-y-3">
              {(Object.entries(dc1) as [keyof DC1Fields, string][]).map(([key, val]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-32 shrink-0 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <input value={val} onChange={(e) => setDc1({ ...dc1, [key]: e.target.value })} className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400"><FileText className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">Cliquez sur Générer pour pré-remplir depuis votre profil</p></div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><FileText className="w-5 h-5 text-green-600" /> Mémoire technique</h2>
            <Button size="sm" variant="secondary" onClick={generateMemoire} loading={loadingMemoire}><Sparkles className="w-3.5 h-3.5" /> Générer avec l&apos;IA</Button>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden"><EditorContent editor={editor} /></div>
        </div>
      </div>
      <div className="mt-6 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Générer les PDFs finaux</h2>
            <p className="text-sm text-gray-500 mt-1">DC1 avec signature + Mémoire avec logo</p>
          </div>
          <Button onClick={generatePDF} loading={loadingPdf} size="lg"><Download className="w-4 h-4" /> Valider &amp; Générer PDF</Button>
        </div>
        {pdfUrls && (
          <div className="mt-4 flex gap-3">
            {pdfUrls.dc1 && <a href={pdfUrls.dc1} target="_blank" rel="noopener noreferrer"><Button variant="secondary" size="sm"><Download className="w-3.5 h-3.5" /> DC1.pdf</Button></a>}
            {pdfUrls.memoire && <a href={pdfUrls.memoire} target="_blank" rel="noopener noreferrer"><Button variant="secondary" size="sm"><Download className="w-3.5 h-3.5" /> Memoire_Technique.pdf</Button></a>}
          </div>
        )}
      </div>
    </div>
  );
}
