import { useState } from "react";
import {
  LayoutTemplate,
  Calendar,
  Download,
  Filter,
  ChevronDown,
  ShieldAlert,
  Layers,
  Activity,
  Banknote,
  GitPullRequest,
  Search,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { PageHeader } from "@/app/components/patterns/PageHeader";
import { StatCard } from "@/app/components/patterns/StatCard";

// --- Types / Constants ---
type TabID = "volume" | "risk" | "governance" | "quality" | "lifecycle" | "benchmarks" | "portfolio" | "financial";

const TABS: { id: TabID; label: string; icon: any }[] = [
  { id: "volume", label: "Change Volume", icon: Activity },
  { id: "risk", label: "Risk & Impact", icon: ShieldAlert },
  { id: "governance", label: "Governance", icon: GitPullRequest },
  { id: "quality", label: "Data Quality", icon: Layers },
  { id: "lifecycle", label: "Asset Lifecycle", icon: Layers },
  { id: "benchmarks", label: "Benchmarks", icon: Layers },
  { id: "portfolio", label: "Portfolio", icon: LayoutTemplate },
  { id: "financial", label: "Financials", icon: Banknote },
];

const ORGS = ["SBB", "AB", "AVA", "RBS", "R+P"];

// --- Reusable Panels ---

const InsightPanel = ({ insights }: { insights: string[] }) => (
  <Card className="h-full bg-muted/20 border-border shadow-none">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-500 fill-current" /> Key Insights
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-4">
        {insights.map((insight, i) => (
          <li key={i} className="text-xs text-foreground/80 leading-relaxed pl-3 border-l-2 border-border">
            {insight}
          </li>
        ))}
      </ul>

      <Button variant="link" className="mt-4 p-0 h-auto text-xs text-primary">
        View detailed report <ArrowRight className="w-3 h-3 ml-1" />
      </Button>
    </CardContent>
  </Card>
);

// --- CSS Charts ---

const TrendChart = () => (
  <div className="h-64 w-full flex items-end justify-between gap-1 pt-8 pb-2 px-2">
    {[35, 42, 38, 55, 62, 48, 52, 68, 75, 60, 85, 92].map((h, i) => (
      <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-1 rounded border border-border opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
          Week {i + 1}: {h} Changes
        </div>

        <div className="w-full bg-blue-500 rounded-t-sm opacity-90" style={{ height: `${h * 0.6}%` }} />
        <div className="w-full bg-blue-300" style={{ height: `${h * 0.3}%` }} />
        <div className="w-full bg-muted rounded-b-sm" style={{ height: `${h * 0.1}%` }} />
      </div>
    ))}
  </div>
);

const HeatMap = () => (
  <div className="grid grid-cols-6 gap-1 h-64">
    {Array.from({ length: 24 }).map((_, i) => {
      const risk = Math.random();
      const color = risk > 0.8 ? "bg-rose-500" : risk > 0.5 ? "bg-orange-400" : "bg-emerald-100";
      return (
        <div
          key={i}
          className={`${color} rounded-sm relative group cursor-pointer hover:ring-2 ring-ring ring-offset-2 ring-offset-background transition-all`}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-[10px] font-bold text-background bg-foreground/20">
            Module {i + 1}
          </div>
        </div>
      );
    })}
  </div>
);

const FunnelChart = () => (
  <div className="h-64 flex items-center justify-center gap-2">
    {[
      { label: "Upload", val: 100, color: "bg-muted" },
      { label: "Validation", val: 92, color: "bg-blue-100" },
      { label: "Tech Review", val: 78, color: "bg-blue-300" },
      { label: "Approved", val: 65, color: "bg-blue-500" },
      { label: "Active", val: 62, color: "bg-emerald-500" },
    ].map((step, i) => (
      <div key={i} className="flex flex-col items-center gap-2">
        <div
          className={`${step.color} w-16 rounded-md flex items-end justify-center pb-2 text-xs font-bold text-foreground/80 transition-all hover:-translate-y-1`}
          style={{ height: `${(step.val / 100) * 200}px` }}
        >
          {step.val}
        </div>
        <span className="text-[10px] uppercase font-medium text-muted-foreground">{step.label}</span>
      </div>
    ))}
  </div>
);

const BenchmarkTable = () => (
  <div className="space-y-3 pt-2">
    {ORGS.map((org, i) => (
      <div key={org} className="flex items-center gap-4 text-sm">
        <span className="w-12 font-bold text-foreground/80">{org}</span>
        <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${85 - i * 10 + Math.random() * 10}%` }} />
        </div>
        <span className="w-8 text-right font-mono text-muted-foreground">{85 - i * 10}%</span>
      </div>
    ))}
  </div>
);

// --- Tabs Content ---

const TabContentVolume = () => (
  <div className="grid grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2">
    <div className="col-span-12 grid grid-cols-3 gap-6">
      <StatCard
        label="Changes per Release"
        value="42.5"
        trend={{ value: "+12%", intent: "positive", label: "Avg over last 3 releases" }}
      />
      <StatCard
        label="Change Velocity"
        value="8.2"
        trend={{ value: "+5%", intent: "positive", label: "Changes per week" }}
      />
      <StatCard
        label="Major Rate"
        value="18%"
        trend={{ value: "-2%", intent: "positive", label: "% of breaking changes" }}
      />
    </div>

    <div className="col-span-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Change Volume Trend</CardTitle>
          <CardDescription>Weekly change requests by type</CardDescription>
        </CardHeader>
        <CardContent>
          <TrendChart />
          <div className="flex justify-center gap-6 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" /> Major
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-300" /> Minor
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-muted" /> Patch
            </span>
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="col-span-4">
      <InsightPanel
        insights={[
          "Change velocity peaked in Week 11 due to the 'SBB Signal Modernization' initiative.",
          "Major rate is decreasing, indicating stabilizing schemas across organizations.",
          "AB and RBS contributed to 40% of the minor changes this month.",
        ]}
      />
    </div>
  </div>
);

const TabContentRisk = () => (
  <div className="grid grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2">
    <div className="col-span-12 grid grid-cols-3 gap-6">
      <StatCard
        label="Critical Asset Changes"
        value="12"
        trend={{ value: "+3", intent: "negative", label: "Signals & Track Geometry" }}
      />
      <StatCard
        label="Hotspot Score"
        value="High"
        trend={{ value: "Stable", intent: "neutral", label: "Module: Signaling_v2" }}
      />
      <StatCard
        label="Safety Impact"
        value="4.5%"
        trend={{ value: "-1%", intent: "positive", label: "% touching safety fields" }}
      />
    </div>

    <div className="col-span-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Risk Heatmap (Module x Severity)</CardTitle>
          <CardDescription>Visualizing high-risk change clusters</CardDescription>
        </CardHeader>
        <CardContent>
          <HeatMap />
          <div className="mt-4 text-xs text-muted-foreground flex justify-between">
            <span>Low Risk (Style changes)</span>
            <span>High Risk (Semantics/Schema)</span>
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="col-span-4">
      <InsightPanel
        insights={[
          "High churn detected in 'Signaling_v2' module suggests technical debt or unclear requirements.",
          "Two breaking changes in 'Track Geometry' require additional safety review.",
          "R+P has 0 critical changes this cycle.",
        ]}
      />
    </div>
  </div>
);

const TabContentGovernance = () => (
  <div className="grid grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2">
    <div className="col-span-12 grid grid-cols-3 gap-6">
      <StatCard label="Lead Time (Avg)" value="4.2d" trend={{ value: "-0.5d", intent: "positive", label: "Upload to Active" }} />
      <StatCard label="SLA Compliance" value="94%" trend={{ value: "+2%", intent: "positive", label: "Approvals within 48h" }} />
      <StatCard label="Rework Ratio" value="15%" trend={{ value: "-5%", intent: "positive", label: "Resubmissions needed" }} />
    </div>

    <div className="col-span-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Approval Funnel</CardTitle>
          <CardDescription>Throughput from draft to harmonization</CardDescription>
        </CardHeader>
        <CardContent>
          <FunnelChart />
        </CardContent>
      </Card>
    </div>

    <div className="col-span-4">
      <InsightPanel
        insights={[
          "The 'Technical Reviewer' stage is the current bottleneck (avg. 1.8 days).",
          "Rejection rate dropped by 5% after the new validation rules were deployed.",
          "SBB approvals are 20% faster than the cross-org average.",
        ]}
      />
    </div>
  </div>
);

const TabContentBenchmarks = () => (
  <div className="grid grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2">
    <div className="col-span-12 grid grid-cols-3 gap-6">
      <StatCard label="Maturity Score" value="82/100" trend={{ value: "+4", intent: "positive", label: "Composite Index" }} />
      <StatCard label="Standardization" value="High" trend={{ value: "Stable", intent: "neutral", label: "Naming & Structure" }} />
      <StatCard label="Throughput" value="12/wk" trend={{ value: "+2", intent: "positive", label: "Avg changes processed" }} />
    </div>

    <div className="col-span-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Governance Maturity Score</CardTitle>
          <CardDescription>Comparative analysis per organization</CardDescription>
        </CardHeader>
        <CardContent>
          <BenchmarkTable />
        </CardContent>
      </Card>
    </div>

    <div className="col-span-4">
      <InsightPanel
        insights={[
          "SBB leads in maturity due to automated testing integration.",
          "AB has improved standardization score significantly (+15%) this quarter.",
          "AVA requires support in reducing 'Major' breaking changes.",
        ]}
      />
    </div>
  </div>
);

// --- Main ---
export function ManagementDashboard() {
  const [activeTab, setActiveTab] = useState<TabID>("volume");
  const [dateRange] = useState("Last 30 Days");
  const [selectedOrg] = useState("All Organizations");

  return (
    <div className="flex flex-col h-full bg-background font-sans text-foreground selection:bg-muted">
      {/* Sticky Header (uses PageHeader pattern) */}
      <div className="border-b border-border bg-card px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <PageHeader
          className="w-full items-start"
          title={
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground">
                <LayoutTemplate className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight text-foreground">Executive Dashboard</div>
                <div className="text-xs text-muted-foreground font-medium">Catalyst Platform</div>
              </div>
            </div>
          }
          actions={
            <div className="flex items-center gap-3">
              <Button variant="outline" className="h-9 text-xs border-border bg-muted/20">
                <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                {selectedOrg}
                <ChevronDown className="w-3 h-3 ml-2 opacity-60" />
              </Button>

              <Button variant="outline" className="h-9 text-xs border-border bg-muted/20">
                <Calendar className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                {dateRange}
                <ChevronDown className="w-3 h-3 ml-2 opacity-60" />
              </Button>

              <div className="h-6 w-px bg-border mx-2" />

              <Button className="h-9 text-xs">
                <Download className="w-3.5 h-3.5 mr-2" /> Export Report
              </Button>
            </div>
          }
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 max-w-[1600px] mx-auto w-full">
        <Tabs defaultValue="volume" className="space-y-8" onValueChange={(v) => setActiveTab(v as TabID)}>
          <TabsList className="bg-card border border-border p-1 h-12 w-full justify-start rounded-lg shadow-sm">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="h-10 px-4 text-xs font-medium rounded-md transition-all flex items-center gap-2 text-muted-foreground
                           data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="min-h-[500px]">
            <TabsContent value="volume" className="m-0 focus-visible:outline-none">
              <TabContentVolume />
            </TabsContent>

            <TabsContent value="risk" className="m-0 focus-visible:outline-none">
              <TabContentRisk />
            </TabsContent>

            <TabsContent value="governance" className="m-0 focus-visible:outline-none">
              <TabContentGovernance />
            </TabsContent>

            <TabsContent value="benchmarks" className="m-0 focus-visible:outline-none">
              <TabContentBenchmarks />
            </TabsContent>

            {["quality", "lifecycle", "portfolio", "financial"].map((t) => (
              <TabsContent key={t} value={t} className="m-0 focus-visible:outline-none">
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg bg-muted/20">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <Search className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">Module Available in Full Version</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md text-center">
                    This analytics module ({t}) is configured but currently awaiting data connection.
                  </p>
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
