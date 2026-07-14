"use client";

import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

export interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: { value: number; label?: string };
  tone?: "default" | "red" | "orange" | "blue" | "green";
  className?: string;
}

export function KpiCard({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  tone = "default",
  className,
}: KpiCardProps) {
  const trendIsPositive = trend && trend.value >= 0;
  const toneStyles = {
    default: {
      border: "border-gray-200",
      topAccent: "before:bg-gray-300",
      value: "text-gray-900",
      icon: "text-gray-400",
    },
    red: {
      border: "border-red-200",
      topAccent: "before:bg-red-500",
      value: "text-red-600",
      icon: "text-red-500",
    },
    orange: {
      border: "border-orange-200",
      topAccent: "before:bg-orange-500",
      value: "text-orange-600",
      icon: "text-orange-500",
    },
    blue: {
      border: "border-sky-200",
      topAccent: "before:bg-sky-500",
      value: "text-sky-600",
      icon: "text-sky-500",
    },
    green: {
      border: "border-emerald-200",
      topAccent: "before:bg-emerald-500",
      value: "text-emerald-600",
      icon: "text-emerald-500",
    },
  }[tone];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white p-5",
        "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:rounded-t-2xl",
        "transition-shadow hover:shadow-sm",
        toneStyles.border,
        toneStyles.topAccent,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>
        {Icon && (
          <Icon className={cn("h-4 w-4", toneStyles.icon)} strokeWidth={1.5} />
        )}
      </div>

      <p className={cn("mt-2 text-2xl font-semibold tracking-tight", toneStyles.value)}>
        {value}
      </p>

      {(subtitle || trend) && (
        <div className="mt-1.5 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "text-xs font-medium",
                trendIsPositive ? "text-gray-700" : "text-gray-500"
              )}
            >
              {trendIsPositive ? "+" : ""}
              {trend.value}%{trend.label ? ` ${trend.label}` : ""}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-gray-400">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}


// ============================================================================
// FILE: src/components/shared/status-badge.tsx
// ============================================================================
