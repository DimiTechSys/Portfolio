import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  ShoppingCart,
  Package,
  AlertTriangle,
  BookUser,
  Settings,
  Users,
  ClipboardList,
  CalendarDays,
  CalendarRange,
  MessageCircle,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

import type { UserRole } from '@/types/index'
import { NAV_MEMBER_ROLES } from '@/lib/auth/roles'

const MEMBER_NAV_ROLES: UserRole[] = [...NAV_MEMBER_ROLES]

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  badge?: string;
  /** Masqué sur mobile / tablette (< lg), ex. pas d’agenda au téléphone */
  desktopOnly?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Général",
    items: [
      {
        label: "Tableau de bord",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: MEMBER_NAV_ROLES,
      },
      {
        label: "Tâches",
        href: "/tasks",
        icon: CheckSquare,
        roles: MEMBER_NAV_ROLES,
      },
      {
        label: "Commandes",
        href: "/orders",
        icon: ShoppingCart,
        roles: MEMBER_NAV_ROLES,
      },
      {
        label: "Salon d'équipe",
        href: "/chat",
        icon: MessageCircle,
        roles: MEMBER_NAV_ROLES,
      },
    ],
  },
  {
    title: "Gestion",
    items: [
      {
        label: "Calendrier",
        href: "/agenda",
        icon: CalendarDays,
        roles: MEMBER_NAV_ROLES,
        desktopOnly: true,
      },
      {
        label: "Planning & congés",
        href: "/planning",
        icon: CalendarRange,
        roles: MEMBER_NAV_ROLES,
      },
      {
        label: "Ordonnances",
        href: "/prescriptions",
        icon: FileText,
        roles: MEMBER_NAV_ROLES,
      },
      {
        label: "Locations matériel",
        href: "/rentals",
        icon: Package,
        roles: MEMBER_NAV_ROLES,
      },
      {
        label: "Ruptures",
        href: "/shortages",
        icon: AlertTriangle,
        roles: MEMBER_NAV_ROLES,
      },
      {
        label: "Annuaire",
        href: "/annuaire",
        icon: BookUser,
        roles: MEMBER_NAV_ROLES,
      },
    ],
  },
  {
    title: "Ressources",
    items: [
      {
        label: "Qualité & proc",
        href: "/procedures",
        icon: ClipboardList,
        roles: MEMBER_NAV_ROLES,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Mon équipe",
        href: "/admin",
        icon: Users,
        roles: ["titulaire"],
      },
      {
        label: "Journal d'audit",
        href: "/admin/audit-log",
        icon: ScrollText,
        roles: ["titulaire"],
      },
      {
        label: "Paramètres",
        href: "/admin/settings",
        icon: Settings,
        roles: ["titulaire"],
      },
    ],
  },
];