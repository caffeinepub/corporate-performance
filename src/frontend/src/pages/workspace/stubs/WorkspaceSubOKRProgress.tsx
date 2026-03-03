import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useListKPIYears,
  useListOKRs,
  useListOrganizationNodes,
  useListRoleAssignments,
  useMyProfile,
} from "@/hooks/useQueries";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Target,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { OKR, OrgNode } from "../../../backend.d";
import {
  Variant_Done_OnProgress_Backlog_CarriedForNextYear_Pending,
  Variant_Open_Closed,
} from "../../../backend.d";

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeType = "PresidentDirector" | "Director" | "Division" | "Department";

const NODE_TYPE_ORDER: NodeType[] = [
  "PresidentDirector",
  "Director",
  "Division",
  "Department",
];

// ─── Node type badge ─────────────────────────────────────────────────────────

const NODE_TYPE_STYLES: Record<
  NodeType,
  { bg: string; color: string; label: string }
> = {
  PresidentDirector: {
    bg: "oklch(0.92 0.04 258)",
    color: "oklch(0.38 0.12 258)",
    label: "President Director",
  },
  Director: {
    bg: "oklch(0.93 0.04 280)",
    color: "oklch(0.42 0.14 280)",
    label: "Director",
  },
  Division: {
    bg: "oklch(0.93 0.04 185)",
    color: "oklch(0.42 0.12 195)",
    label: "Division",
  },
  Department: {
    bg: "oklch(0.95 0.04 72)",
    color: "oklch(0.52 0.14 72)",
    label: "Department",
  },
};

function NodeTypeBadge({ type }: { type: NodeType }) {
  const s = NODE_TYPE_STYLES[type] ?? NODE_TYPE_STYLES.Department;
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

// ─── Realization status badge ─────────────────────────────────────────────────

const REALIZATION_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  Backlog: {
    bg: "oklch(0.92 0.02 258)",
    color: "oklch(0.50 0.02 258)",
    label: "Backlog",
  },
  OnProgress: {
    bg: "oklch(0.92 0.04 250)",
    color: "oklch(0.42 0.14 250)",
    label: "On Progress",
  },
  Pending: {
    bg: "oklch(0.95 0.04 72)",
    color: "oklch(0.52 0.14 72)",
    label: "Pending",
  },
  Done: {
    bg: "oklch(0.92 0.04 145)",
    color: "oklch(0.42 0.14 145)",
    label: "Done",
  },
  CarriedForNextYear: {
    bg: "oklch(0.93 0.04 300)",
    color: "oklch(0.42 0.12 300)",
    label: "Carried Forward",
  },
};

function RealizationBadge({
  realization,
}: {
  realization: Variant_Done_OnProgress_Backlog_CarriedForNextYear_Pending;
}) {
  const s =
    REALIZATION_STYLES[realization as string] ?? REALIZATION_STYLES.Backlog;
  return (
    <span
      className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

// ─── Scope computation (same as KPI page) ────────────────────────────────────

function computeInScopeNodeIds(
  roles: Array<{ roleType: string; orgNodeId?: string; activeStatus: boolean }>,
  orgNodes: OrgNode[],
): Set<string> {
  function getDescendantNodeIds(rootNodeId: string): string[] {
    const result: string[] = [];
    const queue = [rootNodeId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const node of orgNodes) {
        if (node.parentNodeId === current) {
          result.push(node.nodeId);
          queue.push(node.nodeId);
        }
      }
    }
    return result;
  }

  const inScope = new Set<string>();
  let hasPD = false;

  for (const role of roles) {
    if (!role.activeStatus) continue;
    if (role.roleType === "PresidentDirector") {
      hasPD = true;
      break;
    }
  }

  if (hasPD) {
    for (const n of orgNodes) {
      inScope.add(n.nodeId);
    }
    return inScope;
  }

  for (const role of roles) {
    if (!role.activeStatus) continue;
    const roleType = role.roleType;
    const nodeId = role.orgNodeId;
    if (!nodeId) continue;

    if (roleType === "Director") {
      const descendants = getDescendantNodeIds(nodeId);
      for (const id of descendants) inScope.add(id);
    } else if (roleType === "DivisionHead") {
      for (const node of orgNodes) {
        if (node.parentNodeId === nodeId) {
          inScope.add(node.nodeId);
        }
      }
    }
    // DepartmentHead: no subordinates (handled as empty state)
  }

  return inScope;
}

function isDepartmentHeadOnly(
  roles: Array<{ roleType: string; activeStatus: boolean }>,
): boolean {
  const activeRoles = roles.filter((r) => r.activeStatus);
  return (
    activeRoles.length > 0 &&
    activeRoles.every(
      (r) => r.roleType === "DepartmentHead" || r.roleType === "CompanyAdmin",
    ) &&
    !activeRoles.some(
      (r) =>
        r.roleType === "Director" ||
        r.roleType === "DivisionHead" ||
        r.roleType === "PresidentDirector",
    )
  );
}

// ─── OKR Table Row ────────────────────────────────────────────────────────────

interface OKRTableRowProps {
  okr: OKR;
  index: number;
}

function OKRTableRow({ okr, index }: OKRTableRowProps) {
  const truncateNotes = (text: string | undefined, maxLen = 60): string => {
    if (!text) return "—";
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen)}…`;
  };

  return (
    <div
      className="grid items-start gap-3 px-4 py-3 rounded-xl"
      style={{
        gridTemplateColumns: "1fr 1fr 80px 120px 160px",
        background: index % 2 === 0 ? "oklch(0.98 0.003 252)" : "white",
      }}
      data-ocid={`sub.okr.row.${index + 1}`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug">
          {okr.objective}
        </p>
      </div>

      <div className="min-w-0">
        <p className="text-sm text-foreground/80 leading-snug">
          {okr.keyResult}
        </p>
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">
          {okr.targetValue.toLocaleString()}
        </p>
      </div>

      <div>
        <RealizationBadge realization={okr.realization} />
      </div>

      <div className="min-w-0">
        <p
          className="text-xs text-muted-foreground leading-relaxed"
          title={okr.notes ?? ""}
        >
          {truncateNotes(okr.notes)}
        </p>
      </div>
    </div>
  );
}

// ─── Collapsible Node Section ─────────────────────────────────────────────────

interface NodeSectionProps {
  node: OrgNode;
  okrs: OKR[];
  sectionIndex: number;
}

function NodeSection({ node, okrs, sectionIndex }: NodeSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const nodeType = node.nodeType as NodeType;

  const doneCount = okrs.filter(
    (o) =>
      o.realization ===
      Variant_Done_OnProgress_Backlog_CarriedForNextYear_Pending.Done,
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: sectionIndex * 0.05 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Section Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
        data-ocid={`sub.okr.section.${sectionIndex + 1}`}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background:
              NODE_TYPE_STYLES[nodeType]?.bg ?? "oklch(0.94 0.012 252)",
          }}
        >
          <Target
            className="w-4 h-4"
            style={{
              color:
                NODE_TYPE_STYLES[nodeType]?.color ?? "oklch(0.38 0.065 258)",
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-bold text-sm text-foreground">
              {node.nodeName}
            </h3>
            <NodeTypeBadge type={nodeType} />
            <Badge
              className="text-xs px-2 py-0 h-5"
              style={{
                background: "oklch(0.92 0.04 258)",
                color: "oklch(0.38 0.08 258)",
              }}
            >
              {okrs.length} OKR{okrs.length !== 1 ? "s" : ""}
            </Badge>
            {doneCount > 0 && (
              <Badge
                className="text-xs px-2 py-0 h-5"
                style={{
                  background: "oklch(0.92 0.04 145)",
                  color: "oklch(0.38 0.12 145)",
                }}
              >
                {doneCount} Done
              </Badge>
            )}
          </div>
        </div>

        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {/* Table */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border">
              {/* Column headers */}
              <div
                className="grid items-center gap-3 px-4 py-2 border-b border-border"
                style={{
                  gridTemplateColumns: "1fr 1fr 80px 120px 160px",
                  background: "oklch(0.96 0.006 252)",
                }}
              >
                <span className="text-xs font-semibold text-muted-foreground px-4">
                  Objective
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Key Result
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Target
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Realization
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Notes
                </span>
              </div>

              <div className="divide-y divide-border/50 px-2 pb-2">
                {okrs.map((okr, i) => (
                  <OKRTableRow key={okr.okrId} okr={okr} index={i} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Empty States ─────────────────────────────────────────────────────────────

function NoSubordinatesState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center bg-card border border-border rounded-2xl"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "oklch(0.94 0.012 252)" }}
      >
        <Users
          className="w-8 h-8"
          strokeWidth={1.5}
          style={{ color: "oklch(0.52 0.065 258)" }}
        />
      </div>
      <h3 className="font-display font-semibold text-base text-foreground mb-1">
        No Subordinates
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
        As a Department Head, you do not have subordinate team members to
        monitor. Your own OKR progress is available in{" "}
        <strong>OKR Progress</strong>.
      </p>
    </motion.div>
  );
}

function NoApprovedOKRsState({ yearLabel }: { yearLabel: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center bg-card border border-border rounded-2xl"
      data-ocid="sub.okr.empty_state"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "oklch(0.94 0.012 252)" }}
      >
        <ClipboardList
          className="w-8 h-8"
          strokeWidth={1.5}
          style={{ color: "oklch(0.52 0.065 258)" }}
        />
      </div>
      <h3 className="font-display font-semibold text-base text-foreground mb-1">
        No Approved OKRs
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
        No approved OKRs found for your subordinates in {yearLabel}. OKRs will
        appear here once they have been approved.
      </p>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {["s1", "s2", "s3"].map((id) => (
          <div key={id} className="bg-card border border-border rounded-xl p-5">
            <Skeleton className="h-8 w-12 mb-2 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        ))}
      </div>
      {["n1", "n2"].map((id) => (
        <div
          key={id}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <div className="flex items-center gap-3 px-5 py-4">
            <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({
  totalOKRs,
  totalNodes,
  doneCount,
}: {
  totalOKRs: number;
  totalNodes: number;
  doneCount: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        {
          label: "Subordinate OKRs",
          value: totalOKRs,
          icon: (
            <Target
              className="w-5 h-5"
              style={{ color: "oklch(0.38 0.065 258)" }}
            />
          ),
          iconBg: "oklch(0.94 0.012 252)",
        },
        {
          label: "Nodes with OKRs",
          value: totalNodes,
          icon: (
            <Users
              className="w-5 h-5"
              style={{ color: "oklch(0.42 0.14 250)" }}
            />
          ),
          iconBg: "oklch(0.92 0.04 250)",
        },
        {
          label: "Done / Completed",
          value: doneCount,
          icon: (
            <CheckCircle2
              className="w-5 h-5"
              style={{ color: "oklch(0.42 0.14 145)" }}
            />
          ),
          iconBg: "oklch(0.92 0.04 145)",
        },
      ].map(({ label, value, icon, iconBg }) => (
        <div
          key={label}
          className="bg-card border border-border rounded-xl p-5 flex items-center gap-4"
        >
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: iconBg }}
          >
            {icon}
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-foreground leading-none">
              {value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkspaceSubOKRProgress() {
  const { data: profile } = useMyProfile();
  const { data: kpiYears, isLoading: yearsLoading } = useListKPIYears();
  const { data: orgNodes, isLoading: nodesLoading } =
    useListOrganizationNodes();
  const { data: allRoleAssignments, isLoading: rolesLoading } =
    useListRoleAssignments();

  const openYears = useMemo(
    () => (kpiYears ?? []).filter((y) => y.status === Variant_Open_Closed.Open),
    [kpiYears],
  );

  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const effectiveYearId = useMemo(
    () => selectedYearId || (openYears[0]?.kpiYearId ?? ""),
    [selectedYearId, openYears],
  );

  const { data: allOKRs, isLoading: okrsLoading } = useListOKRs(
    effectiveYearId || undefined,
    "APPROVED",
  );

  const roles = useMemo(() => profile?.roles ?? [], [profile]);

  const inScopeNodeIds = useMemo(() => {
    if (!orgNodes) return new Set<string>();
    return computeInScopeNodeIds(roles, orgNodes);
  }, [roles, orgNodes]);

  const departmentHeadOnly = useMemo(
    () => isDepartmentHeadOnly(roles),
    [roles],
  );

  const orgNodeMap = useMemo(
    () => new Map((orgNodes ?? []).map((n) => [n.nodeId, n])),
    [orgNodes],
  );

  // Build a map: assignmentId → orgNodeId for resolving OKR owners
  const assignmentNodeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const ra of allRoleAssignments ?? []) {
      if (ra.orgNodeId) {
        map.set(ra.assignmentId, ra.orgNodeId);
      }
    }
    return map;
  }, [allRoleAssignments]);

  // Filter OKRs to in-scope nodes by resolving ownerRoleAssignmentId → orgNodeId
  const scopedOKRs = useMemo(() => {
    return (allOKRs ?? []).filter((okr) => {
      const nodeId = assignmentNodeMap.get(okr.ownerRoleAssignmentId);
      return nodeId !== undefined && inScopeNodeIds.has(nodeId);
    });
  }, [allOKRs, assignmentNodeMap, inScopeNodeIds]);

  // Group OKRs by org node
  const okrsByNode = useMemo(() => {
    const map = new Map<string, OKR[]>();
    for (const okr of scopedOKRs) {
      const nodeId = assignmentNodeMap.get(okr.ownerRoleAssignmentId);
      if (!nodeId) continue;
      const existing = map.get(nodeId) ?? [];
      map.set(nodeId, [...existing, okr]);
    }
    return map;
  }, [scopedOKRs, assignmentNodeMap]);

  // Sort nodes: PD → Director → Division → Department
  const sortedNodeIds = useMemo(() => {
    return Array.from(okrsByNode.keys()).sort((a, b) => {
      const nodeA = orgNodeMap.get(a);
      const nodeB = orgNodeMap.get(b);
      const typeA = (nodeA?.nodeType as NodeType) ?? "Department";
      const typeB = (nodeB?.nodeType as NodeType) ?? "Department";
      return NODE_TYPE_ORDER.indexOf(typeA) - NODE_TYPE_ORDER.indexOf(typeB);
    });
  }, [okrsByNode, orgNodeMap]);

  const selectedYear = (kpiYears ?? []).find(
    (y) => y.kpiYearId === effectiveYearId,
  );
  const yearLabel = selectedYear ? String(selectedYear.year) : "selected year";

  const doneCount = scopedOKRs.filter(
    (o) =>
      o.realization ===
      Variant_Done_OnProgress_Backlog_CarriedForNextYear_Pending.Done,
  ).length;

  const isLoading = yearsLoading || nodesLoading || okrsLoading || rolesLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex-1 flex flex-col"
    >
      {/* Page Header */}
      <div className="border-b border-border bg-card px-8 py-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
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
                Subordinate OKR Progress
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Read-only view of OKR progress for your organizational scope
                {selectedYear ? ` — ${String(selectedYear.year)}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              KPI Year
            </span>
            <Select value={effectiveYearId} onValueChange={setSelectedYearId}>
              <SelectTrigger
                className="w-32 h-9 text-sm"
                data-ocid="sub.okr.select"
              >
                <SelectValue placeholder="Select year…" />
              </SelectTrigger>
              <SelectContent>
                {(kpiYears ?? []).map((y) => (
                  <SelectItem key={y.kpiYearId} value={y.kpiYearId}>
                    {String(y.year)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-8 space-y-6">
        {isLoading ? (
          <PageSkeleton />
        ) : departmentHeadOnly ? (
          <NoSubordinatesState />
        ) : (
          <>
            <StatsBar
              totalOKRs={scopedOKRs.length}
              totalNodes={sortedNodeIds.length}
              doneCount={doneCount}
            />

            {sortedNodeIds.length === 0 ? (
              <NoApprovedOKRsState yearLabel={yearLabel} />
            ) : (
              <div className="space-y-5">
                {sortedNodeIds.map((nodeId, i) => {
                  const node = orgNodeMap.get(nodeId);
                  const okrs = okrsByNode.get(nodeId) ?? [];
                  if (!node) return null;
                  return (
                    <NodeSection
                      key={nodeId}
                      node={node}
                      okrs={okrs}
                      sectionIndex={i}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
