import * as React from "react";
import { Card, CardContent } from "@/app/components/ui/card";

type Trend = {
  value: string; // z.B. "+12%" oder "↘ 3%"
  direction?: "up" | "down" | "neutral";
  label?: string; // z.B. "vs last month"
};

type StatCardProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  trend?: Trend;
  className?: string;
};

function trendClass(direction: Trend["direction"]) {
  // Semantikfarben bewusst minimal; kann später tokenisiert werden
  if (direction === "up") return "text-emerald-700";
  if (direction === "down") return "text-rose-700";
  return "text-muted-foreground";
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <Card className={["shadow-sm", className ?? ""].join(" ")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            <div className="mt-1 text-2xl font-semibold text-foreground leading-tight">
              {value}
            </div>

            {trend ? (
              <div className="mt-2 text-xs">
                <span className={["font-medium", trendClass(trend.direction)].join(" ")}>
                  {trend.value}
                </span>
                {trend.label ? (
                  <span className="text-muted-foreground">{" "}{trend.label}</span>
                ) : null}
              </div>
            ) : null}
          </div>

          {icon ? (
            <div className="h-10 w-10 rounded-lg bg-muted/30 border border-border flex items-center justify-center text-muted-foreground shrink-0">
              {icon}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
