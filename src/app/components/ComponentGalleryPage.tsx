import { PageHeader } from "@/app/components/patterns/PageHeader";
import { StatCard } from "@/app/components/patterns/StatCard";

import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Switch } from "@/app/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

import { Search, Plus, Download, Settings, AlertTriangle, CheckCircle2, Activity } from "lucide-react";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-foreground">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function ComponentGalleryPage() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 bg-background text-foreground">
      <PageHeader
        title="Component Gallery"
        description="Visual regression playground: tokens, spacing, typography, and component variants."
        actions={
          <>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Variant
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Left: components */}
        <div className="col-span-8 space-y-6">
          <Section title="Buttons" description="Check hover, focus ring, disabled, sizing, variants.">
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button disabled>Disabled</Button>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <Button size="sm">
                <Search className="h-4 w-4 mr-2" />
                Small
              </Button>
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Default
              </Button>
              <Button size="lg">Large</Button>
            </div>
          </Section>

          <Section title="Badges" description="Outline / secondary / semantic examples.">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">Success</Badge>
              <Badge className="bg-rose-50 text-rose-700 border border-rose-200">Error</Badge>
              <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200">Warning</Badge>
            </div>
          </Section>

          <Section title="Inputs & Forms" description="Spacing, focus ring, placeholder and label styles.">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <Input placeholder="Search..." />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="you@company.com" />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Description</Label>
                <Textarea placeholder="Write something..." className="min-h-[90px]" />
              </div>

              <div className="flex items-center gap-3">
                <Switch defaultChecked />
                <span className="text-sm text-muted-foreground">Feature enabled</span>
              </div>
            </div>
          </Section>

          <Section title="Tabs" description="Check active styles and contrast.">
            <Tabs defaultValue="a" className="w-full">
              <TabsList className="w-full justify-start bg-card border border-border rounded-lg p-1">
                <TabsTrigger value="a">Overview</TabsTrigger>
                <TabsTrigger value="b">Details</TabsTrigger>
                <TabsTrigger value="c">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="a" className="mt-4 text-sm text-muted-foreground">
                Overview content (typography + spacing check).
              </TabsContent>
              <TabsContent value="b" className="mt-4 text-sm text-muted-foreground">
                Details content (more text, longer line length).
              </TabsContent>
              <TabsContent value="c" className="mt-4 text-sm text-muted-foreground">
                Settings content (controls).
              </TabsContent>
            </Tabs>
          </Section>

          <Section title="Cards" description="Card background, border, spacing, title sizes.">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">Card Title</CardTitle>
                  <CardDescription>Card description text.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Content body. Check padding and muted text.
                </CardContent>
              </Card>

              <Card className="border-border bg-muted/20">
                <CardHeader>
                  <CardTitle className="text-base">Muted Surface</CardTitle>
                  <CardDescription>Background variant for sections.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Useful for highlight panels (insights, warnings).
                </CardContent>
              </Card>
            </div>
          </Section>

          <Section title="Table (simple)" description="Quick density check (headers, borders, alignment).">
            <div className="overflow-x-auto border border-border rounded-lg bg-card">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/30">
                  <tr className="border-b border-border">
                    <th className="text-left px-3 py-2 font-semibold text-foreground">Name</th>
                    <th className="text-left px-3 py-2 font-semibold text-foreground">Status</th>
                    <th className="text-right px-3 py-2 font-semibold text-foreground">Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "FDK 13.2.1", status: "Active", changes: 42 },
                    { name: "FDK 13.2.0", status: "Archived", changes: 18 },
                    { name: "FDK 13.1.9", status: "Draft", changes: 9 },
                  ].map((r) => (
                    <tr key={r.name} className="border-b border-border/60 hover:bg-muted/10">
                      <td className="px-3 py-2 text-foreground">{r.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.status}</td>
                      <td className="px-3 py-2 text-right font-mono text-foreground">{r.changes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>

        {/* Right: tokens & patterns */}
        <div className="col-span-4 space-y-6">
          <Section title="Patterns: StatCard" description="Your extracted pattern component.">
            <div className="space-y-4">
              <StatCard
                label="Changes (30d)"
                value="248"
                icon={<Activity className="h-5 w-5" />}
                trend={{ value: "+12%", intent: "positive", label: "vs last month" }}
              />
              <StatCard
                label="Pending approvals"
                value="19"
                icon={<AlertTriangle className="h-5 w-5" />}
                trend={{ value: "Needs action", intent: "negative", label: "review backlog" }}
              />
              <StatCard
                label="Data quality"
                value="99.2%"
                icon={<CheckCircle2 className="h-5 w-5" />}
                trend={{ value: "Stable", intent: "neutral", label: "7d window" }}
              />
            </div>
          </Section>

          <Section title="Token quick check" description="Surfaces & text should look correct in light/dark.">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded border border-border bg-background">
                <div className="font-semibold text-foreground">bg-background</div>
                <div className="text-muted-foreground mt-1">text-muted-foreground</div>
              </div>

              <div className="p-3 rounded border border-border bg-card">
                <div className="font-semibold text-foreground">bg-card</div>
                <div className="text-muted-foreground mt-1">border-border</div>
              </div>

              <div className="p-3 rounded border border-border bg-muted/20">
                <div className="font-semibold text-foreground">bg-muted/20</div>
                <div className="text-muted-foreground mt-1">subtle surface</div>
              </div>

              <div className="p-3 rounded border border-border bg-primary text-primary-foreground">
                <div className="font-semibold">bg-primary</div>
                <div className="opacity-90 mt-1">text-primary-foreground</div>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
