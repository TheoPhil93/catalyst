import type { Version } from "@/types";

export const mockVersions: Version[] = [
  { id: "v1", org: "SBB", name: "FDK 13.2.1", semver: "13.2.1", status: "active", date: "2026-01-20", author: "System" },
  { id: "v2", org: "AB",  name: "FDK 13.1.1", semver: "13.1.1", status: "archived", date: "2026-01-10", author: "P. Weber" },
];
