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
  useCreateKPI,
  useDeleteKPI,
  useListBSCAspects,
  useListKPIYears,
  useListKPIs,
  useListOrganizationNodes,
  useListStrategicObjectives,
  useMyProfile,
  useSubmitKPI,
  useUpdateKPI,
  useUpdateKPIProgress,
} from "@/hooks/useQueries";
import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Edit2,
  Eye,
  Filter,
  Loader2,
  Plus,
  Send,
  Trash2,
  TrendingUp,
  XCircle,
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

const STATUS_CONFIG: Record<
  Variant_Approved_Draft_Submitted_Revised,
  { label: string; color: string; bg: string }
> = {
  [Variant_Approved_Draft_Submitted_Revised.Draft]: {
    label: "Draft",
    color: "oklch(0.40 0.08 258)",
    bg: "oklch(0.93 0.015 252)",
  },
  [Variant_Approved_Draft_Submitted_Revised.Submitted]: {
    label: "Submitted",
    color: "oklch(0.40 0.14 250)",
    bg: "oklch(0.92 0.04 250)",
  },
  [Variant_Approved_Draft_Submitted_Revised.Approved]: {
    label: "Approved",
    color: "oklch(0.38 0.12 145)",
    bg: "oklch(0.92 0.04 145)",
  },
  [Variant_Approved_Draft_Submitted_Revised.Revised]: {
    label: "Revised",
    color: "oklch(0.50 0.14 72)",
    bg: "oklch(0.95 0.04 72)",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function calculateYearlyTarget(
  targets: number[],
  period: string,
): number | null {
  const filled = targets.filter((t) => !Number.isNaN(t) && t !== null);
  if (filled.length === 0) return null;
  if (period === "Annual") {
    return filled.reduce((a, b) => a + b, 0);
  }
  if (
    period === "Monthly" ||
    period === "Quarterly" ||
    period === "SemiAnnual"
  ) {
    return filled.reduce((a, b) => a + b, 0) / filled.length;
  }
  return filled[0] ?? null;
}

// ─── Stats Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  highlight?: boolean;
}

function StatCard({ label, value, icon, highlight }: StatCardProps) {
  return (
    <div
      className="bg-card border border-border rounded-xl p-5 flex items-center gap-4"
      style={
        highlight
          ? {
              borderColor: "oklch(0.82 0.14 72 / 0.6)",
              background: "oklch(0.99 0.006 72)",
            }
          : undefined
      }
    >
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "oklch(0.94 0.012 252)" }}
      >
        <span style={{ color: "oklch(0.38 0.065 258)" }}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-2xl font-display font-bold text-foreground leading-none">
          {value}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

// ─── Weight Indicator ─────────────────────────────────────────────────────────

function WeightIndicator({
  weightByNode,
  orgNodeMap,
  kpiCount,
}: {
  weightByNode: Map<string, number>;
  orgNodeMap: Map<string, string>;
  kpiCount: number;
}) {
  if (kpiCount === 0) return null;

  const entries = Array.from(weightByNode.entries());

  // Single node: render as a single row (same as before)
  if (entries.length <= 1) {
    const totalWeight = entries[0]?.[1] ?? 0;
    const isExact = Math.abs(totalWeight - 100) < 0.01;

    if (isExact) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
          style={{
            background: "oklch(0.92 0.04 145)",
            color: "oklch(0.32 0.12 145)",
          }}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>
            Total Weight: <strong>{totalWeight.toFixed(1)}%</strong> — Ready for
            Submission ✅
          </span>
        </motion.div>
      );
    }

    const isOver = totalWeight > 100;
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
        style={{
          background: isOver ? "oklch(0.95 0.04 27)" : "oklch(0.96 0.04 72)",
          color: isOver ? "oklch(0.42 0.18 27)" : "oklch(0.44 0.14 72)",
        }}
      >
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>
          {isOver
            ? `Total KPI Weight exceeds 100%. Current total: ${totalWeight.toFixed(1)}%`
            : `Total KPI Weight must equal exactly 100%. Current total: ${totalWeight.toFixed(1)}%`}
        </span>
      </motion.div>
    );
  }

  // Multiple nodes: render one indicator row per org node
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border overflow-hidden"
      style={{ background: "oklch(0.99 0.004 252)" }}
    >
      <div className="px-4 py-2.5 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Weight per Organization Role
        </span>
      </div>
      <div className="divide-y divide-border">
        {entries.map(([nodeId, weight]) => {
          const nodeName = orgNodeMap.get(nodeId) ?? nodeId;
          const isExact = Math.abs(weight - 100) < 0.01;
          const isOver = weight > 100;
          return (
            <div
              key={nodeId}
              className="flex items-center justify-between px-4 py-2.5 text-sm"
            >
              <span className="font-medium text-foreground truncate max-w-[200px]">
                {nodeName}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className="font-mono font-semibold text-sm"
                  style={{
                    color: isExact
                      ? "oklch(0.38 0.12 145)"
                      : isOver
                        ? "oklch(0.42 0.18 27)"
                        : "oklch(0.44 0.14 72)",
                  }}
                >
                  {weight.toFixed(1)}%
                </span>
                {isExact ? (
                  <CheckCircle2
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: "oklch(0.38 0.12 145)" }}
                  />
                ) : (
                  <AlertTriangle
                    className="w-4 h-4 flex-shrink-0"
                    style={{
                      color: isOver
                        ? "oklch(0.42 0.18 27)"
                        : "oklch(0.44 0.14 72)",
                    }}
                  />
                )}
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={
                    isExact
                      ? {
                          background: "oklch(0.92 0.04 145)",
                          color: "oklch(0.32 0.12 145)",
                        }
                      : isOver
                        ? {
                            background: "oklch(0.95 0.04 27)",
                            color: "oklch(0.42 0.18 27)",
                          }
                        : {
                            background: "oklch(0.96 0.04 72)",
                            color: "oklch(0.44 0.14 72)",
                          }
                  }
                >
                  {isExact ? "Ready" : isOver ? "Exceeds 100%" : "Not 100%"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── KPI Form ─────────────────────────────────────────────────────────────────

interface KPIFormProps {
  open: boolean;
  onClose: () => void;
  editingKPI?: KPI | null;
  defaultYearId?: string;
  userOrgNodeIds: string[];
}

function KPIForm({
  open,
  onClose,
  editingKPI,
  defaultYearId,
  userOrgNodeIds,
}: KPIFormProps) {
  const { data: kpiYears } = useListKPIYears();
  const { data: bscAspects } = useListBSCAspects();
  const { data: allObjectives } = useListStrategicObjectives();
  const { data: orgNodes } = useListOrganizationNodes();
  const createKPI = useCreateKPI();
  const updateKPI = useUpdateKPI();

  const openYears = useMemo(
    () => (kpiYears ?? []).filter((y) => y.status === Variant_Open_Closed.Open),
    [kpiYears],
  );

  const userOrgNodes = useMemo(
    () => (orgNodes ?? []).filter((n) => userOrgNodeIds.includes(n.nodeId)),
    [orgNodes, userOrgNodeIds],
  );

  // Form state
  const [kpiYearId, setKpiYearId] = useState(
    editingKPI?.kpiYearId ?? defaultYearId ?? "",
  );
  const [orgNodeId, setOrgNodeId] = useState(
    editingKPI?.organizationNodeId ?? userOrgNodes[0]?.nodeId ?? "",
  );
  const [bscAspectId, setBscAspectId] = useState(editingKPI?.bscAspectId ?? "");
  const [strategicObjectiveId, setStrategicObjectiveId] = useState(
    editingKPI?.strategicObjectiveId ?? "",
  );
  const [kpiMeasurement, setKpiMeasurement] = useState(
    editingKPI?.kpiMeasurement ?? "",
  );
  const [kpiPeriod, setKpiPeriod] = useState<string>(
    editingKPI?.kpiPeriod ?? "Monthly",
  );
  const [kpiWeight, setKpiWeight] = useState<string>(
    editingKPI ? String(editingKPI.kpiWeight) : "",
  );
  const [targets, setTargets] = useState<string[]>(
    Array(
      getPeriodCount(
        kpiPeriod as Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual,
      ),
    ).fill(""),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filtered objectives by selected aspect
  const filteredObjectives = useMemo(
    () =>
      (allObjectives ?? []).filter(
        (o) => !bscAspectId || o.bscAspectId === bscAspectId,
      ),
    [allObjectives, bscAspectId],
  );

  // Reset targets when period changes
  const handlePeriodChange = (period: string) => {
    setKpiPeriod(period);
    const count = getPeriodCount(
      period as Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual,
    );
    setTargets(Array(count).fill(""));
  };

  const handleAspectChange = (id: string) => {
    setBscAspectId(id);
    setStrategicObjectiveId("");
  };

  const handleTargetChange = (index: number, value: string) => {
    setTargets((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const periodLabels = getPeriodLabels(
    kpiPeriod as Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual,
  );
  const numericTargets = targets.map((t) => Number.parseFloat(t));
  const yearlyTarget = calculateYearlyTarget(numericTargets, kpiPeriod);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!kpiYearId) errs.kpiYearId = "KPI Year is required";
    if (!orgNodeId) errs.orgNodeId = "Organization node is required";
    if (!bscAspectId) errs.bscAspectId = "BSC Aspect is required";
    if (!strategicObjectiveId)
      errs.strategicObjectiveId = "Strategic Objective is required";
    if (!kpiMeasurement.trim()) errs.kpiMeasurement = "Measurement is required";
    if (
      !kpiWeight ||
      Number.isNaN(Number.parseFloat(kpiWeight)) ||
      Number.parseFloat(kpiWeight) <= 0
    ) {
      errs.kpiWeight = "Enter a valid positive weight";
    }
    const allFilled = targets.every(
      (t) => t.trim() !== "" && !Number.isNaN(Number.parseFloat(t)),
    );
    if (!allFilled) errs.targets = "All target fields are required";
    const anyNegative = numericTargets.some((t) => !Number.isNaN(t) && t < 0);
    if (anyNegative) errs.targets = "Target values cannot be negative";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    try {
      if (editingKPI) {
        await updateKPI.mutateAsync({
          kpiId: editingKPI.kpiId,
          bscAspectId,
          strategicObjectiveId,
          kpiMeasurement: kpiMeasurement.trim(),
          kpiPeriod,
          kpiWeight: Number.parseFloat(kpiWeight),
        });
        toast.success("KPI updated");
      } else {
        await createKPI.mutateAsync({
          kpiYearId,
          bscAspectId,
          strategicObjectiveId,
          organizationNodeId: orgNodeId,
          kpiMeasurement: kpiMeasurement.trim(),
          kpiPeriod,
          kpiWeight: Number.parseFloat(kpiWeight),
        });
        toast.success("KPI saved as draft");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save KPI");
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const isPending = createKPI.isPending || updateKPI.isPending;

  const isAggregation =
    kpiPeriod !== "OneTime"
      ? kpiPeriod === "Annual"
        ? "Sum"
        : "Average"
      : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.94 0.012 252)" }}
            >
              <ClipboardList
                className="w-5 h-5"
                style={{ color: "oklch(0.38 0.065 258)" }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                {editingKPI ? "Edit KPI" : "Propose KPI"}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {editingKPI
                  ? "Update your KPI details. It will remain as draft until batch submission."
                  : "Define a new KPI. Save as draft — submit all KPIs together when ready."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Row 1: KPI Year + Org Node */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="kpi-year-select" className="text-sm font-medium">
                KPI Year <span className="text-destructive">*</span>
                {editingKPI && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    (locked)
                  </span>
                )}
              </Label>
              <Select
                value={kpiYearId}
                onValueChange={setKpiYearId}
                disabled={!!editingKPI}
              >
                <SelectTrigger id="kpi-year-select">
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
              {errors.kpiYearId && (
                <p className="text-xs text-destructive">{errors.kpiYearId}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="org-node-select" className="text-sm font-medium">
                Organization Node <span className="text-destructive">*</span>
                {editingKPI && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    (locked)
                  </span>
                )}
              </Label>
              <Select
                value={orgNodeId}
                onValueChange={setOrgNodeId}
                disabled={!!editingKPI}
              >
                <SelectTrigger id="org-node-select">
                  <SelectValue placeholder="Select node…" />
                </SelectTrigger>
                <SelectContent>
                  {userOrgNodes.map((n) => (
                    <SelectItem key={n.nodeId} value={n.nodeId}>
                      {n.nodeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.orgNodeId && (
                <p className="text-xs text-destructive">{errors.orgNodeId}</p>
              )}
            </div>
          </div>

          {/* Row 2: BSC Aspect + Strategic Objective */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="bsc-aspect-select"
                className="text-sm font-medium"
              >
                BSC Aspect <span className="text-destructive">*</span>
              </Label>
              <Select value={bscAspectId} onValueChange={handleAspectChange}>
                <SelectTrigger id="bsc-aspect-select">
                  <SelectValue placeholder="Select aspect…" />
                </SelectTrigger>
                <SelectContent>
                  {(bscAspects ?? []).map((a) => (
                    <SelectItem key={a.aspectId} value={a.aspectId}>
                      {a.aspectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bscAspectId && (
                <p className="text-xs text-destructive">{errors.bscAspectId}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="strategic-obj-select"
                className="text-sm font-medium"
              >
                Strategic Objective <span className="text-destructive">*</span>
              </Label>
              <Select
                value={strategicObjectiveId}
                onValueChange={setStrategicObjectiveId}
                disabled={!bscAspectId}
              >
                <SelectTrigger id="strategic-obj-select">
                  <SelectValue
                    placeholder={
                      bscAspectId ? "Select objective…" : "Select aspect first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredObjectives.map((o) => (
                    <SelectItem key={o.objectiveId} value={o.objectiveId}>
                      {o.objectiveName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.strategicObjectiveId && (
                <p className="text-xs text-destructive">
                  {errors.strategicObjectiveId}
                </p>
              )}
            </div>
          </div>

          {/* KPI Measurement */}
          <div className="space-y-1.5">
            <Label
              htmlFor="kpi-measurement-input"
              className="text-sm font-medium"
            >
              KPI Measurement <span className="text-destructive">*</span>
            </Label>
            <Input
              id="kpi-measurement-input"
              type="text"
              placeholder="e.g. Revenue Growth %, Customer Satisfaction Score"
              value={kpiMeasurement}
              onChange={(e) => setKpiMeasurement(e.target.value)}
            />
            {errors.kpiMeasurement && (
              <p className="text-xs text-destructive">
                {errors.kpiMeasurement}
              </p>
            )}
          </div>

          {/* Row 3: Period Type + KPI Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="period-type-select"
                className="text-sm font-medium"
              >
                Period Type <span className="text-destructive">*</span>
              </Label>
              <Select value={kpiPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger id="period-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="kpi-weight-input" className="text-sm font-medium">
                KPI Weight (%) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="kpi-weight-input"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="e.g. 20"
                value={kpiWeight}
                onChange={(e) => setKpiWeight(e.target.value)}
              />
              {errors.kpiWeight && (
                <p className="text-xs text-destructive">{errors.kpiWeight}</p>
              )}
            </div>
          </div>

          {/* Target Setup */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Target Setup <span className="text-destructive">*</span>
              </Label>
              {isAggregation && yearlyTarget !== null && (
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{
                    background: "oklch(0.94 0.012 252)",
                    color: "oklch(0.38 0.065 258)",
                  }}
                >
                  Year {isAggregation}: {yearlyTarget.toFixed(2)}
                </span>
              )}
            </div>

            <div
              className="rounded-xl border border-border p-4 space-y-3"
              style={{ background: "oklch(0.98 0.004 252)" }}
            >
              {kpiPeriod === "OneTime" ? (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="target-0"
                    className="text-xs text-muted-foreground"
                  >
                    Year Target
                  </Label>
                  <Input
                    id="target-0"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={targets[0] ?? ""}
                    onChange={(e) => handleTargetChange(0, e.target.value)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {periodLabels.map((label, i) => (
                    <div key={label} className="space-y-1">
                      <Label
                        htmlFor={`target-${String(i)}`}
                        className="text-xs text-muted-foreground"
                      >
                        {label}
                      </Label>
                      <Input
                        id={`target-${String(i)}`}
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0.00"
                        value={targets[i] ?? ""}
                        onChange={(e) => handleTargetChange(i, e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Aggregation summary */}
              {kpiPeriod !== "OneTime" && yearlyTarget !== null && (
                <div
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: "oklch(0.93 0.012 252)",
                    color: "oklch(0.38 0.065 258)",
                  }}
                >
                  <span className="font-medium">
                    Year {kpiPeriod === "Annual" ? "Total (Sum)" : "Average"}
                  </span>
                  <span className="font-bold font-mono">
                    {yearlyTarget.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            {errors.targets && (
              <p className="text-xs text-destructive">{errors.targets}</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSaveDraft()}
            disabled={isPending}
            className="flex-1 gap-2"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ClipboardList className="w-4 h-4" />
            )}
            {isPending ? "Saving…" : editingKPI ? "Update KPI" : "Save Draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Progress Update Panel ────────────────────────────────────────────────────

interface ProgressPanelProps {
  kpi: KPI;
  aspectName: string;
  onClose: () => void;
}

function ProgressPanel({ kpi, aspectName, onClose }: ProgressPanelProps) {
  const updateProgress = useUpdateKPIProgress();
  const count = getPeriodCount(kpi.kpiPeriod);
  const labels = getPeriodLabels(kpi.kpiPeriod);

  const [achievements, setAchievements] = useState<string[]>(
    Array(count).fill(""),
  );
  const [saving, setSaving] = useState<number | null>(null);

  const handleSavePeriod = async (index: number) => {
    const val = Number.parseFloat(achievements[index] ?? "");
    if (Number.isNaN(val)) {
      toast.error("Enter a valid number for this period");
      return;
    }
    setSaving(index);
    try {
      await updateProgress.mutateAsync({
        kpiId: kpi.kpiId,
        periodIndex: index + 1,
        achievement: val,
      });
      toast.success(`Period ${labels[index] ?? String(index + 1)} updated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(null);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.92 0.04 145)" }}
            >
              <TrendingUp
                className="w-5 h-5"
                style={{ color: "oklch(0.38 0.12 145)" }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                Update Progress
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {kpi.kpiMeasurement} — {aspectName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {labels.map((label, i) => (
            <div
              key={label}
              className="flex items-center gap-3 p-3 rounded-lg border border-border"
            >
              <span className="text-sm font-medium text-muted-foreground w-10 flex-shrink-0">
                {label}
              </span>
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="Achievement…"
                value={achievements[i] ?? ""}
                onChange={(e) => {
                  setAchievements((prev) => {
                    const next = [...prev];
                    next[i] = e.target.value;
                    return next;
                  });
                }}
                className="flex-1 text-sm"
              />
              <Button
                size="sm"
                onClick={() => void handleSavePeriod(i)}
                disabled={saving === i || !achievements[i]?.trim()}
                className="flex-shrink-0 gap-1.5 text-xs h-8"
              >
                {saving === i ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── View Only Panel ──────────────────────────────────────────────────────────

interface ViewPanelProps {
  kpi: KPI;
  aspectName: string;
  objectiveName: string;
  onClose: () => void;
}

function ViewPanel({
  kpi,
  aspectName,
  objectiveName,
  onClose,
}: ViewPanelProps) {
  const status =
    STATUS_CONFIG[kpi.kpiStatus as Variant_Approved_Draft_Submitted_Revised] ??
    STATUS_CONFIG[Variant_Approved_Draft_Submitted_Revised.Draft];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.94 0.012 252)" }}
            >
              <Eye
                className="w-5 h-5"
                style={{ color: "oklch(0.38 0.065 258)" }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                KPI Details
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Read-only view — submitted KPIs cannot be edited
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {[
            { label: "Measurement", value: kpi.kpiMeasurement },
            { label: "BSC Aspect", value: aspectName },
            { label: "Strategic Objective", value: objectiveName },
            {
              label: "Period",
              value: PERIOD_LABELS[kpi.kpiPeriod] ?? kpi.kpiPeriod,
            },
            { label: "Weight", value: `${kpi.kpiWeight}%` },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0"
            >
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium text-foreground text-right">
                {value}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Status</span>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: status.bg, color: status.color }}
            >
              {status.label}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Submission Confirmation Dialog ──────────────────────────────────────────

interface SubmitConfirmDialogProps {
  open: boolean;
  yearLabel: string;
  kpiCount: number;
  totalWeight: number;
  weightByNode: Map<string, number>;
  orgNodeMap: Map<string, string>;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function SubmitConfirmDialog({
  open,
  yearLabel,
  kpiCount,
  totalWeight,
  weightByNode,
  orgNodeMap,
  onConfirm,
  onCancel,
  isSubmitting,
}: SubmitConfirmDialogProps) {
  const nodeEntries = Array.from(weightByNode.entries());
  const isMultiNode = nodeEntries.length > 1;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.92 0.04 250)" }}
            >
              <Send
                className="w-5 h-5"
                style={{ color: "oklch(0.38 0.14 250)" }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                Submit All KPIs
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                This action cannot be undone without admin revision
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div
          className="rounded-xl p-4 space-y-2 text-sm"
          style={{ background: "oklch(0.97 0.008 252)" }}
        >
          <p className="text-foreground leading-relaxed">
            You are about to submit all KPIs for year{" "}
            <strong>{yearLabel}</strong>.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-muted-foreground">KPI Count</span>
            <span className="font-semibold">{kpiCount}</span>
          </div>
          {isMultiNode ? (
            <>
              <div className="pt-1 pb-0.5">
                <span className="text-xs text-muted-foreground font-medium">
                  Weight per role:
                </span>
              </div>
              {nodeEntries.map(([nodeId, w]) => (
                <div
                  key={nodeId}
                  className="flex items-center justify-between pl-2"
                >
                  <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                    {orgNodeMap.get(nodeId) ?? nodeId}
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "oklch(0.38 0.12 145)" }}
                  >
                    {w.toFixed(1)}%
                  </span>
                </div>
              ))}
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Weight</span>
              <span
                className="font-semibold"
                style={{ color: "oklch(0.38 0.12 145)" }}
              >
                {totalWeight.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          After submission, KPIs cannot be edited unless rejected by an
          approver.
        </p>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 gap-2"
            style={{ background: "oklch(0.38 0.14 250)", color: "white" }}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isSubmitting ? "Submitting…" : "Confirm Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

interface DeleteKPIConfirmDialogProps {
  open: boolean;
  kpi: KPI | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

function DeleteKPIConfirmDialog({
  open,
  kpi,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteKPIConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.95 0.04 27)" }}
            >
              <Trash2
                className="w-5 h-5"
                style={{ color: "oklch(0.42 0.18 27)" }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                Delete KPI
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div
          className="rounded-xl p-4 text-sm"
          style={{ background: "oklch(0.97 0.008 252)" }}
        >
          <p className="text-foreground leading-relaxed">
            Are you sure you want to delete:{" "}
            <strong className="break-words">
              {kpi?.kpiMeasurement ?? "this KPI"}
            </strong>
            ?
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            This KPI will be permanently removed and cannot be recovered.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 gap-2"
            style={{ background: "oklch(0.42 0.18 27)", color: "white" }}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {isDeleting ? "Deleting…" : "Delete KPI"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── KPI Table Row ────────────────────────────────────────────────────────────

interface KPIRowProps {
  kpi: KPI;
  aspectName: string;
  objectiveName: string;
  orgNodeName: string;
  onEdit: (kpi: KPI) => void;
  onView: (kpi: KPI) => void;
  onProgress: (kpi: KPI) => void;
  onDelete: (kpi: KPI) => void;
  delay: number;
}

function KPIRow({
  kpi,
  aspectName,
  objectiveName,
  orgNodeName,
  onEdit,
  onView,
  onProgress,
  onDelete,
  delay,
}: KPIRowProps) {
  const status =
    STATUS_CONFIG[kpi.kpiStatus as Variant_Approved_Draft_Submitted_Revised] ??
    STATUS_CONFIG[Variant_Approved_Draft_Submitted_Revised.Draft];

  const isDraftOrRevised =
    kpi.kpiStatus === Variant_Approved_Draft_Submitted_Revised.Draft ||
    kpi.kpiStatus === Variant_Approved_Draft_Submitted_Revised.Revised;

  const isSubmitted =
    kpi.kpiStatus === Variant_Approved_Draft_Submitted_Revised.Submitted;

  const isApproved =
    kpi.kpiStatus === Variant_Approved_Draft_Submitted_Revised.Approved;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay, ease: "easeOut" }}
      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
    >
      <TableCell>
        <span className="text-xs font-medium">{aspectName}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-foreground truncate max-w-[180px] block">
          {objectiveName}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-foreground truncate max-w-[180px] block">
          {kpi.kpiMeasurement}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {PERIOD_LABELS[kpi.kpiPeriod] ?? kpi.kpiPeriod}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm font-mono font-semibold text-foreground">
          {kpi.kpiWeight}%
        </span>
      </TableCell>
      <TableCell>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
          style={{ background: status.bg, color: status.color }}
        >
          {status.label}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          {isDraftOrRevised && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(kpi)}
                className="gap-1.5 text-xs h-8"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(kpi)}
                className="gap-1.5 text-xs h-8 border-destructive/50 hover:bg-destructive/10"
                style={{ color: "oklch(0.42 0.18 27)" }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
          {isSubmitted && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView(kpi)}
              className="gap-1.5 text-xs h-8"
            >
              <Eye className="w-3.5 h-3.5" />
              View
            </Button>
          )}
          {isApproved && (
            <Button
              size="sm"
              onClick={() => onProgress(kpi)}
              className="gap-1.5 text-xs h-8"
              style={{ background: "oklch(0.38 0.12 145)", color: "white" }}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Progress
            </Button>
          )}
          {!isDraftOrRevised && !isSubmitted && !isApproved && (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground truncate max-w-[120px] block">
          {orgNodeName}
        </span>
      </TableCell>
    </motion.tr>
  );
}

// ─── Skeleton Rows ────────────────────────────────────────────────────────────

const SK_IDS = ["sk1", "sk2", "sk3", "sk4", "sk5"];
const SK_COL_WIDTHS = [
  "w-16",
  "w-28",
  "w-32",
  "w-16",
  "w-12",
  "w-20",
  "w-20",
  "w-20",
];

function SkeletonRows() {
  return (
    <>
      {SK_IDS.map((id) => (
        <TableRow key={id}>
          {SK_COL_WIDTHS.map((w) => (
            <TableCell key={w + id}>
              <Skeleton className={`h-5 rounded ${w}`} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
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
        No KPIs yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        Start by proposing your first KPI. All KPIs are saved as drafts until
        you submit the full batch.
      </p>
      <Button onClick={onAdd} className="gap-2">
        <Plus className="w-4 h-4" />
        Propose KPI
      </Button>
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  selectedYear: string;
  onYearChange: (v: string) => void;
  selectedStatus: string;
  onStatusChange: (v: string) => void;
  selectedAspect: string;
  onAspectChange: (v: string) => void;
  selectedObjective: string;
  onObjectiveChange: (v: string) => void;
}

function FilterBar({
  selectedYear,
  onYearChange,
  selectedStatus,
  onStatusChange,
  selectedAspect,
  onAspectChange,
  selectedObjective,
  onObjectiveChange,
}: FilterBarProps) {
  const { data: kpiYears } = useListKPIYears();
  const { data: bscAspects } = useListBSCAspects();
  const { data: allObjectives } = useListStrategicObjectives();

  const filteredObjectives = useMemo(
    () =>
      (allObjectives ?? []).filter(
        (o) => !selectedAspect || o.bscAspectId === selectedAspect,
      ),
    [allObjectives, selectedAspect],
  );

  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl border border-border"
      style={{ background: "oklch(0.99 0.004 252)" }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 ml-auto" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-auto" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 pb-4">
              {/* Year */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  KPI Year
                </Label>
                <Select value={selectedYear} onValueChange={onYearChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All years</SelectItem>
                    {(kpiYears ?? []).map((y) => (
                      <SelectItem key={y.kpiYearId} value={y.kpiYearId}>
                        {String(y.year)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={selectedStatus} onValueChange={onStatusChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SUBMITTED">Submitted</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REVISED">Revised</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* BSC Aspect */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  BSC Aspect
                </Label>
                <Select
                  value={selectedAspect}
                  onValueChange={(v) => {
                    onAspectChange(v);
                    onObjectiveChange("all");
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All aspects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All aspects</SelectItem>
                    {(bscAspects ?? []).map((a) => (
                      <SelectItem key={a.aspectId} value={a.aspectId}>
                        {a.aspectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Strategic Objective */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Strategic Objective
                </Label>
                <Select
                  value={selectedObjective}
                  onValueChange={onObjectiveChange}
                  disabled={filteredObjectives.length === 0}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All objectives" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All objectives</SelectItem>
                    {filteredObjectives.map((o) => (
                      <SelectItem key={o.objectiveId} value={o.objectiveId}>
                        {o.objectiveName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkspaceKPIProposal() {
  const { data: profile } = useMyProfile();
  const { data: kpiYears } = useListKPIYears();
  const { data: bscAspects } = useListBSCAspects();
  const { data: allObjectives } = useListStrategicObjectives();
  const { data: orgNodes } = useListOrganizationNodes();
  const submitKPI = useSubmitKPI();
  const deleteKPI = useDeleteKPI();

  // Derive user's active org node IDs from their role assignments
  const userOrgNodeIds = useMemo(() => {
    if (!profile?.roles) return [];
    return profile.roles
      .filter((r) => r.activeStatus && r.orgNodeId)
      .map((r) => r.orgNodeId!)
      .filter(Boolean);
  }, [profile]);

  // Set of current user's active role assignment IDs (for ownership filtering)
  const myAssignmentIds = useMemo(() => {
    return new Set(
      (profile?.roles ?? [])
        .filter((r) => r.activeStatus)
        .map((r) => r.assignmentId),
    );
  }, [profile]);

  // Filters
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedAspect, setSelectedAspect] = useState("all");
  const [selectedObjective, setSelectedObjective] = useState("all");

  const { data: kpis, isLoading: kpisLoading } = useListKPIs(
    selectedYear !== "all" ? selectedYear : undefined,
  );

  // Show ONLY current user's own KPIs — filter by ownerRoleAssignmentId
  // so a user never sees KPIs belonging to other users in their proposal view.
  const myKPIs = useMemo(() => {
    if (myAssignmentIds.size === 0) return [];
    return (kpis ?? []).filter((k) =>
      myAssignmentIds.has(k.ownerRoleAssignmentId),
    );
  }, [kpis, myAssignmentIds]);

  // Client-side filtering for status/aspect/objective
  const filteredKPIs = useMemo(() => {
    return myKPIs.filter((k) => {
      if (
        selectedStatus !== "all" &&
        k.kpiStatus.toUpperCase() !== selectedStatus
      )
        return false;
      if (selectedAspect !== "all" && k.bscAspectId !== selectedAspect)
        return false;
      if (
        selectedObjective !== "all" &&
        k.strategicObjectiveId !== selectedObjective
      )
        return false;
      return true;
    });
  }, [myKPIs, selectedStatus, selectedAspect, selectedObjective]);

  // Helpers for display
  const aspectMap = useMemo(
    () => new Map((bscAspects ?? []).map((a) => [a.aspectId, a.aspectName])),
    [bscAspects],
  );
  const objectiveMap = useMemo(
    () =>
      new Map(
        (allObjectives ?? []).map((o) => [o.objectiveId, o.objectiveName]),
      ),
    [allObjectives],
  );
  const orgNodeMap = useMemo(
    () => new Map((orgNodes ?? []).map((n) => [n.nodeId, n.nodeName])),
    [orgNodes],
  );

  // Fix 2: Group myKPIs by organizationNodeId and sum weight per node
  const weightByNode = useMemo(() => {
    const map = new Map<string, number>();
    for (const k of myKPIs) {
      map.set(
        k.organizationNodeId,
        (map.get(k.organizationNodeId) ?? 0) + k.kpiWeight,
      );
    }
    return map;
  }, [myKPIs]);

  // For display purposes: global weight (still useful for single-node case)
  const totalWeight = useMemo(() => {
    return Array.from(weightByNode.values()).reduce((sum, w) => sum + w, 0);
  }, [weightByNode]);

  const kpiCount = myKPIs.length;

  // Submission readiness
  const openYears = useMemo(
    () => (kpiYears ?? []).filter((y) => y.status === Variant_Open_Closed.Open),
    [kpiYears],
  );
  const selectedOpenYear = useMemo(
    () =>
      selectedYear !== "all"
        ? openYears.find((y) => y.kpiYearId === selectedYear)
        : undefined,
    [selectedYear, openYears],
  );
  const allDraftOrRevised =
    kpiCount > 0 &&
    myKPIs.every(
      (k) =>
        k.kpiStatus === Variant_Approved_Draft_Submitted_Revised.Draft ||
        k.kpiStatus === Variant_Approved_Draft_Submitted_Revised.Revised,
    );
  // Fix 2: every node group must have exactly 100% weight
  const weightExact =
    weightByNode.size > 0 &&
    Array.from(weightByNode.values()).every((w) => Math.abs(w - 100) < 0.01);
  const canSubmit =
    allDraftOrRevised && !!selectedOpenYear && weightExact && kpiCount > 0;

  // Form / dialog state
  const [showForm, setShowForm] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPI | null>(null);
  const [viewingKPI, setViewingKPI] = useState<KPI | null>(null);
  const [progressKPI, setProgressKPI] = useState<KPI | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KPI | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBatchSubmit = async () => {
    if (myKPIs.length === 0) return;
    setIsSubmitting(true);
    try {
      // Submit all draft/revised KPIs (own KPIs only) sequentially
      const toSubmit = myKPIs.filter(
        (k) =>
          k.kpiStatus === Variant_Approved_Draft_Submitted_Revised.Draft ||
          k.kpiStatus === Variant_Approved_Draft_Submitted_Revised.Revised,
      );
      for (const kpi of toSubmit) {
        await submitKPI.mutateAsync(kpi.kpiId);
      }
      toast.success(
        `${toSubmit.length} KPI${toSubmit.length !== 1 ? "s" : ""} submitted successfully`,
      );
      setShowSubmitConfirm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteKPI.mutateAsync(deleteTarget.kpiId);
      toast.success("KPI deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedYearLabel = useMemo(() => {
    if (selectedYear === "all") return "—";
    const y = (kpiYears ?? []).find((y) => y.kpiYearId === selectedYear);
    return y ? String(y.year) : "—";
  }, [selectedYear, kpiYears]);

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
              <ClipboardList
                className="w-5 h-5"
                style={{ color: "oklch(0.82 0.14 72)" }}
              />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground leading-tight">
                KPI Proposal
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Draft and batch-submit your KPIs for the performance year
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => {
                setEditingKPI(null);
                setShowForm(true);
              }}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Propose KPI
            </Button>

            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      onClick={() => setShowSubmitConfirm(true)}
                      disabled={!canSubmit}
                      className="gap-2"
                      style={
                        canSubmit
                          ? {
                              background: "oklch(0.38 0.14 250)",
                              color: "white",
                            }
                          : undefined
                      }
                    >
                      <Send className="w-4 h-4" />
                      Submit All KPIs for Year
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canSubmit && (
                  <TooltipContent side="bottom" className="max-w-xs text-xs">
                    {kpiCount === 0
                      ? "No KPIs to submit"
                      : !selectedOpenYear
                        ? "Select an open KPI Year from filters"
                        : !allDraftOrRevised
                          ? "All KPIs must be in Draft or Revised status"
                          : weightByNode.size > 1
                            ? "Each organization role must have exactly 100% weight"
                            : `Total weight must equal exactly 100% (current: ${totalWeight.toFixed(1)}%)`}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-8 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total KPIs"
            value={kpiCount}
            icon={<ClipboardList className="w-5 h-5" />}
          />
          <StatCard
            label={
              weightByNode.size > 1
                ? "Total Weight (All Roles)"
                : "Total Weight"
            }
            value={
              <span
                style={{
                  color: weightExact
                    ? "oklch(0.38 0.12 145)"
                    : kpiCount === 0
                      ? undefined
                      : "oklch(0.50 0.18 27)",
                }}
              >
                {totalWeight.toFixed(1)}%
              </span>
            }
            icon={<BarChart2 className="w-5 h-5" />}
            highlight={weightExact && kpiCount > 0}
          />
          <StatCard
            label="Submission Readiness"
            value={
              kpiCount === 0 ? (
                <span className="text-muted-foreground text-base">—</span>
              ) : canSubmit ? (
                <CheckCircle2
                  className="w-6 h-6"
                  style={{ color: "oklch(0.38 0.12 145)" }}
                />
              ) : (
                <XCircle
                  className="w-6 h-6"
                  style={{ color: "oklch(0.50 0.18 27)" }}
                />
              )
            }
            icon={<Send className="w-5 h-5" />}
          />
        </div>

        {/* Weight Banner — per node breakdown */}
        <WeightIndicator
          weightByNode={weightByNode}
          orgNodeMap={orgNodeMap}
          kpiCount={kpiCount}
        />

        {/* Filters */}
        <FilterBar
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedAspect={selectedAspect}
          onAspectChange={setSelectedAspect}
          selectedObjective={selectedObjective}
          onObjectiveChange={setSelectedObjective}
        />

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm text-foreground">
                KPI List
              </span>
              {!kpisLoading && filteredKPIs.length > 0 && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: "oklch(0.93 0.012 252)",
                    color: "oklch(0.42 0.055 258)",
                  }}
                >
                  {filteredKPIs.length}
                </span>
              )}
            </div>
          </div>

          {kpisLoading ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {[
                    "BSC Aspect",
                    "Strategic Objective",
                    "Measurement",
                    "Period",
                    "Weight",
                    "Status",
                    "Actions",
                    "Org Node",
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <SkeletonRows />
              </TableBody>
            </Table>
          ) : filteredKPIs.length === 0 ? (
            <EmptyState
              onAdd={() => {
                setEditingKPI(null);
                setShowForm(true);
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {[
                    "BSC Aspect",
                    "Strategic Objective",
                    "Measurement",
                    "Period",
                    "Weight",
                    "Status",
                    "Actions",
                    "Org Node",
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {filteredKPIs.map((kpi, i) => (
                    <KPIRow
                      key={kpi.kpiId}
                      kpi={kpi}
                      aspectName={
                        aspectMap.get(kpi.bscAspectId) ?? kpi.bscAspectId
                      }
                      objectiveName={
                        objectiveMap.get(kpi.strategicObjectiveId) ??
                        kpi.strategicObjectiveId
                      }
                      orgNodeName={
                        orgNodeMap.get(kpi.organizationNodeId) ??
                        kpi.organizationNodeId
                      }
                      onEdit={(k) => {
                        setEditingKPI(k);
                        setShowForm(true);
                      }}
                      onView={setViewingKPI}
                      onProgress={setProgressKPI}
                      onDelete={setDeleteTarget}
                      delay={i * 0.04}
                    />
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* KPI Form Dialog */}
      {showForm && (
        <KPIForm
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingKPI(null);
          }}
          editingKPI={editingKPI}
          defaultYearId={selectedYear !== "all" ? selectedYear : undefined}
          userOrgNodeIds={userOrgNodeIds}
        />
      )}

      {/* Progress Panel */}
      {progressKPI && (
        <ProgressPanel
          kpi={progressKPI}
          aspectName={aspectMap.get(progressKPI.bscAspectId) ?? ""}
          onClose={() => setProgressKPI(null)}
        />
      )}

      {/* View Panel */}
      {viewingKPI && (
        <ViewPanel
          kpi={viewingKPI}
          aspectName={aspectMap.get(viewingKPI.bscAspectId) ?? ""}
          objectiveName={
            objectiveMap.get(viewingKPI.strategicObjectiveId) ?? ""
          }
          onClose={() => setViewingKPI(null)}
        />
      )}

      {/* Submit Confirmation */}
      <SubmitConfirmDialog
        open={showSubmitConfirm}
        yearLabel={selectedYearLabel}
        kpiCount={kpiCount}
        totalWeight={totalWeight}
        weightByNode={weightByNode}
        orgNodeMap={orgNodeMap}
        onConfirm={() => void handleBatchSubmit()}
        onCancel={() => setShowSubmitConfirm(false)}
        isSubmitting={isSubmitting}
      />

      {/* Delete KPI Confirmation */}
      <DeleteKPIConfirmDialog
        open={!!deleteTarget}
        kpi={deleteTarget}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </motion.div>
  );
}
