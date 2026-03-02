import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useListBSCAspects,
  useListKPIYears,
  useListKPIs,
  useListOrganizationNodes,
  useMyProfile,
  useUpdateKPIProgress,
} from "@/hooks/useQueries";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { KPI } from "../../backend.d";
import {
  Variant_Approved_Draft_Submitted_Revised,
  Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual,
  Variant_Open_Closed,
} from "../../backend.d";

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_LABELS: Record<string, string> = {
  OneTime: "One-time",
  Annual: "Annual (Monthly Sum)",
  Monthly: "Monthly (Avg)",
  Quarterly: "Quarterly (Avg)",
  SemiAnnual: "Semi-Annual (Avg)",
};

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeriodCount(
  period: Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual,
): number {
  switch (period) {
    case Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual.OneTime:
      return 1;
    case Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual.Annual:
      return 12;
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

// ─── Revised Notification Banner ──────────────────────────────────────────────

function RevisedNotificationBanner({
  revisedNodeNames,
}: {
  revisedNodeNames: string[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Alert
        className="border-0 rounded-xl"
        style={{
          background: "oklch(0.95 0.04 72)",
          borderLeft: "4px solid oklch(0.68 0.18 72)",
        }}
      >
        <AlertTriangle
          className="h-4 w-4 flex-shrink-0"
          style={{ color: "oklch(0.50 0.18 72)" }}
        />
        <AlertDescription>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p
                className="font-semibold text-sm"
                style={{ color: "oklch(0.40 0.14 72)" }}
              >
                Access your KPI Proposal because not all KPIs are approved
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "oklch(0.50 0.12 72)" }}
              >
                {revisedNodeNames.length === 1
                  ? `KPIs for "${revisedNodeNames[0]}" have been sent back for revision.`
                  : `KPIs for the following roles require revision: ${revisedNodeNames.join(", ")}.`}
              </p>
            </div>
            <Link to="/workspace/kpi-proposal">
              <Button
                size="sm"
                className="gap-2 flex-shrink-0 text-xs h-8"
                style={{
                  background: "oklch(0.55 0.18 72)",
                  color: "white",
                }}
              >
                Go to KPI Proposal
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}

// ─── Awaiting Approval State ───────────────────────────────────────────────────

function AwaitingApprovalState({
  pendingNodeNames,
}: {
  pendingNodeNames: string[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "oklch(0.92 0.04 250)" }}
      >
        <Clock
          className="w-8 h-8"
          strokeWidth={1.5}
          style={{ color: "oklch(0.38 0.14 250)" }}
        />
      </div>
      <h3 className="font-display font-semibold text-base text-foreground mb-1">
        Awaiting Approval
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4 leading-relaxed">
        Your KPI proposals have been submitted and are pending approval.
        Progress updates will be available once all KPIs are approved.
      </p>
      {pendingNodeNames.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {pendingNodeNames.map((name) => (
            <span
              key={name}
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{
                background: "oklch(0.92 0.04 250)",
                color: "oklch(0.38 0.14 250)",
              }}
            >
              {name}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Not Started State ────────────────────────────────────────────────────────

function NotStartedState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center"
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
        No KPI Proposals Yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        Start by proposing your KPIs and submitting them for approval. Progress
        tracking becomes available once all your KPIs are approved.
      </p>
      <Link to="/workspace/kpi-proposal">
        <Button className="gap-2">
          <ClipboardList className="w-4 h-4" />
          Go to KPI Proposal
        </Button>
      </Link>
    </motion.div>
  );
}

// ─── Per-Period Progress Row ───────────────────────────────────────────────────

interface PeriodRowProps {
  label: string;
  periodIndex: number;
  kpiId: string;
}

function PeriodRow({ label, periodIndex, kpiId }: PeriodRowProps) {
  const updateProgress = useUpdateKPIProgress();
  const [achievement, setAchievement] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const val = Number.parseFloat(achievement);
    if (Number.isNaN(val)) {
      toast.error("Enter a valid number");
      return;
    }
    setSaving(true);
    try {
      await updateProgress.mutateAsync({
        kpiId,
        periodIndex,
        achievement: val,
      });
      toast.success(`${label} progress saved`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/20 transition-colors">
      <span
        className="text-xs font-semibold w-10 flex-shrink-0 text-center"
        style={{ color: "oklch(0.42 0.055 258)" }}
      >
        {label}
      </span>
      <Input
        type="number"
        min="0"
        step="any"
        placeholder="Achievement…"
        value={achievement}
        onChange={(e) => setAchievement(e.target.value)}
        className="flex-1 text-sm h-9"
      />
      <Button
        size="sm"
        onClick={() => void handleSave()}
        disabled={saving || !achievement.trim()}
        className="flex-shrink-0 h-9 gap-1.5 text-xs px-4"
        style={
          !saving && achievement.trim()
            ? { background: "oklch(0.38 0.12 145)", color: "white" }
            : undefined
        }
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
      </Button>
    </div>
  );
}

// ─── KPI Progress Card ────────────────────────────────────────────────────────

interface KPIProgressCardProps {
  kpi: KPI;
  aspectName: string;
  objectiveName: string;
  index: number;
}

function KPIProgressCard({
  kpi,
  aspectName,
  objectiveName,
  index,
}: KPIProgressCardProps) {
  const [expanded, setExpanded] = useState(true);
  const labels = getPeriodLabels(kpi.kpiPeriod);
  const count = getPeriodCount(kpi.kpiPeriod);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05, ease: "easeOut" }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Card Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "oklch(0.92 0.04 145)" }}
        >
          <TrendingUp
            className="w-4 h-4"
            style={{ color: "oklch(0.38 0.12 145)" }}
          />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-display font-semibold text-sm text-foreground truncate">
            {kpi.kpiMeasurement}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {aspectName}
            {objectiveName ? ` · ${objectiveName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full hidden sm:inline"
            style={{
              background: "oklch(0.94 0.012 252)",
              color: "oklch(0.42 0.055 258)",
            }}
          >
            {PERIOD_LABELS[kpi.kpiPeriod] ?? kpi.kpiPeriod}
          </span>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              background: "oklch(0.92 0.04 145)",
              color: "oklch(0.32 0.12 145)",
            }}
          >
            {kpi.kpiWeight}%
          </span>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: "oklch(0.92 0.04 145)",
              color: "oklch(0.32 0.12 145)",
            }}
          >
            Approved
          </span>
        </div>
      </button>

      {/* Period Rows */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-5 pb-5 pt-1 space-y-2"
              style={{ background: "oklch(0.99 0.004 252)" }}
            >
              <div className="flex items-center gap-2 pb-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Period Input ({count} period{count !== 1 ? "s" : ""})
                </span>
              </div>
              {labels.map((label, i) => (
                <PeriodRow
                  key={`${kpi.kpiId}-${label}`}
                  label={label}
                  periodIndex={i + 1}
                  kpiId={kpi.kpiId}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Skeleton Cards ───────────────────────────────────────────────────────────

function SkeletonCards() {
  return (
    <div className="space-y-4">
      {["s1", "s2", "s3"].map((id) => (
        <div
          key={id}
          className="bg-card border border-border rounded-xl p-5 flex items-center gap-4"
        >
          <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({
  approvedCount,
  totalCount,
}: {
  approvedCount: number;
  totalCount: number;
}) {
  const allApproved = approvedCount === totalCount && totalCount > 0;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {/* Total KPIs */}
      <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "oklch(0.94 0.012 252)" }}
        >
          <ClipboardList
            className="w-5 h-5"
            style={{ color: "oklch(0.38 0.065 258)" }}
          />
        </div>
        <div>
          <div className="text-2xl font-display font-bold text-foreground leading-none">
            {totalCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Total KPIs</p>
        </div>
      </div>
      {/* Approved */}
      <div
        className="bg-card border border-border rounded-xl p-5 flex items-center gap-4"
        style={
          allApproved
            ? {
                borderColor: "oklch(0.78 0.12 145 / 0.5)",
                background: "oklch(0.99 0.006 145)",
              }
            : undefined
        }
      >
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: allApproved
              ? "oklch(0.92 0.04 145)"
              : "oklch(0.94 0.012 252)",
          }}
        >
          <CheckCircle2
            className="w-5 h-5"
            style={{
              color: allApproved
                ? "oklch(0.38 0.12 145)"
                : "oklch(0.38 0.065 258)",
            }}
          />
        </div>
        <div>
          <div
            className="text-2xl font-display font-bold leading-none"
            style={{
              color: allApproved ? "oklch(0.38 0.12 145)" : "var(--foreground)",
            }}
          >
            {approvedCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Approved KPIs</p>
        </div>
      </div>
      {/* Progress Status */}
      <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 sm:col-span-1 col-span-2">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: allApproved
              ? "oklch(0.92 0.04 145)"
              : "oklch(0.94 0.012 252)",
          }}
        >
          <BarChart2
            className="w-5 h-5"
            style={{
              color: allApproved
                ? "oklch(0.38 0.12 145)"
                : "oklch(0.38 0.065 258)",
            }}
          />
        </div>
        <div>
          <div
            className="text-sm font-display font-bold leading-none"
            style={{
              color: allApproved
                ? "oklch(0.38 0.12 145)"
                : "oklch(0.44 0.14 72)",
            }}
          >
            {allApproved ? "Ready" : "Pending"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Progress Status</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkspaceKPIProgress() {
  const { data: profile } = useMyProfile();
  const { data: kpiYears, isLoading: yearsLoading } = useListKPIYears();
  const { data: bscAspects } = useListBSCAspects();
  const { data: orgNodes } = useListOrganizationNodes();

  // Derive user's org node IDs and assignment IDs from their active roles
  const userOrgNodeIds = useMemo(() => {
    if (!profile?.roles) return [];
    return profile.roles
      .filter((r) => r.activeStatus && r.orgNodeId)
      .map((r) => r.orgNodeId!)
      .filter(Boolean);
  }, [profile]);

  const myAssignmentIds = useMemo(() => {
    return new Set(
      (profile?.roles ?? [])
        .filter((r) => r.activeStatus)
        .map((r) => r.assignmentId),
    );
  }, [profile]);

  // Open years for the year selector
  const openYears = useMemo(
    () => (kpiYears ?? []).filter((y) => y.status === Variant_Open_Closed.Open),
    [kpiYears],
  );

  const [selectedYearId, setSelectedYearId] = useState<string>("");

  // Auto-select first open year once loaded
  const effectiveYearId = useMemo(() => {
    if (selectedYearId) return selectedYearId;
    return openYears[0]?.kpiYearId ?? "";
  }, [selectedYearId, openYears]);

  // Fetch ALL KPIs (no year filter) to compute gate state
  const { data: allKPIs, isLoading: kpisLoading } = useListKPIs();

  // Filter to user's own KPIs only
  const myKPIs = useMemo(() => {
    if (myAssignmentIds.size === 0) return [];
    return (allKPIs ?? []).filter((k) =>
      myAssignmentIds.has(k.ownerRoleAssignmentId),
    );
  }, [allKPIs, myAssignmentIds]);

  // KPIs for the selected year
  const myKPIsForYear = useMemo(() => {
    if (!effectiveYearId) return myKPIs;
    return myKPIs.filter((k) => k.kpiYearId === effectiveYearId);
  }, [myKPIs, effectiveYearId]);

  // Group by org node
  const kpisByNode = useMemo(() => {
    const map = new Map<string, KPI[]>();
    for (const kpi of myKPIsForYear) {
      const existing = map.get(kpi.organizationNodeId) ?? [];
      map.set(kpi.organizationNodeId, [...existing, kpi]);
    }
    return map;
  }, [myKPIsForYear]);

  // Nodes that are relevant (have KPIs for this year)
  const activeNodeIds = useMemo(
    () => Array.from(kpisByNode.keys()),
    [kpisByNode],
  );

  // Tab state for multi-node navigation
  const [activeTab, setActiveTab] = useState<string>("");
  const effectiveTab = useMemo(() => {
    if (activeTab && activeNodeIds.includes(activeTab)) return activeTab;
    return activeNodeIds[0] ?? "";
  }, [activeTab, activeNodeIds]);

  // Org node name map
  const orgNodeMap = useMemo(
    () => new Map((orgNodes ?? []).map((n) => [n.nodeId, n.nodeName])),
    [orgNodes],
  );

  // BSC Aspect name map
  const aspectMap = useMemo(
    () => new Map((bscAspects ?? []).map((a) => [a.aspectId, a.aspectName])),
    [bscAspects],
  );

  // ── Gate Logic ────────────────────────────────────────────────────────────

  // For each user org node with KPIs in the selected year, determine status
  const nodeGateStatus = useMemo(() => {
    // Returns: 'approved' | 'revised' | 'pending' | 'empty' per node
    const result = new Map<
      string,
      "approved" | "revised" | "pending" | "empty"
    >();
    for (const nodeId of userOrgNodeIds) {
      const nodekpis = kpisByNode.get(nodeId) ?? [];
      if (nodekpis.length === 0) {
        result.set(nodeId, "empty");
        continue;
      }
      const hasRevised = nodekpis.some(
        (k) => k.kpiStatus === Variant_Approved_Draft_Submitted_Revised.Revised,
      );
      const allApproved = nodekpis.every(
        (k) =>
          k.kpiStatus === Variant_Approved_Draft_Submitted_Revised.Approved,
      );
      if (hasRevised) {
        result.set(nodeId, "revised");
      } else if (allApproved) {
        result.set(nodeId, "approved");
      } else {
        result.set(nodeId, "pending");
      }
    }
    return result;
  }, [userOrgNodeIds, kpisByNode]);

  // Names of nodes with revised KPIs
  const revisedNodeNames = useMemo(() => {
    return Array.from(nodeGateStatus.entries())
      .filter(([, status]) => status === "revised")
      .map(([nodeId]) => orgNodeMap.get(nodeId) ?? nodeId);
  }, [nodeGateStatus, orgNodeMap]);

  // Names of nodes still waiting for approval
  const pendingNodeNames = useMemo(() => {
    return Array.from(nodeGateStatus.entries())
      .filter(([, status]) => status === "pending")
      .map(([nodeId]) => orgNodeMap.get(nodeId) ?? nodeId);
  }, [nodeGateStatus, orgNodeMap]);

  // Whether there are any KPIs at all for this user/year
  const hasAnyKPIs = myKPIsForYear.length > 0;

  // Nodes where all KPIs are approved
  const approvedNodeIds = useMemo(() => {
    return Array.from(nodeGateStatus.entries())
      .filter(([, status]) => status === "approved")
      .map(([nodeId]) => nodeId);
  }, [nodeGateStatus]);

  // Only show progress UI if at least one node has ALL KPIs approved
  const canShowProgress = approvedNodeIds.length > 0;

  // Approved KPIs for the active tab (only shown if node is fully approved)
  const currentNodeKPIs = useMemo(() => {
    if (!effectiveTab) return [];
    if (!approvedNodeIds.includes(effectiveTab)) return [];
    return kpisByNode.get(effectiveTab) ?? [];
  }, [effectiveTab, kpisByNode, approvedNodeIds]);

  const isLoading = yearsLoading || kpisLoading;

  const totalApproved = myKPIsForYear.filter(
    (k) => k.kpiStatus === Variant_Approved_Draft_Submitted_Revised.Approved,
  ).length;

  // Year label for display
  const selectedYear = (kpiYears ?? []).find(
    (y) => y.kpiYearId === effectiveYearId,
  );

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
              <TrendingUp
                className="w-5 h-5"
                style={{ color: "oklch(0.82 0.14 72)" }}
              />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground leading-tight">
                KPI Progress
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Update achievement for each KPI period
                {selectedYear ? ` — ${String(selectedYear.year)}` : ""}
              </p>
            </div>
          </div>

          {/* Year Selector */}
          {openYears.length > 0 && (
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                KPI Year
              </Label>
              <Select value={effectiveYearId} onValueChange={setSelectedYearId}>
                <SelectTrigger className="w-32 h-9 text-sm">
                  <SelectValue placeholder="Select year…" />
                </SelectTrigger>
                <SelectContent>
                  {openYears.map((y) => (
                    <SelectItem key={y.kpiYearId} value={y.kpiYearId}>
                      {String(y.year)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-8 space-y-6">
        {isLoading ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {["s1", "s2", "s3"].map((id) => (
                <div
                  key={id}
                  className="bg-card border border-border rounded-xl p-5"
                >
                  <Skeleton className="h-8 w-12 mb-2 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              ))}
            </div>
            <SkeletonCards />
          </>
        ) : (
          <>
            {/* Stats Bar */}
            <StatsBar
              approvedCount={totalApproved}
              totalCount={myKPIsForYear.length}
            />

            {/* Revised Banner — always shown if any node has revised KPIs */}
            {revisedNodeNames.length > 0 && (
              <RevisedNotificationBanner revisedNodeNames={revisedNodeNames} />
            )}

            {/* Gate: No KPIs at all */}
            {!hasAnyKPIs && !isLoading && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <NotStartedState />
              </div>
            )}

            {/* Gate: Has KPIs but none fully approved yet */}
            {hasAnyKPIs &&
              !canShowProgress &&
              revisedNodeNames.length === 0 && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <AwaitingApprovalState pendingNodeNames={pendingNodeNames} />
                </div>
              )}

            {/* Gate: Has KPIs, some are revised but none approved */}
            {hasAnyKPIs && !canShowProgress && revisedNodeNames.length > 0 && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <AwaitingApprovalState pendingNodeNames={pendingNodeNames} />
              </div>
            )}

            {/* Progress UI: at least one node fully approved */}
            {canShowProgress && (
              <>
                {/* Multi-node tabs */}
                {approvedNodeIds.length > 1 ? (
                  <Tabs value={effectiveTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-2">
                      {approvedNodeIds.map((nodeId) => (
                        <TabsTrigger key={nodeId} value={nodeId}>
                          {orgNodeMap.get(nodeId) ?? nodeId}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {approvedNodeIds.map((nodeId) => {
                      const nodekpis = kpisByNode.get(nodeId) ?? [];
                      return (
                        <TabsContent
                          key={nodeId}
                          value={nodeId}
                          className="space-y-4 mt-4"
                        >
                          {nodekpis.map((kpi, i) => (
                            <KPIProgressCard
                              key={kpi.kpiId}
                              kpi={kpi}
                              aspectName={
                                aspectMap.get(kpi.bscAspectId) ??
                                kpi.bscAspectId
                              }
                              objectiveName=""
                              index={i}
                            />
                          ))}
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                ) : (
                  /* Single node: show directly */
                  <div className="space-y-4">
                    {approvedNodeIds.length === 1 && (
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-semibold px-3 py-1 rounded-full"
                          style={{
                            background: "oklch(0.94 0.012 252)",
                            color: "oklch(0.42 0.055 258)",
                          }}
                        >
                          {orgNodeMap.get(approvedNodeIds[0] ?? "") ??
                            "My KPIs"}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs font-medium"
                          style={{
                            borderColor: "oklch(0.78 0.12 145 / 0.5)",
                            color: "oklch(0.38 0.12 145)",
                          }}
                        >
                          {currentNodeKPIs.length} KPI
                          {currentNodeKPIs.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    )}
                    {currentNodeKPIs.map((kpi, i) => (
                      <KPIProgressCard
                        key={kpi.kpiId}
                        kpi={kpi}
                        aspectName={
                          aspectMap.get(kpi.bscAspectId) ?? kpi.bscAspectId
                        }
                        objectiveName=""
                        index={i}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
