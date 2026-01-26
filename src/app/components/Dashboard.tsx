import {
  Download,
  Upload,
  GitCompare,
  History,
  FileText,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { PageHeader } from "@/app/components/patterns/PageHeader";
import { StatCard } from "@/app/components/patterns/StatCard";

export function Dashboard() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 bg-background text-foreground">
      {/* Header */}
      <PageHeader
        title="Overview"
        description="Governance status for SBB Infrastructure"
        actions={
          <>
            <Button variant="outline" className="h-9">
              <Download className="h-4 w-4 mr-2" /> Export Report
            </Button>
            <Button className="h-9">
              <Upload className="h-4 w-4 mr-2" /> Upload New Version
            </Button>
          </>
        }
      />

      {/* Hero + Quick Stats */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <Card className="border-border shadow-sm relative overflow-hidden group bg-card">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />

            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="secondary"
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md px-2 py-0.5"
                    >
                      Active Production
                    </Badge>
                    <span className="text-xs text-muted-foreground">Deployed 2d ago</span>
                  </div>
                  <CardTitle className="text-3xl font-bold text-foreground">FDK 13.1.2</CardTitle>
                </div>

                <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-muted">
                  View details <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-3 gap-8 py-4 border-t border-border/60 mt-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Author
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                      HM
                    </div>
                    <span className="text-sm font-medium text-foreground">Hans Müller</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Validation Score
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-foreground">100% Passing</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Changeset
                  </p>
                  <p className="text-sm font-medium text-foreground mt-2 font-mono">
                    156 objects modified
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-4 space-y-6">
          <StatCard
            label="Pending Approvals"
            value="8"
            icon={<FileText className="h-5 w-5" />}
            trend={{ value: "Needs action", intent: "negative", label: "Awaiting reviewer sign-off" }}
          />

          <StatCard
            label="Total Versions"
            value="127"
            icon={<History className="h-5 w-5" />}
            trend={{ value: "Stable", intent: "neutral", label: "Across all releases" }}
          />
        </div>
      </div>

      {/* Workflows */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-4">Workflows</h3>

        <div className="grid grid-cols-4 gap-4">
          {[
            { title: "Upload Catalog", desc: "Import .xlsx / .xml", icon: Upload },
            { title: "Compare Versions", desc: "Diff detection", icon: GitCompare },
            { title: "Staging Review", desc: "8 pending items", icon: Activity },
            { title: "Governance Log", desc: "Audit trail", icon: FileText },
          ].map((action) => (
            <button
              key={action.title}
              className="flex flex-col p-4 bg-card border border-border rounded-lg hover:border-ring/40 hover:bg-muted/20 hover:shadow-sm transition-all text-left group"
            >
              <div className="mb-3 p-2 w-fit rounded-md bg-muted/30 text-muted-foreground group-hover:text-foreground group-hover:bg-muted transition-colors">
                <action.icon className="h-5 w-5" />
              </div>
              <span className="font-medium text-foreground">{action.title}</span>
              <span className="text-xs text-muted-foreground mt-1">{action.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
