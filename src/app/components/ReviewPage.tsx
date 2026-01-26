import { Check, ShieldCheck, User, FileText, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Textarea } from "@/app/components/ui/textarea";
import { useApprovals } from "@/app/data/useApprovals";

// Wenn du schon Types angelegt hast, kannst du das sauberer machen:
import type { ApprovalStep } from "@/types";
type StepStatus = ApprovalStep["status"];


function getDotColor(status: StepStatus) {
  if (status === "approved") return "bg-emerald-500";
  if (status === "current") return "bg-blue-600";
  if (status === "rejected") return "bg-rose-600";
  return "bg-muted";
}

export function ReviewPage() {
  const requestId = "REQ-2024-001";
  const { data, loading, error } = useApprovals(requestId);

  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error.message}</div>;

  const steps = data ?? [];

  return (
    <div className="p-8 max-w-5xl mx-auto bg-background">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending Action
          </Badge>
          <span className="text-sm text-muted-foreground">Request #{requestId}</span>
        </div>

        <h2 className="text-2xl font-semibold text-foreground">
          Release Approval: FDK 13.2.1
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Final governance sign-off for SBB Infrastructure catalog update.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Left Column: Approval Stream */}
        <div className="col-span-2 space-y-6">
          <div className="relative pl-8 border-l-2 border-border space-y-12">
            {steps.map((step) => (
              <div key={step.id} className="relative">
                {/* Dot on Timeline */}
                <div
                  className={[
                    "absolute -left-[39px] top-1 h-5 w-5 rounded-full border-4 shadow-sm flex items-center justify-center",
                    "border-background",
                    getDotColor(step.status as StepStatus),
                  ].join(" ")}
                >
                  {step.status === "approved" && <Check className="h-2.5 w-2.5 text-white" />}
                </div>

                <div
                  className={[
                    "p-5 rounded-lg border transition-colors",
                    step.status === "current"
                      ? "bg-card border-blue-200 ring-4 ring-blue-50/50 shadow-sm"
                      : "bg-muted/20 border-border",
                  ].join(" ")}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4
                        className={[
                          "text-sm font-semibold",
                          step.status === "current" ? "text-blue-700" : "text-foreground",
                        ].join(" ")}
                      >
                        {step.role}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <User className="h-3 w-3" /> {step.person}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{step.date}</span>
                  </div>

                  {step.comment ? (
                    <div className="text-sm text-foreground/80 bg-background/60 p-3 rounded border border-border mt-3">
                      "{step.comment}"
                    </div>
                  ) : null}

                  {step.status === "current" && (
                    <div className="mt-4 pt-4 border-t border-blue-100">
                      <label className="text-xs font-medium text-foreground/80 mb-2 block">
                        Your Review Decision
                      </label>

                      <Textarea
                        placeholder="Add a comment to your approval decision..."
                        className="bg-background mb-4 text-sm border-border focus-visible:ring-ring/30"
                      />

                      <div className="flex gap-3">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                          <ShieldCheck className="w-4 h-4 mr-2" /> Approve Release
                        </Button>
                        <Button variant="outline" className="text-red-600 hover:bg-red-50 border-red-200">
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {steps.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No approval steps found for request {requestId}.
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Column: Context */}
        <div className="space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-foreground">Change Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/20 rounded border border-border">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground/80">Audit Log</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  View
                </Button>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Changes</span>
                  <span className="font-medium text-foreground">12</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Major Impact</span>
                  <span className="font-medium text-red-600">2</span>
                </div>
              </div>

              <Button variant="outline" className="w-full text-xs" size="sm">
                View Staging Details <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
