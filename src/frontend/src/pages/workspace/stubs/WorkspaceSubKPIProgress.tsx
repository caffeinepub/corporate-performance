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
  useGetKPIProgressData,
  useGetKPIScoreParameter,
  useListBSCAspects,
  useListKPIYears,
  useListKPIs,
  useListOrganizationNodes,
  useMyProfile,
  useNodeKPIProgressSummary,
} from "@/hooks/useQueries";
import type { KPIProgressRecord, KPITargetRecord } from "@/hooks/useQueries";
import {
  BarChart2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Trophy,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { KPI, OrgNode } from "../../../backend.d";
import {
  Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual,
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

// ─── Period helpers ───────────────────────────────────────────────────────────

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const QUARTER_LABELS = ["Q1", "Q2", "Q3", "Q4"];
const SEMI_ANNUAL_LABELS = ["H1", "H2"];

function getPeriodLabels(
  period: Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual,
): string[] {
  switch (period) {
    case Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual.Annual:
    case Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual.Monthly:
      return MONTH_LABELS;
    case Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual.Quarterly:
      return QUARTER_LABELS;
    case Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual.SemiAnnual:
      return SEMI_ANNUAL_LABELS;
    default:
      return ["Year Target"];
  }
}

function getPeriodCount(
  period: Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual,
): number {
  switch (period) {
    case Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual.Annual:
    case Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual.Monthly:
      return 12;
    case Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual.Quarterly:
      return 4;
    case Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual.SemiAnnual:
      return 2;
    default:
      return 1;
  }
}

function calcYearlyAchievement(
  period: Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual,
  progressRecords: KPIProgressRecord[],
): number {
  if (progressRecords.length === 0) return 0;
  const scores = progressRecords.map((p) => p.score);
  switch (period) {
    case Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual.OneTime:
      return scores[0] ?? 0;
    default:
      return scores.reduce((a, b) => a + b, 0) / scores.length;
  }
}

function calcFinalScore(yearlyAchievement: number, kpiWeight: number): number {
  return yearlyAchievement * (kpiWeight / 100);
}

const PERIOD_TYPE_LABELS: Record<string, string> = {
  OneTime: "One-time",
  Annual: "Annual (Sum)",
  Monthly: "Monthly (Avg)",
  Quarterly: "Quarterly (Avg)",
  SemiAnnual: "Semi-Annual (Avg)",
};

// ─── Scope computation ────────────────────────────────────────────────────────

function computeInScopeNodeIds(
  roles: Array<{ roleType: string; orgNodeId?: string; activeStatus: boolean }>,
  orgNodes: OrgNode[],
): Set<string> {
  const nodeMap = new Map<string, OrgNode>(orgNodes.map((n) => [n.nodeId, n]));

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
    const roleType = role.roleType;

    if (roleType === "PresidentDirector") {
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
      // Descendant nodes (Divisions + Departments under those Divisions), not own node
      const descendants = getDescendantNodeIds(nodeId);
      for (const id of descendants) inScope.add(id);
    } else if (roleType === "DivisionHead") {
      // Only Department nodes directly under this Division
      for (const node of orgNodes) {
        if (node.parentNodeId === nodeId) {
          inScope.add(node.nodeId);
        }
      }
    } else if (roleType === "DepartmentHead") {
      // Department Head: own node only (but empty state handled below)
      // We do add it — handled as "no subordinates" in UI if they have NO other roles
      const _ = nodeMap.get(nodeId);
      void _;
      // Don't add: Department Head has no subordinates per spec
    }
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

// ─── Read-only period detail row ──────────────────────────────────────────────

interface ReadOnlyPeriodRowProps {
  label: string;
  periodIndex: number;
  targetRecord?: KPITargetRecord;
  progressRecord?: KPIProgressRecord;
  index: number;
}

function ReadOnlyPeriodRow({
  label,
  periodIndex: _periodIndex,
  targetRecord,
  progressRecord,
  index,
}: ReadOnlyPeriodRowProps) {
  const isEven = index % 2 === 0;
  const rowBg = isEven ? "oklch(0.97 0.004 252)" : "oklch(0.99 0.002 252)";

  const lastUpdated = progressRecord?.updatedAt
    ? new Date(
        Number(progressRecord.updatedAt / 1_000_000n),
      ).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div
      className="grid items-center gap-2 px-4 py-3 rounded-xl"
      style={{
        gridTemplateColumns: "60px 1fr 1fr 1fr 140px",
        background: rowBg,
      }}
      data-ocid={`sub.kpi.progress.row.${index + 1}`}
    >
      <span
        className="text-xs font-bold text-center py-1 rounded-md"
        style={{
          color: "oklch(0.38 0.065 258)",
          background: "oklch(0.93 0.012 252)",
        }}
      >
        {label}
      </span>

      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">Target</span>
        <span className="text-sm font-semibold text-foreground">
          {targetRecord !== undefined
            ? targetRecord.targetValue.toLocaleString()
            : "—"}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">Achievement</span>
        <span className="text-sm font-semibold text-foreground">
          {progressRecord !== undefined
            ? progressRecord.achievement.toLocaleString()
            : "—"}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">Score (0–5)</span>
        <span
          className="text-sm font-bold"
          style={{
            color:
              progressRecord !== undefined
                ? progressRecord.score >= 4
                  ? "oklch(0.42 0.14 145)"
                  : progressRecord.score >= 2.5
                    ? "oklch(0.52 0.18 72)"
                    : progressRecord.score > 0
                      ? "oklch(0.48 0.18 30)"
                      : "var(--muted-foreground)"
                : "var(--muted-foreground)",
          }}
        >
          {progressRecord !== undefined ? progressRecord.score.toFixed(2) : "—"}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">Last Updated</span>
        <span className="text-xs text-muted-foreground">
          {lastUpdated ?? "—"}
        </span>
      </div>
    </div>
  );
}

// ─── Expandable KPI row in the summary table ──────────────────────────────────

interface KPIRowProps {
  kpi: KPI;
  aspectName: string;
  index: number;
}

function KPIRow({ kpi, aspectName, index }: KPIRowProps) {
  const [expanded, setExpanded] = useState(false);
  const labels = getPeriodLabels(kpi.kpiPeriod);
  const count = getPeriodCount(kpi.kpiPeriod);

  const { data: progressData, isLoading: progressLoading } =
    useGetKPIProgressData(kpi.kpiId);
  const { data: scoreParam = "" } = useGetKPIScoreParameter(kpi.kpiId);

  const yearlyAchievement = useMemo(() => {
    const records = progressData?.progress ?? [];
    return calcYearlyAchievement(kpi.kpiPeriod, records);
  }, [kpi.kpiPeriod, progressData?.progress]);

  const finalScore = useMemo(
    () => calcFinalScore(yearlyAchievement, kpi.kpiWeight),
    [yearlyAchievement, kpi.kpiWeight],
  );

  const getTargetForPeriod = (periodIdx: number) =>
    progressData?.targets?.find((t) => Number(t.periodIndex) === periodIdx);

  const getProgressForPeriod = (periodIdx: number) =>
    (progressData?.progress ?? []).find(
      (p) => Number(p.periodIndex) === periodIdx,
    );

  return (
    <>
      {/* Summary Row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full grid items-center gap-2 px-4 py-3 text-left hover:bg-muted/30 transition-colors rounded-xl"
        style={{
          gridTemplateColumns: "1fr 120px 80px 90px 90px 28px",
          background: index % 2 === 0 ? "oklch(0.98 0.003 252)" : "white",
        }}
        data-ocid={`sub.kpi.row.${index + 1}`}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {kpi.kpiMeasurement}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {aspectName} · {PERIOD_TYPE_LABELS[kpi.kpiPeriod] ?? kpi.kpiPeriod}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          {PERIOD_TYPE_LABELS[kpi.kpiPeriod] ?? kpi.kpiPeriod}
        </span>
        <span className="text-xs font-medium text-foreground">
          {kpi.kpiWeight}%
        </span>
        <span
          className="text-sm font-bold"
          style={{
            color:
              yearlyAchievement > 0
                ? "oklch(0.42 0.14 145)"
                : "var(--muted-foreground)",
          }}
        >
          {yearlyAchievement.toFixed(2)}
        </span>
        <span
          className="text-sm font-bold"
          style={{
            color:
              finalScore > 0
                ? "oklch(0.38 0.12 145)"
                : "var(--muted-foreground)",
          }}
        >
          {finalScore.toFixed(2)}
        </span>
        <span className="text-muted-foreground">
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </span>
      </button>

      {/* Expanded Detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 pt-1"
              style={{ background: "oklch(0.985 0.003 252)" }}
            >
              {/* Score Parameter */}
              {scoreParam && (
                <div
                  className="mb-3 px-3 py-2 rounded-lg text-xs leading-relaxed"
                  style={{
                    background: "oklch(0.94 0.012 252)",
                    color: "oklch(0.38 0.065 258)",
                  }}
                >
                  <span className="font-semibold">Score Criteria: </span>
                  {scoreParam}
                </div>
              )}

              {/* Column headers */}
              <div
                className="grid items-center gap-2 px-4 py-2 mb-1"
                style={{ gridTemplateColumns: "60px 1fr 1fr 1fr 140px" }}
              >
                <span className="text-xs font-semibold text-muted-foreground text-center">
                  Period
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Target
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Achievement
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Score (0–5)
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Last Updated
                </span>
              </div>

              {progressLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: count }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
                    <Skeleton key={i} className="h-10 rounded-xl w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {labels.map((label, i) => (
                    <ReadOnlyPeriodRow
                      key={`${kpi.kpiId}-${label}`}
                      label={label}
                      periodIndex={i + 1}
                      targetRecord={getTargetForPeriod(i + 1)}
                      progressRecord={getProgressForPeriod(i + 1)}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Collapsible Node Section ─────────────────────────────────────────────────

interface NodeSectionProps {
  node: OrgNode;
  kpis: KPI[];
  aspectMap: Map<string, string>;
  sectionIndex: number;
}

function NodeSection({
  node,
  kpis,
  aspectMap,
  sectionIndex,
}: NodeSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const nodeType = node.nodeType as NodeType;

  // Compute total final score for this node using cached progress queries
  const kpiSummaryInputs = useMemo(
    () =>
      kpis.map((k) => ({
        kpiId: k.kpiId,
        kpiWeight: k.kpiWeight,
        kpiPeriod: k.kpiPeriod as string,
      })),
    [kpis],
  );
  const { totalFinalScore, allLoaded } =
    useNodeKPIProgressSummary(kpiSummaryInputs);

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
        data-ocid={`sub.kpi.section.${sectionIndex + 1}`}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background:
              NODE_TYPE_STYLES[nodeType]?.bg ?? "oklch(0.94 0.012 252)",
          }}
        >
          <BarChart2
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
              {kpis.length} KPI{kpis.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>

        {/* Total Final Score chip */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg flex-shrink-0"
          style={{
            background: "oklch(0.92 0.04 145)",
            color: "oklch(0.32 0.12 145)",
          }}
          data-ocid={`sub.kpi.section.score.${sectionIndex + 1}`}
        >
          <Trophy className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-xs font-semibold whitespace-nowrap">
            {allLoaded ? totalFinalScore.toFixed(2) : "…"}
          </span>
          <span className="text-xs font-normal opacity-70">Total Score</span>
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
                className="grid items-center gap-2 px-4 py-2 border-b border-border"
                style={{
                  gridTemplateColumns: "1fr 120px 80px 90px 90px 28px",
                  background: "oklch(0.96 0.006 252)",
                }}
              >
                <span className="text-xs font-semibold text-muted-foreground px-4">
                  KPI Measurement
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Period
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Weight
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Yearly Achv.
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Final Score
                </span>
                <span />
              </div>

              <div className="divide-y divide-border/50 px-2 pb-2">
                {kpis.map((kpi, i) => (
                  <KPIRow
                    key={kpi.kpiId}
                    kpi={kpi}
                    aspectName={
                      aspectMap.get(kpi.bscAspectId) ?? kpi.bscAspectId
                    }
                    index={i}
                  />
                ))}
              </div>

              {/* Total Final Score footer row */}
              <div
                className="grid items-center gap-2 px-4 py-3 border-t border-border mx-2 mb-2 rounded-xl"
                style={{
                  gridTemplateColumns: "1fr 120px 80px 90px 90px 28px",
                  background: "oklch(0.92 0.04 145)",
                }}
                data-ocid={`sub.kpi.section.total.${sectionIndex + 1}`}
              >
                <div className="flex items-center gap-1.5 px-4">
                  <Trophy
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: "oklch(0.32 0.12 145)" }}
                  />
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "oklch(0.32 0.12 145)" }}
                  >
                    Total Final Score
                  </span>
                </div>
                <span />
                <span />
                <span />
                <span
                  className="text-sm font-bold"
                  style={{ color: "oklch(0.28 0.14 145)" }}
                >
                  {allLoaded ? totalFinalScore.toFixed(2) : "…"}
                </span>
                <span />
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
        monitor. KPI progress for your own KPIs is available in{" "}
        <strong>KPI Progress</strong>.
      </p>
    </motion.div>
  );
}

function NoApprovedKPIsState({ yearLabel }: { yearLabel: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center bg-card border border-border rounded-2xl"
      data-ocid="sub.kpi.empty_state"
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
        No Approved KPIs
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
        No approved KPIs found for your subordinates in {yearLabel}. KPIs will
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
  totalKPIs,
  totalNodes,
  inScopeNodes,
}: {
  totalKPIs: number;
  totalNodes: number;
  inScopeNodes: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        {
          label: "Subordinate KPIs",
          value: totalKPIs,
          icon: (
            <BarChart2
              className="w-5 h-5"
              style={{ color: "oklch(0.38 0.065 258)" }}
            />
          ),
          iconBg: "oklch(0.94 0.012 252)",
        },
        {
          label: "Nodes with KPIs",
          value: totalNodes,
          icon: (
            <ClipboardList
              className="w-5 h-5"
              style={{ color: "oklch(0.42 0.14 145)" }}
            />
          ),
          iconBg: "oklch(0.92 0.04 145)",
        },
        {
          label: "Nodes in Scope",
          value: inScopeNodes,
          icon: (
            <Users
              className="w-5 h-5"
              style={{ color: "oklch(0.42 0.14 250)" }}
            />
          ),
          iconBg: "oklch(0.92 0.04 250)",
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

export default function WorkspaceSubKPIProgress() {
  const { data: profile } = useMyProfile();
  const { data: kpiYears, isLoading: yearsLoading } = useListKPIYears();
  const { data: orgNodes, isLoading: nodesLoading } =
    useListOrganizationNodes();
  const { data: bscAspects } = useListBSCAspects();

  const openYears = useMemo(
    () => (kpiYears ?? []).filter((y) => y.status === Variant_Open_Closed.Open),
    [kpiYears],
  );

  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const effectiveYearId = useMemo(
    () => selectedYearId || (openYears[0]?.kpiYearId ?? ""),
    [selectedYearId, openYears],
  );

  const { data: allKPIs, isLoading: kpisLoading } = useListKPIs(
    effectiveYearId || undefined,
    undefined,
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

  const aspectMap = useMemo(
    () => new Map((bscAspects ?? []).map((a) => [a.aspectId, a.aspectName])),
    [bscAspects],
  );

  // Filter KPIs to in-scope nodes
  const scopedKPIs = useMemo(
    () =>
      (allKPIs ?? []).filter((k) => inScopeNodeIds.has(k.organizationNodeId)),
    [allKPIs, inScopeNodeIds],
  );

  // Group KPIs by org node
  const kpisByNode = useMemo(() => {
    const map = new Map<string, KPI[]>();
    for (const kpi of scopedKPIs) {
      const existing = map.get(kpi.organizationNodeId) ?? [];
      map.set(kpi.organizationNodeId, [...existing, kpi]);
    }
    return map;
  }, [scopedKPIs]);

  // Sort nodes: PD → Director → Division → Department
  const sortedNodeIds = useMemo(() => {
    return Array.from(kpisByNode.keys()).sort((a, b) => {
      const nodeA = orgNodeMap.get(a);
      const nodeB = orgNodeMap.get(b);
      const typeA = (nodeA?.nodeType as NodeType) ?? "Department";
      const typeB = (nodeB?.nodeType as NodeType) ?? "Department";
      return NODE_TYPE_ORDER.indexOf(typeA) - NODE_TYPE_ORDER.indexOf(typeB);
    });
  }, [kpisByNode, orgNodeMap]);

  const selectedYear = (kpiYears ?? []).find(
    (y) => y.kpiYearId === effectiveYearId,
  );
  const yearLabel = selectedYear ? String(selectedYear.year) : "selected year";

  const isLoading = yearsLoading || nodesLoading || kpisLoading;

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
              <BarChart2
                className="w-5 h-5"
                style={{ color: "oklch(0.82 0.14 72)" }}
              />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground leading-tight">
                Subordinate KPI Progress
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Read-only view of KPI progress for your organizational scope
                {selectedYear ? ` — ${String(selectedYear.year)}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              KPI Year
            </span>
            <Select
              value={effectiveYearId}
              onValueChange={setSelectedYearId}
              data-ocid="sub.kpi.select"
            >
              <SelectTrigger
                className="w-32 h-9 text-sm"
                data-ocid="sub.kpi.select"
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
              totalKPIs={scopedKPIs.length}
              totalNodes={sortedNodeIds.length}
              inScopeNodes={inScopeNodeIds.size}
            />

            {sortedNodeIds.length === 0 ? (
              <NoApprovedKPIsState yearLabel={yearLabel} />
            ) : (
              <div className="space-y-5">
                {sortedNodeIds.map((nodeId, i) => {
                  const node = orgNodeMap.get(nodeId);
                  const kpis = kpisByNode.get(nodeId) ?? [];
                  if (!node) return null;
                  return (
                    <NodeSection
                      key={nodeId}
                      node={node}
                      kpis={kpis}
                      aspectMap={aspectMap}
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
