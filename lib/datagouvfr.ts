export interface RawTender {
  id: string;
  title: string;
  description: string;
  url: string;
  createdAt: string;
}

export async function fetchPublicTenders(keywords: string[] = [], region?: string): Promise<RawTender[]> {
  const query = keywords.length > 0 ? keywords.join("+") : "marches-publics";
  const url = `https://www.data.gouv.fr/api/1/datasets/?tag=marches-publics&q=${encodeURIComponent(query)}&page_size=20`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  const results: RawTender[] = (data.data ?? []).map((d: any) => ({
    id: d.id,
    title: d.title ?? "",
    description: d.description ?? "",
    url: d.page ?? "",
    createdAt: d.created_at ?? new Date().toISOString(),
  }));

  return results;
}

export async function fetchBoampTenders(sector?: string, region?: string): Promise<RawTender[]> {
  const feedUrl = `https://www.boamp.fr/avis/feed?q=${encodeURIComponent(sector ?? "")}`;
  try {
    const res = await fetch(feedUrl);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSSFeed(xml);
  } catch {
    return [];
  }
}

function parseRSSFeed(xml: string): RawTender[] {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
  return items.map((item, i) => {
    const title = item.match(/<title>(.*?)<\/title>/)?.[1] ?? "";
    const description = item.match(/<description>(.*?)<\/description>/)?.[1] ?? "";
    const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? "";
    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? new Date().toISOString();
    return { id: `boamp-${i}-${Date.now()}`, title, description, url: link, createdAt: pubDate };
  });
}
