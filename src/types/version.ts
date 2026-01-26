export type VersionStatus = "active" | "draft" | "archived";

export type Version = {
  id: string;
  org: string;          // "SBB", "AB", ...
  name: string;         // "FDK 13.2.1"
  semver?: string;      // "13.2.1"
  status: VersionStatus;
  date: string;         // ISO oder "Jan 15"
  author: string;
};
