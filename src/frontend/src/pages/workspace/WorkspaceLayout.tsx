import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  Activity,
  BarChart2,
  BarChart3,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  LogOut,
  Menu,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useMyProfile } from "../../hooks/useQueries";

const kpiNavItems = [
  {
    label: "KPI Proposal",
    path: "/workspace/kpi-proposal",
    icon: ClipboardList,
  },
  {
    label: "KPI Approval",
    path: "/workspace/kpi-approval",
    icon: ClipboardCheck,
  },
  { label: "KPI Progress", path: "/workspace/kpi-progress", icon: TrendingUp },
  {
    label: "Subordinate KPI Progress",
    path: "/workspace/subordinate-kpi-progress",
    icon: BarChart2,
  },
];

const okrNavItems = [
  { label: "OKR Proposal", path: "/workspace/okr-proposal", icon: Target },
  { label: "OKR Approval", path: "/workspace/okr-approval", icon: CheckSquare },
  { label: "OKR Progress", path: "/workspace/okr-progress", icon: Activity },
  {
    label: "Subordinate OKR Progress",
    path: "/workspace/subordinate-okr-progress",
    icon: Users,
  },
];

function SidebarContent({
  collapsed,
  onToggle,
  onNavClick,
}: {
  collapsed: boolean;
  onToggle?: () => void;
  onNavClick?: () => void;
}) {
  const { data: profile } = useMyProfile();
  const { clear } = useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const handleSignOut = () => {
    queryClient.clear();
    clear();
    void navigate({ to: "/onboard" });
  };

  const initials = profile?.fullName
    ? profile.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const renderNavGroup = (items: typeof kpiNavItems, groupLabel: string) => (
    <div className="space-y-0.5">
      {!collapsed && (
        <p
          className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
          style={{ color: "oklch(0.48 0.022 258)" }}
        >
          {groupLabel}
        </p>
      )}
      {collapsed && <div className="h-2" />}
      {items.map(({ label, path, icon: Icon }) => {
        const isActive = currentPath === path;
        return (
          <Link
            key={path}
            to={path}
            onClick={onNavClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              isActive
                ? "sidebar-active-glow"
                : "hover:bg-[oklch(0.30_0.065_258)]",
            )}
            style={
              isActive
                ? {
                    background: "oklch(0.30 0.065 258)",
                    color: "oklch(0.95 0.006 252)",
                  }
                : { color: "oklch(0.72 0.022 258)" }
            }
            title={collapsed ? label : undefined}
          >
            <Icon
              className="w-4 h-4 flex-shrink-0"
              style={isActive ? { color: "oklch(0.82 0.14 72)" } : undefined}
            />
            {!collapsed && <span className="truncate">{label}</span>}
            {!collapsed && isActive && (
              <div
                className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: "oklch(0.82 0.14 72)" }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: "oklch(0.22 0.058 258)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4 border-b"
        style={{ borderColor: "oklch(0.30 0.055 258)" }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.82 0.14 72)" }}
            >
              <BarChart3
                className="w-4 h-4"
                style={{ color: "oklch(0.12 0.025 258)" }}
              />
            </div>
            <div className="min-w-0">
              <p
                className="font-display font-bold text-xs truncate"
                style={{ color: "oklch(0.95 0.006 252)" }}
              >
                Corporate
              </p>
              <p
                className="font-display font-bold text-xs truncate"
                style={{ color: "oklch(0.82 0.14 72)" }}
              >
                Performance
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto"
            style={{ background: "oklch(0.82 0.14 72)" }}
          >
            <BarChart3
              className="w-4 h-4"
              style={{ color: "oklch(0.12 0.025 258)" }}
            />
          </div>
        )}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="flex-shrink-0 p-1 rounded-md transition-colors hover:opacity-80"
            style={{ color: "oklch(0.62 0.022 258)" }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 py-2">
          <span
            className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: "oklch(0.30 0.065 258)",
              color: "oklch(0.72 0.14 195)",
            }}
          >
            My Workspace
          </span>
        </div>
      )}

      {/* Nav */}
      <nav
        className="flex-1 overflow-y-auto py-3 px-2 space-y-4"
        aria-label="Workspace navigation"
      >
        {renderNavGroup(kpiNavItems, "KPI")}
        {!collapsed && (
          <Separator style={{ background: "oklch(0.30 0.055 258)" }} />
        )}
        {renderNavGroup(okrNavItems, "OKR")}
      </nav>

      <Separator style={{ background: "oklch(0.30 0.055 258)" }} />

      {/* User footer */}
      <div className="px-3 py-3 space-y-2">
        <div
          className={cn(
            "flex items-center gap-3 px-2 py-2 rounded-lg",
            collapsed ? "justify-center" : "",
          )}
        >
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback
              className="text-xs font-bold"
              style={{
                background: "oklch(0.38 0.065 258)",
                color: "oklch(0.82 0.14 72)",
              }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p
                className="text-xs font-medium truncate"
                style={{ color: "oklch(0.88 0.01 252)" }}
              >
                {profile?.fullName ?? "Loading…"}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "oklch(0.52 0.022 258)" }}
              >
                My Workspace
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors",
            collapsed ? "justify-center" : "",
          )}
          style={{ color: "oklch(0.52 0.022 258)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "oklch(0.72 0.022 258)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "oklch(0.52 0.022 258)";
          }}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </div>
  );
}

export default function WorkspaceLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 shadow-sidebar"
        style={{ width: collapsed ? "64px" : "240px" }}
      >
        <div className="sticky top-0 h-screen overflow-hidden">
          <SidebarContent
            collapsed={collapsed}
            onToggle={() => setCollapsed(!collapsed)}
          />
        </div>
      </aside>

      {/* Mobile sidebar via Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-60 border-0">
          <SidebarContent
            collapsed={false}
            onNavClick={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ background: "oklch(0.26 0.065 258)" }}
            >
              <BarChart3 className="w-3 h-3 text-white" />
            </div>
            <span className="font-display font-bold text-sm">
              Corporate Performance
            </span>
          </div>
        </header>

        <main className="flex-1 flex flex-col overflow-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-border px-8 py-4 bg-card">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} Corporate Performance. Built with love
            using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-foreground/60"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
