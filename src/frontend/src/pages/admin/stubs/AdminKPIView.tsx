import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  useListRoleAssignments,
  useListStrategicObjectives,
  useListUsers,
} from "@/hooks/useQueries";
import type { KPIProgressRecord, KPITargetRecord } from "@/hooks/useQueries";
import { getExtendedActor } from "@/utils/backendExtended";
import {
  BarChart2,
  Building2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Download,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { KPI, OrgNode } from "../../../backend.d";
import {
  Variant_Approved_Draft_Submitted_Revised,
  Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual,
  Variant_Open_Closed,
} from "../../../backend.d";
import { useInternetIdentity } from "../../../hooks/useInternetIdentity";

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeType = "PresidentDirector" | "Director" | "Division" | "Department";

const NODE_TYPE_ORDER: NodeType[] = [
  "PresidentDirector",
  "Director",
  "Division",
  "Department",
];

// ─── Node type badge ──────────────────────────────────────────────────────────

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

// ─── KPI Status badge ─────────────────────────────────────────────────────────

const KPI_STATUS_STYLES: Record<
  Variant_Approved_Draft_Submitted_Revised,
  { bg: string; color: string; label: string }
> = {
  [Variant_Approved_Draft_Submitted_Revised.Draft]: {
    bg: "oklch(0.92 0.02 258)",
    color: "oklch(0.50 0.02 258)",
    label: "Draft",
  },
  [Variant_Approved_Draft_Submitted_Revised.Submitted]: {
    bg: "oklch(0.92 0.04 250)",
    color: "oklch(0.42 0.14 250)",
    label: "Submitted",
  },
  [Variant_Approved_Draft_Submitted_Revised.Approved]: {
    bg: "oklch(0.92 0.04 145)",
    color: "oklch(0.42 0.14 145)",
    label: "Approved",
  },
  [Variant_Approved_Draft_Submitted_Revised.Revised]: {
    bg: "oklch(0.95 0.04 72)",
    color: "oklch(0.52 0.14 72)",
    label: "Revised",
  },
};

function KPIStatusBadge({
  status,
}: {
  status: Variant_Approved_Draft_Submitted_Revised;
}) {
  const s =
    KPI_STATUS_STYLES[status] ??
    KPI_STATUS_STYLES[Variant_Approved_Draft_Submitted_Revised.Draft];
  return (
    <span
      className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
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

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCSVField(value: string | number | undefined | null): string {
  const str = value !== undefined && value !== null ? String(value) : "";
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
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
      data-ocid={`admin.kpi.period.row.${index + 1}`}
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

// ─── Expandable KPI row ───────────────────────────────────────────────────────

interface KPIRowProps {
  kpi: KPI;
  ownerName: string;
  aspectName: string;
  objectiveName: string;
  index: number;
}

function KPIRow({
  kpi,
  ownerName,
  aspectName,
  objectiveName,
  index,
}: KPIRowProps) {
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
          gridTemplateColumns:
            "1fr 100px 120px 1fr 90px 60px 80px 80px 80px 28px",
          background: index % 2 === 0 ? "oklch(0.98 0.003 252)" : "white",
        }}
        data-ocid={`admin.kpi.row.${index + 1}`}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {kpi.kpiMeasurement}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {ownerName}
          </p>
        </div>

        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full truncate"
          style={{
            background: "oklch(0.93 0.04 185)",
            color: "oklch(0.42 0.12 195)",
          }}
        >
          {aspectName}
        </span>

        <span className="text-xs text-muted-foreground truncate">
          {objectiveName}
        </span>

        <span className="text-xs text-muted-foreground truncate">
          {PERIOD_TYPE_LABELS[kpi.kpiPeriod] ?? kpi.kpiPeriod}
        </span>

        <span className="text-xs text-muted-foreground truncate">
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

        <KPIStatusBadge status={kpi.kpiStatus} />

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
  ownerMap: Map<string, string>;
  aspectMap: Map<string, string>;
  objectiveMap: Map<string, string>;
  sectionIndex: number;
}

function NodeSection({
  node,
  kpis,
  ownerMap,
  aspectMap,
  objectiveMap,
  sectionIndex,
}: NodeSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const nodeType = node.nodeType as NodeType;

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
        data-ocid={`admin.kpi.section.${sectionIndex + 1}`}
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
                  gridTemplateColumns:
                    "1fr 100px 120px 1fr 90px 60px 80px 80px 80px 28px",
                  background: "oklch(0.96 0.006 252)",
                }}
              >
                <span className="text-xs font-semibold text-muted-foreground px-4">
                  KPI Measurement
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  BSC Aspect
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Strategic Obj.
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Owner
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Period
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Wt.
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Yearly Achv.
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Final Score
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Status
                </span>
                <span />
              </div>

              <div className="divide-y divide-border/50 px-2 pb-2">
                {kpis.map((kpi, i) => (
                  <KPIRow
                    key={kpi.kpiId}
                    kpi={kpi}
                    ownerName={ownerMap.get(kpi.ownerRoleAssignmentId) ?? "—"}
                    aspectName={
                      aspectMap.get(kpi.bscAspectId) ?? kpi.bscAspectId
                    }
                    objectiveName={
                      objectiveMap.get(kpi.strategicObjectiveId) ??
                      kpi.strategicObjectiveId
                    }
                    index={i}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-5" data-ocid="admin.kpi.loading_state">
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
  nodesWithKPIs,
  totalNodes,
}: {
  totalKPIs: number;
  nodesWithKPIs: number;
  totalNodes: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        {
          label: "Total KPIs",
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
          value: nodesWithKPIs,
          icon: (
            <ClipboardList
              className="w-5 h-5"
              style={{ color: "oklch(0.42 0.14 145)" }}
            />
          ),
          iconBg: "oklch(0.92 0.04 145)",
        },
        {
          label: "Total Org Nodes",
          value: totalNodes,
          icon: (
            <Building2
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

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ yearLabel }: { yearLabel: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center bg-card border border-border rounded-2xl"
      data-ocid="admin.kpi.empty_state"
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
        No KPIs Found
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
        No KPIs found for {yearLabel}. KPIs will appear here once users have
        created and submitted them.
      </p>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminKPIView() {
  const { identity } = useInternetIdentity();
  const { data: kpiYears, isLoading: yearsLoading } = useListKPIYears();
  const { data: orgNodes, isLoading: nodesLoading } =
    useListOrganizationNodes();
  const { data: bscAspects } = useListBSCAspects();
  const { data: strategicObjectives } = useListStrategicObjectives();
  const { data: users } = useListUsers();
  const { data: roleAssignments } = useListRoleAssignments();
  const [isDownloading, setIsDownloading] = useState(false);

  const openYear = useMemo(
    () => (kpiYears ?? []).find((y) => y.status === Variant_Open_Closed.Open),
    [kpiYears],
  );

  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const effectiveYearId = useMemo(
    () => selectedYearId || (openYear?.kpiYearId ?? ""),
    [selectedYearId, openYear],
  );

  const { data: allKPIs, isLoading: kpisLoading } = useListKPIs(
    effectiveYearId || undefined,
    undefined,
    undefined,
  );

  // Build lookup maps
  const aspectMap = useMemo(
    () => new Map((bscAspects ?? []).map((a) => [a.aspectId, a.aspectName])),
    [bscAspects],
  );

  const objectiveMap = useMemo(
    () =>
      new Map(
        (strategicObjectives ?? []).map((o) => [
          o.objectiveId,
          o.objectiveName,
        ]),
      ),
    [strategicObjectives],
  );

  const userMap = useMemo(
    () => new Map((users ?? []).map((u) => [u.userId, u.fullName])),
    [users],
  );

  // assignmentId → owner name
  const ownerMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const ra of roleAssignments ?? []) {
      const name = userMap.get(ra.userId) ?? "Unknown";
      map.set(ra.assignmentId, name);
    }
    return map;
  }, [roleAssignments, userMap]);

  const orgNodeMap = useMemo(
    () => new Map((orgNodes ?? []).map((n) => [n.nodeId, n])),
    [orgNodes],
  );

  // Group KPIs by org node
  const kpisByNode = useMemo(() => {
    const map = new Map<string, KPI[]>();
    for (const kpi of allKPIs ?? []) {
      const existing = map.get(kpi.organizationNodeId) ?? [];
      map.set(kpi.organizationNodeId, [...existing, kpi]);
    }
    return map;
  }, [allKPIs]);

  // Sort nodes: PD → Director → Division → Department
  const sortedNodeIds = useMemo(
    () =>
      Array.from(kpisByNode.keys()).sort((a, b) => {
        const nodeA = orgNodeMap.get(a);
        const nodeB = orgNodeMap.get(b);
        const typeA = (nodeA?.nodeType as NodeType) ?? "Department";
        const typeB = (nodeB?.nodeType as NodeType) ?? "Department";
        return NODE_TYPE_ORDER.indexOf(typeA) - NODE_TYPE_ORDER.indexOf(typeB);
      }),
    [kpisByNode, orgNodeMap],
  );

  const selectedYear = (kpiYears ?? []).find(
    (y) => y.kpiYearId === effectiveYearId,
  );
  const yearLabel = selectedYear ? String(selectedYear.year) : "selected year";

  const isLoading = yearsLoading || nodesLoading || kpisLoading;

  // Build assignmentId → orgNodeId map for CSV
  const assignmentNodeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const ra of roleAssignments ?? []) {
      if (ra.orgNodeId) map.set(ra.assignmentId, ra.orgNodeId);
    }
    return map;
  }, [roleAssignments]);

  // ─── CSV Download ─────────────────────────────────────────────────────────

  const handleDownloadCSV = async () => {
    if (!allKPIs || allKPIs.length === 0) return;
    setIsDownloading(true);
    try {
      const extActor = await getExtendedActor(identity);

      const headers = [
        "Owner",
        "Org Node",
        "BSC Aspect",
        "Strategic Objective",
        "KPI Measurement",
        "Period Type",
        "Weight",
        "Yearly Achievement",
        "Final Score",
        "Status",
        "Period Label",
        "Target",
        "Achievement",
        "Score",
      ].join(",");

      const rows: string[] = [headers];

      for (const kpi of allKPIs) {
        const ownerName = ownerMap.get(kpi.ownerRoleAssignmentId) ?? "—";
        const nodeId =
          kpi.organizationNodeId ||
          assignmentNodeMap.get(kpi.ownerRoleAssignmentId) ||
          "";
        const nodeName = orgNodeMap.get(nodeId)?.nodeName ?? "—";
        const aspectName = aspectMap.get(kpi.bscAspectId) ?? "—";
        const objectiveName = objectiveMap.get(kpi.strategicObjectiveId) ?? "—";
        const periodLabel = PERIOD_TYPE_LABELS[kpi.kpiPeriod] ?? kpi.kpiPeriod;

        // Fetch targets + progress for this KPI
        let targets: Array<{ periodIndex: bigint; targetValue: number }> = [];
        let progress: Array<{
          periodIndex: bigint;
          achievement: number;
          score: number;
        }> = [];

        try {
          [targets, progress] = await Promise.all([
            extActor.getKPITargets(kpi.kpiId),
            extActor.getKPIProgressList(kpi.kpiId),
          ]);
        } catch (_e) {
          // leave empty
        }

        const scores = progress.map((p) => p.score);
        let yearlyAchievement = 0;
        if (scores.length > 0) {
          if (
            kpi.kpiPeriod ===
            Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual.OneTime
          ) {
            yearlyAchievement = scores[0] ?? 0;
          } else {
            yearlyAchievement =
              scores.reduce((a, b) => a + b, 0) / scores.length;
          }
        }
        const finalScore = calcFinalScore(yearlyAchievement, kpi.kpiWeight);

        // Summary row (no period detail)
        rows.push(
          [
            escapeCSVField(ownerName),
            escapeCSVField(nodeName),
            escapeCSVField(aspectName),
            escapeCSVField(objectiveName),
            escapeCSVField(kpi.kpiMeasurement),
            escapeCSVField(periodLabel),
            escapeCSVField(kpi.kpiWeight),
            escapeCSVField(yearlyAchievement.toFixed(2)),
            escapeCSVField(finalScore.toFixed(2)),
            escapeCSVField(kpi.kpiStatus),
            "",
            "",
            "",
            "",
          ].join(","),
        );

        // Period detail rows
        const periodLabels = getPeriodLabels(kpi.kpiPeriod);
        periodLabels.forEach((pLabel, i) => {
          const periodIdx = i + 1;
          const target = targets.find(
            (t) => Number(t.periodIndex) === periodIdx,
          );
          const prog = progress.find(
            (p) => Number(p.periodIndex) === periodIdx,
          );
          rows.push(
            [
              escapeCSVField(ownerName),
              escapeCSVField(nodeName),
              escapeCSVField(aspectName),
              escapeCSVField(objectiveName),
              escapeCSVField(kpi.kpiMeasurement),
              escapeCSVField(periodLabel),
              escapeCSVField(kpi.kpiWeight),
              "",
              "",
              "",
              escapeCSVField(pLabel),
              escapeCSVField(target?.targetValue ?? ""),
              escapeCSVField(prog?.achievement ?? ""),
              escapeCSVField(prog?.score ?? ""),
            ].join(","),
          );
        });
      }

      const csv = rows.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kpi-report-${yearLabel}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
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
                KPI View
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Company-wide KPI overview — all organizational units
                {selectedYear ? ` · ${String(selectedYear.year)}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                KPI Year
              </span>
              <Select value={effectiveYearId} onValueChange={setSelectedYearId}>
                <SelectTrigger
                  className="w-32 h-9 text-sm"
                  data-ocid="admin.kpi.year_select"
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

            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadCSV}
              disabled={isDownloading || (allKPIs ?? []).length === 0}
              className="flex items-center gap-2"
              data-ocid="admin.kpi.download_button"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? "Preparing…" : "Download KPI CSV"}
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-8 space-y-6">
        {isLoading ? (
          <PageSkeleton />
        ) : (
          <>
            <StatsBar
              totalKPIs={(allKPIs ?? []).length}
              nodesWithKPIs={kpisByNode.size}
              totalNodes={(orgNodes ?? []).length}
            />

            {sortedNodeIds.length === 0 ? (
              <EmptyState yearLabel={yearLabel} />
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
                      ownerMap={ownerMap}
                      aspectMap={aspectMap}
                      objectiveMap={objectiveMap}
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
