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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  useAssignRole,
  useDeactivateRoleAssignment,
  useListOrganizationNodes,
  useListRoleAssignments,
  useListUsers,
} from "@/hooks/useQueries";
import {
  AlertTriangle,
  Building2,
  Loader2,
  Plus,
  ShieldOff,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { OrgNode, RoleAssignment, User } from "../../../backend.d";
import { Variant_Division_Director_PresidentDirector_Department } from "../../../backend.d";

// ─── Types & Constants ────────────────────────────────────────────────────────

type RoleType =
  | "CompanyAdmin"
  | "PresidentDirector"
  | "Director"
  | "DivisionHead"
  | "DepartmentHead";

const ROLE_TYPES: RoleType[] = [
  "CompanyAdmin",
  "PresidentDirector",
  "Director",
  "DivisionHead",
  "DepartmentHead",
];

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

// Role type → required org node type mapping
function getRequiredNodeType(
  roleType: string,
): Variant_Division_Director_PresidentDirector_Department | null {
  const NodeType = Variant_Division_Director_PresidentDirector_Department;
  switch (roleType) {
    case "PresidentDirector":
      return NodeType.PresidentDirector;
    case "Director":
      return NodeType.Director;
    case "DivisionHead":
      return NodeType.Division;
    case "DepartmentHead":
      return NodeType.Department;
    default:
      return null; // CompanyAdmin needs no node
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimestamp(ns: bigint): string {
  const ms = Number(ns) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

interface RoleBadgeProps {
  roleType: string;
}

function RoleBadge({ roleType }: RoleBadgeProps) {
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

// ─── Status Badge ─────────────────────────────────────────────────────────────

function ActiveBadge({ active }: { active: boolean }) {
  if (active) {
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

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: "default" | "green" | "indigo";
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
    indigo: {
      iconBg: "oklch(0.92 0.04 280)",
      iconColor: "oklch(0.42 0.12 280)",
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

const SKELETON_IDS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"];

function SkeletonRows() {
  return (
    <>
      {SKELETON_IDS.map((id) => (
        <TableRow key={id}>
          <TableCell>
            <Skeleton className="h-5 w-36 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-28 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-32 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-24 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-24 rounded" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onAssign }: { onAssign: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "oklch(0.94 0.012 252)" }}
      >
        <UserCog
          className="w-8 h-8"
          strokeWidth={1.5}
          style={{ color: "oklch(0.42 0.065 258)" }}
        />
      </div>
      <h3 className="font-display font-semibold text-base text-foreground mb-1">
        No role assignments yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        Assign organizational roles to registered users to give them access to
        their workspace.
      </p>
      <Button onClick={onAssign} className="gap-2">
        <Plus className="w-4 h-4" />
        Assign First Role
      </Button>
    </div>
  );
}

// ─── Assign Role Dialog ───────────────────────────────────────────────────────

interface AssignRoleDialogProps {
  open: boolean;
  onClose: () => void;
  users: User[];
  nodes: OrgNode[];
  isPending: boolean;
  onSubmit: (args: {
    userId: string;
    roleType: string;
    orgNodeId: string | null;
  }) => void;
}

function AssignRoleDialog({
  open,
  onClose,
  users,
  nodes,
  isPending,
  onSubmit,
}: AssignRoleDialogProps) {
  const [userId, setUserId] = useState("");
  const [roleType, setRoleType] = useState<RoleType | "">("");
  const [orgNodeId, setOrgNodeId] = useState("");
  const [errors, setErrors] = useState<{
    userId?: string;
    roleType?: string;
    orgNodeId?: string;
  }>({});

  const requiredNodeType = roleType ? getRequiredNodeType(roleType) : null;
  const needsNode = roleType !== "" && roleType !== "CompanyAdmin";
  const filteredNodes = requiredNodeType
    ? nodes.filter((n) => n.nodeType === requiredNodeType)
    : [];

  const handleClose = () => {
    setUserId("");
    setRoleType("");
    setOrgNodeId("");
    setErrors({});
    onClose();
  };

  const handleSubmit = () => {
    const errs: typeof errors = {};
    if (!userId) errs.userId = "Please select a user.";
    if (!roleType) errs.roleType = "Please select a role type.";
    if (needsNode && !orgNodeId)
      errs.orgNodeId = "Please select an organization node.";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    onSubmit({
      userId,
      roleType,
      orgNodeId: needsNode ? orgNodeId : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.94 0.012 252)" }}
            >
              <UserCog
                className="w-5 h-5"
                style={{ color: "oklch(0.38 0.065 258)" }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                Assign Role
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Assign an organizational role to a registered user
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* User */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              User <span className="text-destructive">*</span>
            </Label>
            <Select
              value={userId}
              onValueChange={(v) => {
                setUserId(v);
                if (errors.userId)
                  setErrors((p) => ({ ...p, userId: undefined }));
              }}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select user…" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem
                    key={u.userId}
                    value={u.userId}
                    className="text-sm"
                  >
                    <span className="flex items-center gap-2">
                      {u.fullName}
                      <span className="text-xs text-muted-foreground">
                        ({u.status})
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.userId && (
              <p className="text-xs text-destructive">{errors.userId}</p>
            )}
          </div>

          {/* Role Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              Role Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={roleType}
              onValueChange={(v) => {
                setRoleType(v as RoleType);
                setOrgNodeId("");
                if (errors.roleType)
                  setErrors((p) => ({ ...p, roleType: undefined }));
              }}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select role…" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_TYPES.map((r) => (
                  <SelectItem key={r} value={r} className="text-sm">
                    {getRoleLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roleType && (
              <p className="text-xs text-destructive">{errors.roleType}</p>
            )}
          </div>

          {/* Org Node (conditional) */}
          {needsNode && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Organization Node <span className="text-destructive">*</span>
              </Label>
              {filteredNodes.length === 0 ? (
                <div
                  className="rounded-lg px-4 py-3 flex gap-2 items-start"
                  style={{ background: "oklch(0.96 0.03 27 / 0.35)" }}
                >
                  <AlertTriangle
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    style={{ color: "oklch(0.60 0.18 27)" }}
                  />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    No{" "}
                    {requiredNodeType
                      ? requiredNodeType.toString()
                      : "matching"}{" "}
                    nodes exist. Add them in Organization Structure first.
                  </p>
                </div>
              ) : (
                <>
                  <Select
                    value={orgNodeId}
                    onValueChange={(v) => {
                      setOrgNodeId(v);
                      if (errors.orgNodeId)
                        setErrors((p) => ({ ...p, orgNodeId: undefined }));
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select organization node…" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredNodes.map((n) => (
                        <SelectItem
                          key={n.nodeId}
                          value={n.nodeId}
                          className="text-sm"
                        >
                          {n.nodeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.orgNodeId && (
                    <p className="text-xs text-destructive">
                      {errors.orgNodeId}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Company-wide hint for CompanyAdmin */}
          {roleType === "CompanyAdmin" && (
            <div
              className="rounded-lg px-4 py-3 flex gap-2 items-start"
              style={{ background: "oklch(0.94 0.012 252)" }}
            >
              <Building2
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: "oklch(0.42 0.065 258)" }}
              />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Company Admin is a company-wide role — no organization node
                required.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || (needsNode && filteredNodes.length === 0)}
            className="flex-1 gap-2"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
            {isPending ? "Assigning…" : "Assign Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Deactivate Confirm Dialog ────────────────────────────────────────────────

interface DeactivateDialogProps {
  assignment: RoleAssignment | null;
  users: User[];
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function DeactivateDialog({
  assignment,
  users,
  open,
  onClose,
  onConfirm,
  isLoading,
}: DeactivateDialogProps) {
  const user = users.find((u) => u.userId === assignment?.userId);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.95 0.04 27)" }}
            >
              <AlertTriangle
                className="w-5 h-5"
                style={{ color: "oklch(0.58 0.22 27)" }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                Deactivate Assignment?
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                This will revoke the role from the user
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {assignment && (
          <div
            className="rounded-lg px-4 py-3 space-y-1"
            style={{ background: "oklch(0.96 0.012 252)" }}
          >
            <p className="text-xs text-muted-foreground">User</p>
            <p className="text-sm font-medium text-foreground">
              {user?.fullName ?? assignment.userId}
            </p>
            <div className="pt-1">
              <RoleBadge roleType={assignment.roleType as string} />
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground leading-relaxed">
          The historical record is preserved. The user will lose access
          associated with this role.
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
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldOff className="w-4 h-4" />
            )}
            Deactivate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assignment Row ────────────────────────────────────────────────────────────

interface AssignmentRowProps {
  assignment: RoleAssignment;
  users: User[];
  nodes: OrgNode[];
  animationDelay: number;
  onDeactivate: (assignment: RoleAssignment) => void;
}

function AssignmentRow({
  assignment,
  users,
  nodes,
  animationDelay,
  onDeactivate,
}: AssignmentRowProps) {
  const user = users.find((u) => u.userId === assignment.userId);
  const node = assignment.orgNodeId
    ? nodes.find((n) => n.nodeId === assignment.orgNodeId)
    : null;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: animationDelay, ease: "easeOut" }}
      className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
    >
      {/* User */}
      <TableCell>
        <span className="font-medium text-sm text-foreground">
          {user?.fullName ?? assignment.userId}
        </span>
      </TableCell>

      {/* Role */}
      <TableCell>
        <RoleBadge roleType={assignment.roleType as string} />
      </TableCell>

      {/* Org Node */}
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {node ? node.nodeName : "Company-wide"}
        </span>
      </TableCell>

      {/* Status */}
      <TableCell>
        <ActiveBadge active={assignment.activeStatus} />
      </TableCell>

      {/* Assigned Date */}
      <TableCell className="text-sm text-muted-foreground">
        {formatTimestamp(assignment.assignedAt)}
      </TableCell>

      {/* Actions */}
      <TableCell>
        {assignment.activeStatus ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8 border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/60"
            onClick={() => onDeactivate(assignment)}
          >
            <ShieldOff className="w-3.5 h-3.5" />
            Deactivate
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </TableCell>
    </motion.tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminRoleAssignment() {
  const { data: assignments, isLoading: assignmentsLoading } =
    useListRoleAssignments();
  const { data: users, isLoading: usersLoading } = useListUsers();
  const { data: nodes } = useListOrganizationNodes();
  const assignMutation = useAssignRole();
  const deactivateMutation = useDeactivateRoleAssignment();

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [deactivatingAssignment, setDeactivatingAssignment] =
    useState<RoleAssignment | null>(null);

  const isLoading = assignmentsLoading || usersLoading;
  const allAssignments = assignments ?? [];
  const allUsers = users ?? [];
  const allNodes = nodes ?? [];

  const totalAssignments = allAssignments.length;
  const activeAssignments = allAssignments.filter((a) => a.activeStatus).length;
  const usersWithActiveRoles = new Set(
    allAssignments.filter((a) => a.activeStatus).map((a) => a.userId),
  ).size;

  const handleAssign = async (args: {
    userId: string;
    roleType: string;
    orgNodeId: string | null;
  }) => {
    try {
      await assignMutation.mutateAsync(args);
      toast.success(`${getRoleLabel(args.roleType)} assigned successfully`);
      setShowAssignDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign role");
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivatingAssignment) return;
    try {
      await deactivateMutation.mutateAsync(deactivatingAssignment.assignmentId);
      toast.success("Role assignment deactivated");
      setDeactivatingAssignment(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to deactivate assignment",
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
              <UserCheck
                className="w-5 h-5"
                style={{ color: "oklch(0.82 0.14 72)" }}
              />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground leading-tight">
                Role Assignment
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Assign organizational roles to registered users
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowAssignDialog(true)}
            disabled={assignMutation.isPending}
            className="gap-2 flex-shrink-0"
          >
            {assignMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Assign Role
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-8 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Assignments"
            value={totalAssignments}
            icon={<UserCog className="w-5 h-5" />}
            accent="default"
          />
          <StatCard
            label="Active Assignments"
            value={activeAssignments}
            icon={<UserCheck className="w-5 h-5" />}
            accent="green"
          />
          <StatCard
            label="Users with Active Roles"
            value={usersWithActiveRoles}
            icon={<Users className="w-5 h-5" />}
            accent="indigo"
          />
        </div>

        {/* Table Card */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm text-foreground">
                All Assignments
              </span>
              {!isLoading && allAssignments.length > 0 && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: "oklch(0.93 0.012 252)",
                    color: "oklch(0.42 0.055 258)",
                  }}
                >
                  {allAssignments.length}
                </span>
              )}
            </div>
            {!isLoading && allAssignments.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {activeAssignments} active ·{" "}
                {totalAssignments - activeAssignments} inactive
              </p>
            )}
          </div>

          {/* Table or empty state */}
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    User
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Role
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Org Node
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Assigned
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
          ) : allAssignments.length === 0 ? (
            <EmptyState onAssign={() => setShowAssignDialog(true)} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    User
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Role
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Org Node
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Assigned
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {allAssignments.map((assignment, i) => (
                    <AssignmentRow
                      key={assignment.assignmentId}
                      assignment={assignment}
                      users={allUsers}
                      nodes={allNodes}
                      animationDelay={i * 0.04}
                      onDeactivate={(a) => setDeactivatingAssignment(a)}
                    />
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Assign Role Dialog */}
      <AssignRoleDialog
        open={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        users={allUsers}
        nodes={allNodes}
        isPending={assignMutation.isPending}
        onSubmit={handleAssign}
      />

      {/* Deactivate Confirm Dialog */}
      <DeactivateDialog
        assignment={deactivatingAssignment}
        users={allUsers}
        open={!!deactivatingAssignment}
        onClose={() => setDeactivatingAssignment(null)}
        onConfirm={handleDeactivateConfirm}
        isLoading={deactivateMutation.isPending}
      />
    </motion.div>
  );
}
