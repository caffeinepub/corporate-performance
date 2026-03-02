import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useListRoleAssignments,
  useListUsers,
  useUpdateUserStatus,
} from "@/hooks/useQueries";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldOff,
  UserCheck,
  UserCog,
  UserMinus,
  UserX,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { RoleAssignment, User } from "../../../backend.d";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimestamp(ns: bigint): string {
  const ms = Number(ns) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function truncatePrincipal(principal: { toString(): string }): string {
  const s = principal.toString();
  if (s.length <= 16) return s;
  return `${s.slice(0, 10)}…${s.slice(-5)}`;
}

function getRoleLabel(roleType: string): string {
  switch (roleType) {
    case "CompanyAdmin":
      return "Company Admin";
    case "PresidentDirector":
      return "President Director";
    case "Director":
      return "Director";
    case "DivisionHead":
      return "Division Head";
    case "DepartmentHead":
      return "Department Head";
    default:
      return roleType;
  }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function UserStatusBadge({ status }: { status: string }) {
  if (status === "Active") {
    return (
      <Badge
        className="text-xs border-0 font-medium gap-1.5"
        style={{
          background: "oklch(0.92 0.06 145)",
          color: "oklch(0.38 0.14 145)",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "oklch(0.52 0.18 145)" }}
        />
        Active
      </Badge>
    );
  }
  if (status === "Unassigned") {
    return (
      <Badge
        className="text-xs border-0 font-medium gap-1.5"
        style={{
          background: "oklch(0.94 0.06 72)",
          color: "oklch(0.50 0.14 62)",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "oklch(0.72 0.16 72)" }}
        />
        Unassigned
      </Badge>
    );
  }
  // Inactive
  return (
    <Badge
      className="text-xs border-0 font-medium gap-1.5"
      style={{
        background: "oklch(0.93 0.008 252)",
        color: "oklch(0.48 0.022 258)",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: "oklch(0.62 0.012 258)" }}
      />
      Inactive
    </Badge>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ roleType }: { roleType: string }) {
  const styles: Record<string, { bg: string; color: string; dot: string }> = {
    CompanyAdmin: {
      bg: "oklch(0.24 0.065 258)",
      color: "oklch(0.88 0.06 252)",
      dot: "oklch(0.82 0.14 72)",
    },
    PresidentDirector: {
      bg: "oklch(0.28 0.075 280)",
      color: "oklch(0.88 0.06 280)",
      dot: "oklch(0.72 0.14 295)",
    },
    Director: {
      bg: "oklch(0.26 0.065 195)",
      color: "oklch(0.88 0.06 195)",
      dot: "oklch(0.72 0.14 185)",
    },
    DivisionHead: {
      bg: "oklch(0.26 0.055 155)",
      color: "oklch(0.88 0.06 155)",
      dot: "oklch(0.68 0.14 155)",
    },
    DepartmentHead: {
      bg: "oklch(0.28 0.065 65)",
      color: "oklch(0.92 0.06 72)",
      dot: "oklch(0.82 0.16 72)",
    },
  };
  const style = styles[roleType] ?? styles.Director;

  return (
    <Badge
      className="text-xs border-0 font-medium gap-1.5"
      style={{ background: style.bg, color: style.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full inline-block"
        style={{ background: style.dot }}
      />
      {getRoleLabel(roleType)}
    </Badge>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: "default" | "green" | "amber" | "gray";
}

function StatCard({ label, value, icon, accent = "default" }: StatCardProps) {
  const styles = {
    default: {
      iconBg: "oklch(0.94 0.012 252)",
      iconColor: "oklch(0.38 0.065 258)",
    },
    green: {
      iconBg: "oklch(0.92 0.06 145)",
      iconColor: "oklch(0.45 0.14 145)",
    },
    amber: {
      iconBg: "oklch(0.94 0.06 72)",
      iconColor: "oklch(0.50 0.14 62)",
    },
    gray: {
      iconBg: "oklch(0.93 0.008 252)",
      iconColor: "oklch(0.48 0.022 258)",
    },
  };
  const s = styles[accent];

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: s.iconBg }}
      >
        <span style={{ color: s.iconColor }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-foreground leading-none">
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

// ─── Skeleton Rows ────────────────────────────────────────────────────────────

const SKELETON_IDS = ["sk-1", "sk-2", "sk-3", "sk-4"];

function SkeletonRows() {
  return (
    <>
      {SKELETON_IDS.map((id) => (
        <TableRow key={id}>
          <TableCell>
            <Skeleton className="h-5 w-36 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-40 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-32 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-24 rounded" />
          </TableCell>
          <TableCell>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded" />
              <Skeleton className="h-8 w-24 rounded" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "oklch(0.94 0.012 252)" }}
      >
        <Users
          className="w-8 h-8"
          strokeWidth={1.5}
          style={{ color: "oklch(0.42 0.065 258)" }}
        />
      </div>
      <h3 className="font-display font-semibold text-base text-foreground mb-1">
        No users registered yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
        Users will appear here after they join the company using a registration
        code. Generate codes in the Registration Codes section.
      </p>
    </div>
  );
}

// ─── Confirm Action Dialog ────────────────────────────────────────────────────

interface ConfirmActionDialogProps {
  user: User | null;
  action: "activate" | "deactivate" | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function ConfirmActionDialog({
  user,
  action,
  open,
  onClose,
  onConfirm,
  isLoading,
}: ConfirmActionDialogProps) {
  const isActivate = action === "activate";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: isActivate
                  ? "oklch(0.92 0.06 145)"
                  : "oklch(0.95 0.04 27)",
              }}
            >
              {isActivate ? (
                <CheckCircle2
                  className="w-5 h-5"
                  style={{ color: "oklch(0.42 0.14 145)" }}
                />
              ) : (
                <AlertTriangle
                  className="w-5 h-5"
                  style={{ color: "oklch(0.58 0.22 27)" }}
                />
              )}
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                {isActivate ? "Activate User?" : "Deactivate User?"}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {isActivate
                  ? "Grant this user access to the workspace"
                  : "Revoke this user's workspace access"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {user && (
          <div
            className="rounded-lg px-4 py-3"
            style={{ background: "oklch(0.96 0.012 252)" }}
          >
            <p className="text-xs text-muted-foreground mb-0.5">User</p>
            <p className="text-sm font-medium text-foreground">
              {user.fullName}
            </p>
            {user.emailAddress && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {user.emailAddress}
              </p>
            )}
          </div>
        )}

        <p className="text-sm text-muted-foreground leading-relaxed">
          {isActivate
            ? "The user will gain access to the workspace based on their role assignments."
            : "The user will be locked out of the workspace. This can be reversed."}
        </p>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant={isActivate ? "default" : "destructive"}
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isActivate ? (
              <UserCheck className="w-4 h-4" />
            ) : (
              <UserMinus className="w-4 h-4" />
            )}
            {isLoading
              ? isActivate
                ? "Activating…"
                : "Deactivating…"
              : isActivate
                ? "Activate"
                : "Deactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── View Roles Dialog ────────────────────────────────────────────────────────

interface ViewRolesDialogProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

function ViewRolesDialog({ user, open, onClose }: ViewRolesDialogProps) {
  const { data: assignments, isLoading } = useListRoleAssignments(user?.userId);

  const activeAssignments = assignments?.filter((a) => a.activeStatus) ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.92 0.04 280)" }}
            >
              <UserCog
                className="w-5 h-5"
                style={{ color: "oklch(0.42 0.12 280)" }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                Role Assignments
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Active roles for {user?.fullName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-[80px]">
          {isLoading ? (
            <div className="space-y-2 py-2">
              {["r1", "r2"].map((id) => (
                <div
                  key={id}
                  className="rounded-lg px-4 py-3 flex items-center gap-3"
                  style={{ background: "oklch(0.96 0.012 252)" }}
                >
                  <Skeleton className="h-5 w-28 rounded-full" />
                  <Skeleton className="h-4 w-32 rounded" />
                </div>
              ))}
            </div>
          ) : activeAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <UserX
                className="w-8 h-8 mb-3"
                strokeWidth={1.5}
                style={{ color: "oklch(0.52 0.022 258)" }}
              />
              <p className="text-sm font-medium text-foreground mb-1">
                No active roles
              </p>
              <p className="text-xs text-muted-foreground">
                Use Role Assignment to assign roles to this user.
              </p>
            </div>
          ) : (
            <div className="space-y-2 py-1">
              {activeAssignments.map((a) => (
                <RoleAssignmentItem key={a.assignmentId} assignment={a} />
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RoleAssignmentItemProps {
  assignment: RoleAssignment;
}

function RoleAssignmentItem({ assignment }: RoleAssignmentItemProps) {
  const nodeLabel = assignment.orgNodeId ? null : "Company-wide";

  return (
    <div
      className="rounded-lg px-4 py-3 flex items-center gap-3"
      style={{ background: "oklch(0.96 0.012 252)" }}
    >
      <RoleBadge roleType={assignment.roleType as string} />
      <span className="text-xs text-muted-foreground">
        {nodeLabel ?? `Org Node: ${assignment.orgNodeId}`}
      </span>
    </div>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────

interface UserRowProps {
  user: User;
  animationDelay: number;
  onActivate: (user: User) => void;
  onDeactivate: (user: User) => void;
  onViewRoles: (user: User) => void;
}

function UserRow({
  user,
  animationDelay,
  onActivate,
  onDeactivate,
  onViewRoles,
}: UserRowProps) {
  const canActivate =
    user.status === "Unassigned" || user.status === "Inactive";
  const canDeactivate = user.status === "Active";

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: animationDelay, ease: "easeOut" }}
      className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
    >
      {/* Full Name */}
      <TableCell>
        <span className="font-medium text-sm text-foreground">
          {user.fullName}
        </span>
      </TableCell>

      {/* Status */}
      <TableCell>
        <UserStatusBadge status={user.status as string} />
      </TableCell>

      {/* Email */}
      <TableCell className="text-sm text-muted-foreground">
        {user.emailAddress || (
          <span className="text-muted-foreground/40">—</span>
        )}
      </TableCell>

      {/* Principal ID */}
      <TableCell>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="font-mono text-xs cursor-default"
                style={{ color: "oklch(0.48 0.032 258)" }}
              >
                {truncatePrincipal(user.principalId)}
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="font-mono text-xs max-w-xs break-all"
            >
              {user.principalId.toString()}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* Created Date */}
      <TableCell className="text-sm text-muted-foreground">
        {formatTimestamp(user.createdAt)}
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-2">
          {canActivate && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-8"
              style={{
                borderColor: "oklch(0.75 0.12 145 / 0.4)",
                color: "oklch(0.42 0.14 145)",
              }}
              onClick={() => onActivate(user)}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Activate
            </Button>
          )}
          {canDeactivate && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-8 border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/60"
              onClick={() => onDeactivate(user)}
            >
              <ShieldOff className="w-3.5 h-3.5" />
              Deactivate
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8"
            onClick={() => onViewRoles(user)}
          >
            <UserCog className="w-3.5 h-3.5" />
            Roles
          </Button>
        </div>
      </TableCell>
    </motion.tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUsers() {
  const { data: users, isLoading } = useListUsers();
  const updateStatusMutation = useUpdateUserStatus();

  const [confirmUser, setConfirmUser] = useState<User | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "activate" | "deactivate" | null
  >(null);
  const [viewRolesUser, setViewRolesUser] = useState<User | null>(null);

  const allUsers = users ?? [];

  const totalUsers = allUsers.length;
  const activeUsers = allUsers.filter((u) => u.status === "Active").length;
  const unassignedUsers = allUsers.filter(
    (u) => u.status === "Unassigned",
  ).length;
  const inactiveUsers = allUsers.filter((u) => u.status === "Inactive").length;

  const handleActivate = (user: User) => {
    setConfirmUser(user);
    setConfirmAction("activate");
  };

  const handleDeactivate = (user: User) => {
    setConfirmUser(user);
    setConfirmAction("deactivate");
  };

  const handleConfirm = async () => {
    if (!confirmUser || !confirmAction) return;
    try {
      await updateStatusMutation.mutateAsync({
        userId: confirmUser.userId,
        newStatus: confirmAction === "activate" ? "ACTIVE" : "INACTIVE",
      });
      toast.success(
        confirmAction === "activate"
          ? `${confirmUser.fullName} activated successfully`
          : `${confirmUser.fullName} deactivated`,
      );
      setConfirmUser(null);
      setConfirmAction(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update user status",
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex-1 flex flex-col"
    >
      {/* Page Header */}
      <div className="border-b border-border bg-card px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.26 0.065 258)" }}
            >
              <Users
                className="w-5 h-5"
                style={{ color: "oklch(0.82 0.14 72)" }}
              />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground leading-tight">
                Users
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Manage registered users, their status, and role assignments
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-8 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={totalUsers}
            icon={<Users className="w-5 h-5" />}
            accent="default"
          />
          <StatCard
            label="Active"
            value={activeUsers}
            icon={<UserCheck className="w-5 h-5" />}
            accent="green"
          />
          <StatCard
            label="Unassigned"
            value={unassignedUsers}
            icon={<UserCog className="w-5 h-5" />}
            accent="amber"
          />
          <StatCard
            label="Inactive"
            value={inactiveUsers}
            icon={<UserX className="w-5 h-5" />}
            accent="gray"
          />
        </div>

        {/* Table Card */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm text-foreground">
                All Users
              </span>
              {!isLoading && allUsers.length > 0 && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: "oklch(0.93 0.012 252)",
                    color: "oklch(0.42 0.055 258)",
                  }}
                >
                  {allUsers.length}
                </span>
              )}
            </div>
            {!isLoading && allUsers.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {activeUsers} active · {unassignedUsers} unassigned ·{" "}
                {inactiveUsers} inactive
              </p>
            )}
          </div>

          {/* Table or empty state */}
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Full Name
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Email
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Principal ID
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Created
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SkeletonRows />
              </TableBody>
            </Table>
          ) : allUsers.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Full Name
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Email
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Principal ID
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Created
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {allUsers.map((user, i) => (
                    <UserRow
                      key={user.userId}
                      user={user}
                      animationDelay={i * 0.04}
                      onActivate={handleActivate}
                      onDeactivate={handleDeactivate}
                      onViewRoles={(u) => setViewRolesUser(u)}
                    />
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Confirm Action Dialog */}
      <ConfirmActionDialog
        user={confirmUser}
        action={confirmAction}
        open={!!confirmUser && !!confirmAction}
        onClose={() => {
          setConfirmUser(null);
          setConfirmAction(null);
        }}
        onConfirm={handleConfirm}
        isLoading={updateStatusMutation.isPending}
      />

      {/* View Roles Dialog */}
      <ViewRolesDialog
        user={viewRolesUser}
        open={!!viewRolesUser}
        onClose={() => setViewRolesUser(null)}
      />
    </motion.div>
  );
}
