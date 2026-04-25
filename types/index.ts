export interface Company {
  id: string;
  user_id: string;
  name: string;
  siret: string;
  address?: string;
  sector?: string;
  region?: string;
  revenue?: number;
  employees?: number;
  description?: string;
  signature_url?: string;
  logo_url?: string;
  legal_representative?: string;
  representative_title?: string;
  created_at: string;
}

export interface Tender {
  id: string;
  source: "online" | "email";
  title: string;
  description?: string;
  contracting_authority?: string;
  authority_email?: string;
  deadline?: string;
  budget?: number;
  sector?: string;
  region?: string;
  raw_data?: Record<string, unknown>;
  created_at: string;
}

export interface Match {
  id: string;
  company_id: string;
  tender_id: string;
  score: number;
  reasoning?: string;
  source: "online" | "email";
  status: "new" | "reviewing" | "submitted" | "rejected" | "won";
  created_at: string;
  tender?: Tender;
}

export interface Submission {
  id: string;
  company_id: string;
  tender_id: string;
  dc1_content?: Record<string, unknown>;
  memoire_content?: string;
  bid_price?: number;
  email_subject?: string;
  email_body?: string;
  sent_at?: string;
  pdf_url?: string;
  dc1_pdf_url?: string;
  memoire_pdf_url?: string;
  created_at: string;
}

export interface Rejection {
  id: string;
  company_id: string;
  tender_id: string;
  rejection_doc_url?: string;
  analysis?: string;
  score_breakdown?: Record<string, { score: number; max: number }>;
  improvement_plan?: string[];
  created_at: string;
}

export interface CronConfig {
  id: string;
  company_id: string;
  frequency: "hourly" | "daily" | "weekly";
  keywords: string[];
  sectors: string[];
  regions: string[];
  active: boolean;
  last_run?: string;
  created_at: string;
}

export interface PricingResult {
  floor_price: number;
  market_price: number;
  recommended_price: number;
  confidence: number;
  reasoning: string;
}

export interface RejectionAnalysis {
  score_breakdown: Record<string, { score: number; max: number }>;
  estimated_winner_score: number;
  key_weaknesses: string[];
  improvement_plan: string[];
}
