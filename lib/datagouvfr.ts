export interface RawTender {
  id: string;
  title: string;
  description: string;
  contracting_authority: string;
  region: string;
  deadline: string | null;
  budget: number | null;
  url: string;
  createdAt: string;
}

// French region → INSEE department codes mapping
const REGION_DEPARTMENTS: Record<string, string[]> = {
  "Île-de-France": ["75", "77", "78", "91", "92", "93", "94", "95"],
  "Auvergne-Rhône-Alpes": ["01", "03", "07", "15", "26", "38", "42", "43", "63", "69", "73", "74"],
  "Nouvelle-Aquitaine": ["16", "17", "19", "23", "24", "33", "40", "47", "64", "79", "86", "87"],
  "Occitanie": ["09", "11", "12", "30", "31", "32", "34", "46", "48", "65", "66", "81", "82"],
  "Hauts-de-France": ["02", "59", "60", "62", "80"],
  "Grand Est": ["08", "10", "51", "52", "54", "55", "57", "67", "68", "88"],
  "Provence-Alpes-Côte d'Azur": ["04", "05", "06", "13", "83", "84"],
  "Pays de la Loire": ["44", "49", "53", "72", "85"],
  "Normandie": ["14", "27", "50", "61", "76"],
  "Bretagne": ["22", "29", "35", "56"],
  "Centre-Val de Loire": ["18", "28", "36", "37", "41", "45"],
  "Bourgogne-Franche-Comté": ["21", "25", "39", "58", "70", "71", "89", "90"],
};

// Reverse mapping: dept code → region name for display
const DEPT_TO_REGION = new Map<string, string>();
for (const [region, depts] of Object.entries(REGION_DEPARTMENTS)) {
  for (const dept of depts) DEPT_TO_REGION.set(dept, region);
}

function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function coerceArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  return String(v).split(",").map((s) => s.trim());
}

/**
 * Fetch live French public tender notices from BOAMP via the official
 * OpenDataSoft API (no API key required).
 *
 * Verified fields: idweb, objet, nomacheteur, code_departement,
 *   datelimitereponse, dateparution, descripteur_libelle, url_avis
 */
export async function fetchBoampTenders(
  keywords: string[] = [],
  sector = "",
  region = "",
): Promise<RawTender[]> {
  const conditions: string[] = [
    `dateparution>date'${isoDateDaysAgo(60)}'`,
    // Only "Avis de marché" (opportunities), skip award notices
    `nature in ("APPEL_OFFRE","MARCHE_NEGOCIE")`,
  ];

  const searchTerms = [...keywords, sector]
    .map((k) => k.replace(/"/g, "").trim())
    .filter(Boolean);

  if (searchTerms.length > 0) {
    const parts = searchTerms.map(
      (k) => `search(objet,"${k}") OR search(descripteur_libelle,"${k}")`,
    );
    conditions.push(`(${parts.join(" OR ")})`);
  }

  // Filter by department codes when a known region is requested
  if (region && region !== "National") {
    const depts = REGION_DEPARTMENTS[region];
    if (depts && depts.length > 0) {
      const list = depts.map((d) => `"${d}"`).join(",");
      conditions.push(`code_departement in (${list})`);
    }
  }

  const params = new URLSearchParams({
    where: conditions.join(" AND "),
    select: "idweb,nomacheteur,objet,code_departement,datelimitereponse,dateparution,descripteur_libelle,url_avis,nature_libelle",
    limit: "30",
    order_by: "dateparution DESC",
  });

  const apiUrl = `https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records?${params}`;

  const res = await fetch(apiUrl, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[BOAMP] API error ${res.status}: ${body}`);
    return [];
  }

  const data = await res.json();

  const results: RawTender[] = (data.results ?? []).map((r: any) => {
    const depts = coerceArray(r.code_departement);
    const resolvedRegion =
      depts.length > 0 ? (DEPT_TO_REGION.get(depts[0]) ?? depts.join(", ")) : region;

    const desc = coerceArray(r.descripteur_libelle).join(", ");

    return {
      id: r.idweb ?? `boamp-${Date.now()}-${Math.random()}`,
      title: r.objet ?? "",
      description: desc,
      contracting_authority: r.nomacheteur ?? "",
      region: resolvedRegion,
      deadline: r.datelimitereponse ?? null,
      budget: null, // BOAMP dataset doesn't expose montant as a top-level field
      url: r.url_avis ?? (r.idweb ? `https://www.boamp.fr/pages/avis/?q=idweb:${r.idweb}` : ""),
      createdAt: r.dateparution ?? new Date().toISOString(),
    };
  });

  console.log(
    `[BOAMP] ${results.length} notices fetched (keywords: [${searchTerms.join(", ")}], region: ${region || "all"})`,
  );
  return results;
}

// Legacy alias — redirects to BOAMP
export async function fetchPublicTenders(
  keywords: string[] = [],
  region = "",
): Promise<RawTender[]> {
  return fetchBoampTenders(keywords, "", region);
}
