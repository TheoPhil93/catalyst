export type ApprovalStatus = "approved" | "current" | "pending" | "rejected";

export type ApprovalStep = {
  id: string;
  requestId: string;
  role: string;
  status: ApprovalStatus;
  person: string;
  date: string;         // ISO oder "Jan 15, 10:00"
  comment?: string | null;
};
