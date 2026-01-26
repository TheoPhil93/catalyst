export type ChangeType = "major" | "minor" | "patch";

export type ChangeItem = {
  id: string;
  org: string;
  versionFrom?: string;
  versionTo?: string;
  type: ChangeType;
  entity: string;       // z.B. "Signal", "Track"
  field?: string;       // z.B. "height"
  description: string;
  createdAt: string;    // ISO
  risk?: "low" | "medium" | "high";
};
