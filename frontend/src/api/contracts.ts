import { apiClient } from "./client";
import type { Contract, ContractEntity, ClauseLabel, Risk } from "../types";

export async function uploadContract(
  file: File,
  onProgress?: (percent: number) => void
): Promise<Contract> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiClient.post<Contract>("/contracts/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });
  return res.data;
}

export async function listContracts(): Promise<Contract[]> {
  const res = await apiClient.get<Contract[]>("/contracts/");
  return res.data;
}

export async function getContract(id: number): Promise<Contract> {
  const res = await apiClient.get<Contract>(`/contracts/${id}`);
  return res.data;
}

export async function deleteContract(id: number): Promise<void> {
  await apiClient.delete(`/contracts/${id}`);
}

export function getDownloadUrl(id: number): string {
  return `${apiClient.defaults.baseURL}/contracts/${id}/download`;
}

// NOTE: these two assume the GET /contracts/{id}/entities and
// GET /contracts/{id}/clauses routes from the Phase 5 plan exist on the
// backend. If not yet built, add them to app/api/routes/contracts.py:
//   @router.get("/{contract_id}/entities") -> query ContractEntity by contract_id
//   @router.get("/{contract_id}/clauses")  -> join ContractClauseLabel + ContractChunk
export async function getContractEntities(id: number): Promise<ContractEntity[]> {
  const res = await apiClient.get<ContractEntity[]>(`/contracts/${id}/entities`);
  return res.data;
}

export async function getContractClauses(id: number): Promise<ClauseLabel[]> {
  const res = await apiClient.get<ClauseLabel[]>(`/contracts/${id}/clauses`);
  return res.data;
}

export async function analyzeRisks(id: number): Promise<Risk[]> {
  const res = await apiClient.post<Risk[]>(`/contracts/${id}/analyze-risks`);
  return res.data;
}

export async function getRisks(id: number): Promise<Risk[]> {
  const res = await apiClient.get<Risk[]>(`/contracts/${id}/risks`);
  return res.data;
}
