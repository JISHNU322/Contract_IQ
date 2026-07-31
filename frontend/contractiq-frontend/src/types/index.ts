export type UserRole = "admin" | "legal_reviewer" | "viewer";

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  role: UserRole;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export type ContractStatus = "uploaded" | "processing" | "parsed" | "failed";

export interface ExtractedMetadata {
  pages_count?: number;
  author?: string;
  creator?: string;
  producer?: string;
  subject?: string;
  title?: string;
  paragraphs_count?: number;
  tables_count?: number;
  tables?: { table_index: number; rows: string[][] }[];
  error?: string;
  file_type?: string;
}

export interface Contract {
  id: number;
  filename: string;
  file_size: number;
  status: ContractStatus;
  uploaded_by_id: number;
  uploaded_at: string;
  parsed_text: string | null;
  extracted_metadata: ExtractedMetadata | null;
}

export interface Citation {
  chunk_id: number;
  contract_id: number;
  chunk_text: string;
  similarity: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  pending?: boolean;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
}

export type EntityType = "ORG" | "PERSON" | "DATE" | "MONEY" | "GPE";

export interface ContractEntity {
  id: number;
  contract_id: number;
  entity_type: EntityType;
  entity_text: string;
}

export interface ClauseLabel {
  id: number;
  chunk_id: number;
  clause_type: string;
  confidence_score: number;
  chunk_text?: string;
}

export type RiskSeverity = "low" | "medium" | "high";

export interface Risk {
  risk_type: string;
  severity: RiskSeverity;
  description: string;
  related_chunk_id: number | null;
}

export interface GraphNode {
  id: string;
  label: string;
  type: "Contract" | EntityType | "Clause";
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: "MENTIONS" | "HAS_CLAUSE";
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
