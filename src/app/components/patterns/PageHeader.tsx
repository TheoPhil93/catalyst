import * as React from "react";

type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={[
        "flex items-start justify-between gap-4",
        "pb-6",
        className ?? "",
      ].join(" ")}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight truncate">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        ) : null}
      </div>

      {actions ? (
        <div className="shrink-0 flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
