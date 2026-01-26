import type { Version, ApprovalStep, ChangeItem } from "@/types";
import { mockVersions } from "@/app/../lib/mocks/versions"; // falls Pfade anders: "@/lib/mocks/versions"
import { mockApprovals } from "@/app/../lib/mocks/approvals";

const API_MODE = import.meta.env.VITE_API_MODE ?? "mock"; // "mock" | "api"
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async getVersions(): Promise<Version[]> {
    if (API_MODE === "mock") {
      await delay(250);
      return mockVersions;
    }
    return request<Version[]>("/versions");
  },

  async getApprovals(requestId: string): Promise<ApprovalStep[]> {
    if (API_MODE === "mock") {
      await delay(250);
      return mockApprovals.filter((a) => a.requestId === requestId);
    }
    return request<ApprovalStep[]>(`/approvals?requestId=${encodeURIComponent(requestId)}`);
  },

  async getChanges(params?: { org?: string; versionFrom?: string; versionTo?: string }): Promise<ChangeItem[]> {
    if (API_MODE === "mock") {
      await delay(250);
      return []; // später mockChanges
    }
    const q = new URLSearchParams();
    if (params?.org) q.set("org", params.org);
    if (params?.versionFrom) q.set("versionFrom", params.versionFrom);
    if (params?.versionTo) q.set("versionTo", params.versionTo);
    return request<ChangeItem[]>(`/changes?${q.toString()}`);
  },
};
