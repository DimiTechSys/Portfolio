"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/config/nav";
import { useProfile } from "@/contexts/profile-context";
import { X } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { ChatUnreadBadge } from "@/components/chat/unread-badge";
import { formatSessionClock, formatWorkedElapsedMs } from "@/lib/sessions/time";

export interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  className?: string;
}

export function Sidebar({ open = false, onClose, className }: SidebarProps) {
  const pathname = usePathname();
  const { role } = useProfile();
  const { dayStartedAt, isActive, workedTodayMs } = useSession();

  const sessionDuration = isActive
    ? formatWorkedElapsedMs(workedTodayMs, true)
    : null;

  const isItemActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/35 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[84vw] max-w-72 bg-gradient-to-b from-white via-slate-50 to-cyan-100 shadow-2xl transition-transform duration-200 lg:static lg:w-56 lg:max-w-none lg:translate-x-0 lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 lg:h-14">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-700">
              PharmaWorkspace
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-md p-1 text-slate-500 hover:text-slate-800 lg:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {NAV_GROUPS.map((group) => {
              const visibleItems = group.items.filter(
                (item) => !role || item.roles.includes(role)
              );
              if (visibleItems.length === 0) return null;

              return (
                <div key={group.title} className="mb-6">
                  <p className="mb-2 px-2 text-[10px] font-medium uppercase tracking-widest text-slate-500">
                    {group.title}
                  </p>
                  <ul className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const isActive = isItemActive(item.href);
                      const Icon = item.icon;
                      return (
                        <li
                          key={item.href}
                          className={cn(item.desktopOnly && "hidden lg:block")}
                        >
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors",
                              isActive
                                ? "bg-teal-100 font-medium text-teal-600 shadow-sm"
                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            )}
                          >
                            <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-teal-600" : "text-slate-400")} strokeWidth={isActive ? 2 : 1.5} />
                            <span className="flex-1">{item.label}</span>
                            {item.href === "/chat" ? <ChatUnreadBadge /> : null}
                            {item.badge && item.href !== "/chat" ? (
                              <span className="rounded-md bg-teal-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                {item.badge}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 px-4 py-3 space-y-2">
            <div
              className={cn(
                "flex w-full flex-col items-center gap-1 rounded-2xl border px-3 py-2 text-xs font-medium",
                isActive && sessionDuration
                  ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                  : "border-slate-200 bg-white/70 text-slate-600"
              )}
            >
              <span className="inline-flex items-center gap-2">
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    isActive && sessionDuration ? "bg-emerald-500" : "bg-slate-400"
                  )}
                />
                {isActive && sessionDuration
                  ? `Session active · ${sessionDuration}`
                  : "Session inactive"}
              </span>
              {isActive && dayStartedAt ? (
                <span className="text-[10px] text-emerald-800/80">
                  Début {formatSessionClock(dayStartedAt)} · Fin en cours
                </span>
              ) : null}
            </div>
            <p className="text-[10px] text-slate-500">© {new Date().getFullYear()} PharmaWorkspace</p>
          </div>
        </div>
      </aside>
    </>
  );
}