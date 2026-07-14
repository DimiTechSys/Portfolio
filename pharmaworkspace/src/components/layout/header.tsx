"use client";

import { useState } from "react";
import { cn, initials } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CheckSquare, AlertTriangle, MessageSquare, Square, Package, X, Home, LogOut } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useClockInGeofence } from "@/components/work-sessions/use-clock-in-geofence";
import { describeGeofence } from "@/components/work-sessions/geofence-status";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/audit/actions";
import { useNotifications } from "@/contexts/notifications-context";
import { toast } from "sonner";
import { EndSessionDialog } from "@/components/session/end-session-dialog";
import { getNotificationTargetUrl } from "@/lib/notification-url";
import { ProfileSheet } from "@/components/layout/profile-bar";
import { MissionsLauncher } from "@/components/onboarding/missions-launcher";
import { useSignedUrl } from "@/lib/storage/get-signed-url";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface HeaderProps {
  title?: string;
  firstName: string;
  lastName: string;
  onSignOut?: () => void;
  className?: string;
  avatarPath?: string | null;
}

export function Header({
  title,
  firstName,
  lastName,
  onSignOut,
  className,
  avatarPath,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const fullName = `${firstName} ${lastName}`;
  const { data: avatarSignedUrl } = useSignedUrl('attachments', avatarPath ?? undefined);
  const { dayStartedAt, isActive, canManageSession, startSession, endSession } = useSession();
  const geofence = useClockInGeofence();
  const {
    notifications,
    unreadCount,
    loading: loadingNotifications,
    markAsRead,
    deleteNotification,
  } = useNotifications();
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  const handleStartSession = async () => {
    // Geofence actif et hors zone : on informe sans tenter le badge.
    if (geofence.enabled && !geofence.canClockIn) {
      toast.error(describeGeofence(geofence).label);
      geofence.refresh();
      return;
    }
    setStarting(true);
    try {
      const result = await startSession(geofence.geoForClockIn ?? undefined);
      if (result.ok) {
        toast.success("Session démarrée");
      } else if (
        result.error.includes("GEOFENCE_OUT_OF_ZONE") ||
        result.error.includes("GEOFENCE_POSITION_REQUIRED")
      ) {
        void logAudit({
          action: AUDIT_ACTIONS.clockinGeofenceBlocked,
          target_type: AUDIT_TARGET_TYPES.workSession,
          metadata: {
            distance_m: geofence.distanceM,
            radius_m: geofence.radiusM,
            accuracy_m: geofence.accuracyM,
          },
        });
        toast.error("Vous êtes hors de la zone de l'officine. Badgeage non autorisé d'ici.");
      } else {
        toast.error(result.error);
      }
    } finally {
      setStarting(false);
    }
  };

  const handleEndSession = async () => {
    setEnding(true);
    try {
      const result = await endSession();
      if (result.ok) {
        toast.success("Session clôturée");
        setShowEndModal(false);
      } else {
        toast.error(result.error);
      }
    } finally {
      setEnding(false);
    }
  };

  const handleSignOut = async () => {
    if (!onSignOut) return;
    if (isActive) {
      const result = await endSession();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
    }
    await onSignOut();
  };

  const formatRelativeTime = (value: string) => {
    const diffMs = Date.now() - new Date(value).getTime();
    const diffMin = Math.max(0, Math.floor(diffMs / 60000));
    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `il y a ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `il y a ${diffDays} j`;
  };

  const iconByType = (type: string, metadata: Record<string, unknown> | null) => {
    if (metadata?.domain === "rental") return Package;
    if (type === "task_assigned") return CheckSquare;
    if (type === "shortage_reported") return AlertTriangle;
    return MessageSquare;
  };

  const handleNotificationClick = async (notificationId: string, metadata: Record<string, unknown> | null) => {
    setNotifMenuOpen(false);
    await markAsRead(notificationId);
    router.push(getNotificationTargetUrl(metadata));
  };

  const sessionStartTime = dayStartedAt
    ? new Date(dayStartedAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const showMobileBackButton = pathname !== "/dashboard";

  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between bg-white/90 px-4 backdrop-blur lg:h-14 lg:px-6",
        /* Mobile : barre flottante avec bords arrondis */
        "mx-3 mt-3 rounded-[2.25rem] border border-slate-200/70 shadow-sm",
        /* Desktop : bandeau pleine largeur comme avant */
        "lg:mx-0 lg:mt-0 lg:rounded-none lg:border-0 lg:border-b lg:border-slate-200/70 lg:shadow-none",
        className
      )}
    >
      {/* Left: session actions first */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {showMobileBackButton ? (
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 lg:hidden"
            aria-label="Accueil"
          >
            <Home className="h-4 w-4" />
          </button>
        ) : null}
        {!isActive && (
          <button
            onClick={() => void handleStartSession()}
            disabled={starting || !canManageSession}
            className="inline-flex h-9 items-center justify-center rounded-full bg-slate-900 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-60 sm:px-4 sm:text-sm lg:hidden"
          >
            {starting ? "Démarrage..." : "Démarrer ma session"}
          </button>
        )}
        {isActive && (
          <button
            onClick={() => setShowEndModal(true)}
            disabled={ending}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-60 lg:hidden"
            aria-label="Clôturer la session"
          >
            <Square className="h-4 w-4" />
          </button>
        )}
        {isActive && (
          // Pastille compacte (mobile/tablette) : point « radar » animé +
          // Début / Fin sur deux lignes.
          <div
            className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-2 py-1 text-[11px] font-medium text-emerald-700 shadow-sm lg:hidden"
            aria-label={`Session active · début ${sessionStartTime ?? '—'}, fin en cours`}
          >
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="flex flex-col items-start leading-tight">
              <span className="tabular-nums">Début : {sessionStartTime ?? '—'}</span>
              <span className="text-[10px] text-emerald-800/80">Fin : en cours</span>
            </span>
          </div>
        )}
        {title ? <h1 className="truncate text-base font-semibold text-slate-900">{title}</h1> : null}
      </div>

      {/* Right: guide + profile + notifications + logout */}
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
        {/* Lanceur du guide de démarrage (missions d'activation) — à gauche des
            notifications. Se masque seul quand il n'y a plus de mission. */}
        <MissionsLauncher />

        <Link
          href="/profile"
          className="hidden items-center gap-2 rounded-full border border-transparent px-1 py-0.5 transition-colors hover:border-slate-200 hover:bg-slate-50 lg:flex"
          title={fullName}
          aria-label="Ouvrir mon profil"
        >
          <div className="text-right">
            <p className="text-xs font-medium text-gray-700">{fullName}</p>
          </div>
          <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-teal-600 text-[11px] font-semibold text-white shadow-sm">
            {avatarSignedUrl ? (
              <Image src={avatarSignedUrl} alt="Avatar" fill className="object-cover" sizes="36px" />
            ) : (
              initials(fullName)
            )}
          </span>
        </Link>

        <button
          onClick={() => setProfileSheetOpen(true)}
          className="relative hidden h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-teal-600 text-[11px] font-semibold text-white shadow-sm transition-colors hover:ring-2 hover:ring-slate-300 sm:flex lg:hidden"
          title={fullName}
          aria-label="Mon profil"
        >
          {avatarSignedUrl ? (
            <Image src={avatarSignedUrl} alt="Avatar" fill className="object-cover" sizes="36px" />
          ) : (
            initials(fullName)
          )}
        </button>

        <DropdownMenu open={notifMenuOpen} onOpenChange={setNotifMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "relative rounded-full border bg-white p-2 text-slate-500 shadow-sm transition-all hover:text-slate-700",
                unreadCount > 0
                  ? "border-cyan-300/70 bg-cyan-50/60 ring-2 ring-cyan-100 hover:bg-cyan-50"
                  : "border-slate-200 hover:bg-slate-50"
              )}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={10}
            className="w-[calc(100vw-1rem)] max-w-[23.5rem] overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-0 shadow-2xl backdrop-blur sm:w-[23.5rem]"
          >
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-cyan-50/60 to-slate-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-white p-1.5 shadow-sm">
                    <Bell className="h-3.5 w-3.5 text-slate-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">Notifications</p>
                </div>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[11px] text-slate-500">
                  {unreadCount > 0
                    ? `${unreadCount} nouvelle${unreadCount > 1 ? "s" : ""}`
                    : "Tout est à jour"}
                </p>

              </div>
            </div>

            <div className="max-h-[24rem] overflow-y-auto p-2.5">
              {loadingNotifications ? (
                <p className="px-2 py-6 text-center text-sm text-slate-500">Chargement…</p>
              ) : notifications.length === 0 ? (
                <div className="px-2 py-8 text-center">
                  <Bell className="mx-auto h-5 w-5 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">Aucune notification.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {notifications.map((notification) => {
                    const Icon = iconByType(notification.type, notification.metadata);
                    const isUnread = notification.read_at === null;
                    return (
                      <li key={notification.id}>
                        <div
                          className={cn(
                            "relative rounded-2xl border px-3 py-2 shadow-sm transition-all",
                            isUnread
                              ? "border-cyan-200/80 bg-cyan-50/80 hover:-translate-y-[1px] hover:bg-cyan-50"
                              : "border-slate-200/70 bg-white hover:-translate-y-[1px] hover:bg-slate-50"
                          )}
                        >
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              void deleteNotification(notification.id)
                            }}
                            className="absolute right-2 top-2 rounded-full p-1 text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
                            aria-label="Supprimer la notification"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              void handleNotificationClick(notification.id, notification.metadata)
                            }
                            className="flex w-full items-start gap-2 pr-6 text-left"
                          >
                            <div className="mt-0.5 rounded-full bg-white p-1.5 shadow-sm ring-1 ring-slate-100">
                              <Icon className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {notification.title}
                              </p>
                              {notification.body && (
                                <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{notification.body}</p>
                              )}
                              <div className="mt-1 flex items-center justify-between">
                                <p className="text-[11px] text-slate-500">
                                  {formatRelativeTime(notification.created_at)}
                                </p>
                                {isUnread && <span className="h-2 w-2 rounded-full bg-cyan-500" />}
                              </div>
                            </div>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-slate-200 bg-slate-50/50 p-2">
              <Link
                href="/notifications"
                onClick={() => setNotifMenuOpen(false)}
                className="block rounded-xl border border-transparent px-2 py-2 text-center text-xs font-medium text-slate-700 transition-colors hover:border-slate-200 hover:bg-white"
              >
                Voir toutes les notifications
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {onSignOut && (
          <button
            onClick={() => void handleSignOut()}
            className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700 sm:p-2"
            aria-label="Déconnexion"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>

      <EndSessionDialog
        open={showEndModal}
        ending={ending}
        onOpenChange={setShowEndModal}
        onConfirm={handleEndSession}
      />

      <ProfileSheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen} />
    </header>
  );
}
