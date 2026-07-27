import { apiClient } from "./client";
import type { ChatResponse, GraphData } from "../types";

export async function askAboutContract(
  contractId: number,
  question: string
): Promise<ChatResponse> {
  const res = await apiClient.post<ChatResponse>(`/contracts/${contractId}/chat`, {
    question,
  });
  return res.data;
}

export async function askAcrossContracts(question: string): Promise<ChatResponse> {
  const res = await apiClient.post<ChatResponse>(`/chat`, { question });
  return res.data;
}

export async function getContractGraph(contractId: number): Promise<GraphData> {
  const res = await apiClient.get<GraphData>(`/contracts/${contractId}/graph`);
  return res.data;
}

export async function getGlobalGraph(): Promise<GraphData> {
  const res = await apiClient.get<GraphData>(`/graph`);
  return res.data;
}
