import jsPDF from "jspdf";

export interface DC1Fields {
  objetMarche: string;
  denominationSociale: string;
  siret: string;
  adresse: string;
  nomRepresentant: string;
  qualiteRepresentant: string;
  date: string;
  signatureBase64?: string;
  logoBase64?: string;
}

export function generateDC1PDF(fields: DC1Fields): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("DC1 - Lettre de candidature", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const left = 20;
  let y = 40;
  const lineH = 10;

  const addField = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label} :`, left, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, left + 70, y);
    y += lineH;
  };

  addField("Objet du marché", fields.objetMarche);
  addField("Dénomination sociale", fields.denominationSociale);
  addField("SIRET", fields.siret);
  addField("Adresse du siège social", fields.adresse);
  addField("Nom du représentant légal", fields.nomRepresentant);
  addField("Qualité du représentant", fields.qualiteRepresentant);
  addField("Date", fields.date);

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Signature :", left, y);

  if (fields.signatureBase64) {
    doc.addImage(fields.signatureBase64, "PNG", left + 70, y - 8, 50, 20);
  }

  if (fields.logoBase64) {
    doc.addImage(fields.logoBase64, "PNG", 150, 10, 40, 20);
  }

  return Buffer.from(doc.output("arraybuffer"));
}

export function generateMemoirePDF(markdownContent: string, logoBase64?: string): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const left = 20;
  const right = 190;
  const lineH = 7;
  let y = 30;

  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", left, 8, 30, 15);
  }

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Mémoire Technique", 105, y, { align: "center" });
  y += 15;

  const lines = markdownContent.split("\n");
  for (const line of lines) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      y += 4;
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(trimmed.replace("## ", ""), left, y);
      y += lineH;
    } else if (trimmed.startsWith("# ")) {
      y += 4;
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text(trimmed.replace("# ", ""), left, y);
      y += lineH;
    } else if (trimmed.startsWith("- ")) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const wrapped = doc.splitTextToSize(`• ${trimmed.slice(2)}`, right - left);
      doc.text(wrapped, left + 4, y);
      y += lineH * wrapped.length;
    } else if (trimmed.length > 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const wrapped = doc.splitTextToSize(trimmed, right - left);
      doc.text(wrapped, left, y);
      y += lineH * wrapped.length;
    } else {
      y += 4;
    }
  }

  return Buffer.from(doc.output("arraybuffer"));
}
