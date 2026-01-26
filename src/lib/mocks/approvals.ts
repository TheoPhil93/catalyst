import type { ApprovalStep } from "@/types";

export const mockApprovals: ApprovalStep[] = [
  { id: "a1", requestId: "REQ-2024-001", role: "Uploader", status: "approved", person: "Hans Müller", date: "2026-01-15 10:00", comment: "Uploaded and passed schema validation." },
  { id: "a2", requestId: "REQ-2024-001", role: "Technical Staging", status: "approved", person: "Engineering Team", date: "2026-01-16 14:30", comment: "12/12 Changes accepted in staging review." },
  { id: "a3", requestId: "REQ-2024-001", role: "Domain Expert", status: "current", person: "You (Reviewer)", date: "Pending", comment: null },
  { id: "a4", requestId: "REQ-2024-001", role: "Release Manager", status: "pending", person: "Peter Weber", date: "Pending", comment: null },
];
