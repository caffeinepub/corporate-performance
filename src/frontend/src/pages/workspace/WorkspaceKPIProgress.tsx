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
import {
  useGetKPIProgressData,
  useGetKPIScoreParameter,
  useListBSCAspects,
  useListKPIYears,
  useListKPIs,
  useListOrganizationNodes,
  useMyProfile,
  useUpdateKPIProgress,
} from "@/hooks/useQueries";
import type { KPIProgressRecord, KPITargetRecord } from "@/hooks/useQueries";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  Loader2,
  Pencil,
  Save,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { KPI } from "../../backend.d";
import {
  Variant_Approved_Draft_Submitted_Revised,
  Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual,
  Variant_Open_Closed,
} from "../../backend.d";

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_TYPE_LABELS: Record<string, string> = {
  OneTime: "One-time",
  Annual: "Annual (Sum)",
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

// ─── Calculation helpers ──────────────────────────────────────────────────────

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

/**
 * Calculates kpiYearlyAchievement (0–5) from progress scores.
 * - OneTime: single score value
 * - Annual: average of entered scores (same as monthly per spec)
 * - Monthly: average of entered scores
 * - Quarterly: average of 4 quarter scores
 * - SemiAnnual: average of 2 half-year scores
 */
function calcYearlyAchievement(
  period: Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual,
  progressRecords: KPIProgressRecord[],
): number {
  if (progressRecords.length === 0) return 0;
  const scores = progressRecords.map((p) => p.score);
  switch (period) {
    case Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual.OneTime:
      return scores[0] ?? 0;
    case Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual.Annual:
    case Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual.Monthly:
    case Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual.Quarterly:
    case Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual.SemiAnnual:
      return scores.reduce((a, b) => a + b, 0) / scores.length;
    default:
      return 0;
  }
}

function calcFinalScore(yearlyAchievement: number, kpiWeight: number): number {
  return yearlyAchievement * (kpiWeight / 100);
}

// ─── SVG Gauge Chart ──────────────────────────────────────────────────────────

interface GaugeChartProps {
  value: number; // 0–5
  label: string;
  size?: number;
}

function GaugeChart({ value, label, size = 110 }: GaugeChartProps) {
  const clampedValue = Math.max(0, Math.min(5, value));
  const sweepAngle = 240; // degrees
  const startAngle = 150; // degrees from east (0°)
  const cx = size / 2;
  const cy = size * 0.52;
  const r = size * 0.38;
  const strokeWidth = size * 0.095;

  // Convert angle (degrees from east) to SVG arc coords
  function polarToCart(angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  // Arc path helper
  function describeArc(startDeg: number, endDeg: number) {
    const start = polarToCart(startDeg);
    const end = polarToCart(endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  const endAngle = startAngle + sweepAngle;
  const filledAngle = startAngle + (clampedValue / 5) * sweepAngle;

  // Color based on value
  const arcColor =
    clampedValue >= 4
      ? "oklch(0.62 0.18 145)" // green
      : clampedValue >= 2.5
        ? "oklch(0.72 0.18 72)" // amber
        : clampedValue > 0
          ? "oklch(0.62 0.18 30)" // red-orange
          : "oklch(0.80 0.01 252)"; // gray (no progress)

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        role="img"
        aria-label={`${label}: ${clampedValue.toFixed(1)} out of 5`}
        width={size}
        height={size * 0.82}
        viewBox={`0 0 ${size} ${size * 0.82}`}
      >
        {/* Background track */}
        <path
          d={describeArc(startAngle, endAngle)}
          fill="none"
          stroke="oklch(0.88 0.018 252)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Filled track */}
        {clampedValue > 0 && (
          <path
            d={describeArc(startAngle, filledAngle)}
            fill="none"
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
        {/* Value text */}
        <text
          x={cx}
          y={cy + 5}
          textAnchor="middle"
          fontSize={size * 0.2}
          fontWeight="700"
          fill="var(--foreground)"
          fontFamily="inherit"
        >
          {clampedValue.toFixed(1)}
        </text>
        {/* Scale markers */}
        <text
          x={polarToCart(startAngle).x - 2}
          y={polarToCart(startAngle).y + 3}
          textAnchor="middle"
          fontSize={size * 0.09}
          fill="var(--muted-foreground)"
        >
          0
        </text>
        <text
          x={polarToCart(endAngle).x + 2}
          y={polarToCart(endAngle).y + 3}
          textAnchor="middle"
          fontSize={size * 0.09}
          fill="var(--muted-foreground)"
        >
          5
        </text>
      </svg>
      <p
        className="text-xs text-center text-muted-foreground leading-tight px-1 max-w-[100px] truncate"
        title={label}
      >
        {label}
      </p>
    </div>
  );
}

// ─── BSC Dashboard Section ────────────────────────────────────────────────────

interface KPIWithAchievement extends KPI {
  yearlyAchievement: number;
  finalScore: number;
}

interface BSCDashboardProps {
  kpisWithAchievement: KPIWithAchievement[];
  aspectMap: Map<string, string>;
  totalFinalScore: number;
  nodeName: string;
}

function BSCDashboard({
  kpisWithAchievement,
  aspectMap,
  totalFinalScore,
  nodeName,
}: BSCDashboardProps) {
  // Group by BSC aspect for average
  const aspectAvgMap = useMemo(() => {
    const groups = new Map<string, number[]>();
    for (const kpi of kpisWithAchievement) {
      const existing = groups.get(kpi.bscAspectId) ?? [];
      groups.set(kpi.bscAspectId, [...existing, kpi.yearlyAchievement]);
    }
    const avgs = new Map<string, number>();
    for (const [aspectId, scores] of groups.entries()) {
      avgs.set(aspectId, scores.reduce((a, b) => a + b, 0) / scores.length);
    }
    return avgs;
  }, [kpisWithAchievement]);

  const uniqueAspectIds = Array.from(aspectAvgMap.keys());

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border overflow-hidden"
      style={{ background: "oklch(0.13 0.022 258)" }}
    >
      {/* Dashboard header */}
      <div
        className="px-6 py-4 border-b"
        style={{ borderColor: "oklch(0.22 0.028 258)" }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "oklch(0.22 0.042 145)" }}
            >
              <BarChart2
                className="w-4 h-4"
                style={{ color: "oklch(0.72 0.18 145)" }}
              />
            </div>
            <div>
              <h3
                className="font-display font-bold text-sm"
                style={{ color: "oklch(0.96 0.01 252)" }}
              >
                KPI Progress Dashboard
              </h3>
              <p className="text-xs" style={{ color: "oklch(0.60 0.04 258)" }}>
                {nodeName}
              </p>
            </div>
          </div>
          {/* Total Final Score */}
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{
              background: "oklch(0.18 0.032 258)",
              border: "1px solid oklch(0.26 0.04 258)",
            }}
          >
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: "oklch(0.60 0.04 258)" }}
              >
                Total Final Score
              </p>
              <p
                className="font-display font-bold text-xl leading-none mt-0.5"
                style={{
                  color:
                    totalFinalScore >= 3
                      ? "oklch(0.72 0.18 145)"
                      : "oklch(0.80 0.14 72)",
                }}
              >
                {totalFinalScore.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Individual KPI gauges */}
        {kpisWithAchievement.length > 0 && (
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-4"
              style={{ color: "oklch(0.55 0.04 258)" }}
            >
              KPI Yearly Achievement
            </p>
            <div className="flex flex-wrap gap-4 justify-start">
              {kpisWithAchievement.map((kpi) => (
                <div
                  key={kpi.kpiId}
                  className="flex flex-col items-center px-3 py-3 rounded-xl"
                  style={{
                    background: "oklch(0.18 0.028 258)",
                    border: "1px solid oklch(0.24 0.032 258)",
                  }}
                >
                  <GaugeChart
                    value={kpi.yearlyAchievement}
                    label={kpi.kpiMeasurement}
                    size={100}
                  />
                  <div className="mt-2 flex flex-col items-center gap-0.5">
                    <span
                      className="text-xs font-medium"
                      style={{ color: "oklch(0.60 0.04 258)" }}
                    >
                      Weight: {kpi.kpiWeight}%
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "oklch(0.72 0.18 145)" }}
                    >
                      Final: {kpi.finalScore.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BSC Aspect averages */}
        {uniqueAspectIds.length > 0 && (
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-4"
              style={{ color: "oklch(0.55 0.04 258)" }}
            >
              Average by BSC Aspect
            </p>
            <div className="flex flex-wrap gap-4 justify-start">
              {uniqueAspectIds.map((aspectId) => (
                <div
                  key={aspectId}
                  className="flex flex-col items-center px-3 py-3 rounded-xl"
                  style={{
                    background: "oklch(0.18 0.028 258)",
                    border: "1px solid oklch(0.24 0.032 258)",
                  }}
                >
                  <GaugeChart
                    value={aspectAvgMap.get(aspectId) ?? 0}
                    label={aspectMap.get(aspectId) ?? aspectId}
                    size={100}
                  />
                  <span
                    className="text-xs mt-1"
                    style={{ color: "oklch(0.60 0.04 258)" }}
                  >
                    Avg. Achievement
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Period Row ───────────────────────────────────────────────────────────────

interface PeriodRowProps {
  label: string;
  periodIndex: number;
  kpiId: string;
  targetRecord?: KPITargetRecord;
  progressRecord?: KPIProgressRecord;
  index: number;
  /** Called immediately after a successful save so parent can recalculate scores */
  onSaved?: (periodIndex: number, achievement: number, score: number) => void;
}

function PeriodRow({
  label,
  periodIndex,
  kpiId,
  targetRecord,
  progressRecord,
  index,
  onSaved,
}: PeriodRowProps) {
  const updateProgress = useUpdateKPIProgress();

  // If a progress record exists, start in locked state; otherwise start in editing mode
  const hasSavedRecord = progressRecord !== undefined;
  const [isEditing, setIsEditing] = useState(!hasSavedRecord);

  const [achievement, setAchievement] = useState(
    progressRecord?.achievement !== undefined
      ? String(progressRecord.achievement)
      : "",
  );
  const [score, setScore] = useState(
    progressRecord?.score !== undefined ? String(progressRecord.score) : "",
  );
  const [saving, setSaving] = useState(false);

  // Sync local state when the persisted progress record changes (e.g. after query refetch)
  useEffect(() => {
    if (progressRecord !== undefined) {
      setAchievement(String(progressRecord.achievement));
      setScore(String(progressRecord.score));
    }
  }, [progressRecord]);

  const targetValue = targetRecord?.targetValue;
  const lastUpdated = progressRecord?.updatedAt
    ? new Date(
        Number(progressRecord.updatedAt / 1_000_000n),
      ).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const handleSave = async () => {
    const achievementVal = Number.parseFloat(achievement);
    const scoreVal = Number.parseFloat(score);
    if (Number.isNaN(achievementVal)) {
      toast.error("Enter a valid achievement value");
      return;
    }
    if (Number.isNaN(scoreVal) || scoreVal < 0 || scoreVal > 5) {
      toast.error("Score must be a number between 0 and 5");
      return;
    }
    setSaving(true);
    try {
      await updateProgress.mutateAsync({
        kpiId,
        periodIndex,
        achievement: achievementVal,
        score: scoreVal,
      });
      toast.success(`${label} progress saved`);
      setIsEditing(false);
      // Immediately notify parent so score gauges update without waiting for refetch
      onSaved?.(periodIndex, achievementVal, scoreVal);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const isEven = index % 2 === 0;
  const rowBg = isEven ? "oklch(0.97 0.004 252)" : "oklch(0.99 0.002 252)";

  // ── Locked (read-only) view ──────────────────────────────────────────────
  if (!isEditing && hasSavedRecord) {
    return (
      <div
        className="grid items-center gap-2 px-4 py-3 rounded-xl"
        style={{
          gridTemplateColumns: "60px 1fr 1fr 1fr 140px 80px",
          background: rowBg,
        }}
      >
        {/* Period label */}
        <span
          className="text-xs font-bold text-center py-1 rounded-md"
          style={{
            color: "oklch(0.38 0.065 258)",
            background: "oklch(0.93 0.012 252)",
          }}
        >
          {label}
        </span>

        {/* Target (read-only) */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Target</span>
          <span className="text-sm font-semibold text-foreground">
            {targetValue !== undefined ? targetValue.toLocaleString() : "—"}
          </span>
        </div>

        {/* Achievement (read-only) */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Achievement</span>
          <span className="text-sm font-semibold text-foreground">
            {achievement !== "" ? Number(achievement).toLocaleString() : "—"}
          </span>
        </div>

        {/* Score (read-only) */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Score (0–5)</span>
          <span
            className="text-sm font-bold"
            style={{
              color:
                Number(score) >= 4
                  ? "oklch(0.42 0.14 145)"
                  : Number(score) >= 2.5
                    ? "oklch(0.52 0.18 72)"
                    : Number(score) > 0
                      ? "oklch(0.48 0.18 30)"
                      : "var(--muted-foreground)",
            }}
          >
            {score !== "" ? score : "—"}
          </span>
        </div>

        {/* Last Updated */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Last Updated</span>
          <span className="text-xs text-muted-foreground">
            {lastUpdated ?? "—"}
          </span>
        </div>

        {/* Edit button */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsEditing(true)}
          className="h-8 gap-1.5 text-xs w-full"
          data-ocid={`kpi.progress.edit.${index + 1}`}
        >
          <Pencil className="w-3 h-3" />
          Edit
        </Button>
      </div>
    );
  }

  // ── Editing view ─────────────────────────────────────────────────────────
  return (
    <div
      className="grid items-center gap-2 px-4 py-3 rounded-xl"
      style={{
        gridTemplateColumns: "60px 1fr 1fr 1fr 140px 80px",
        background: rowBg,
        outline: "1.5px solid oklch(0.78 0.12 250 / 0.4)",
      }}
    >
      {/* Period label */}
      <span
        className="text-xs font-bold text-center py-1 rounded-md"
        style={{
          color: "oklch(0.38 0.065 258)",
          background: "oklch(0.93 0.012 252)",
        }}
      >
        {label}
      </span>

      {/* Target (read-only) */}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">Target</span>
        <span className="text-sm font-semibold text-foreground">
          {targetValue !== undefined ? targetValue.toLocaleString() : "—"}
        </span>
      </div>

      {/* Achievement (editable) */}
      <div className="flex flex-col gap-0.5">
        <Label className="text-xs text-muted-foreground">Achievement</Label>
        <Input
          type="number"
          min="0"
          step="any"
          placeholder="0"
          value={achievement}
          onChange={(e) => setAchievement(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* Score 0–5 (editable) */}
      <div className="flex flex-col gap-0.5">
        <Label className="text-xs text-muted-foreground">Score (0–5)</Label>
        <Input
          type="number"
          min="0"
          max="5"
          step="0.01"
          placeholder="0"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* Last Updated */}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">Last Updated</span>
        <span className="text-xs text-muted-foreground">
          {lastUpdated ?? "—"}
        </span>
      </div>

      {/* Save button */}
      <Button
        size="sm"
        onClick={() => void handleSave()}
        disabled={saving || (!achievement.trim() && !score.trim())}
        className="h-8 gap-1.5 text-xs w-full"
        data-ocid={`kpi.progress.save.${index + 1}`}
        style={
          !saving && (achievement.trim() || score.trim())
            ? { background: "oklch(0.38 0.12 145)", color: "white" }
            : undefined
        }
      >
        {saving ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            <Save className="w-3 h-3" />
            Save
          </>
        )}
      </Button>
    </div>
  );
}

// ─── KPI Progress Card ────────────────────────────────────────────────────────

interface KPIProgressCardProps {
  kpi: KPI;
  aspectName: string;
  index: number;
  onAchievementChange?: (
    kpiId: string,
    achievement: number,
    finalScore: number,
  ) => void;
}

function KPIProgressCard({
  kpi,
  aspectName,
  index,
  onAchievementChange,
}: KPIProgressCardProps) {
  const [expanded, setExpanded] = useState(true);
  const labels = getPeriodLabels(kpi.kpiPeriod);
  const count = getPeriodCount(kpi.kpiPeriod);

  const { data: progressData, isLoading: progressLoading } =
    useGetKPIProgressData(kpi.kpiId);

  // Local overrides applied immediately on save so scores update without waiting for refetch
  const [localProgressOverrides, setLocalProgressOverrides] = useState<
    Map<number, { achievement: number; score: number }>
  >(new Map());

  const handlePeriodSaved = (
    periodIndex: number,
    achievement: number,
    score: number,
  ) => {
    setLocalProgressOverrides((prev) => {
      const next = new Map(prev);
      next.set(periodIndex, { achievement, score });
      return next;
    });
  };

  // Build effective progress list: start from backend data then apply local overrides
  const effectiveProgress = useMemo<KPIProgressRecord[]>(() => {
    const base = progressData?.progress ?? [];
    if (localProgressOverrides.size === 0) return base;
    // Normalize periodIndex to numbers for reliable map keying
    const map = new Map<number, KPIProgressRecord>(
      base.map((r) => [
        Number(r.periodIndex),
        { ...r, periodIndex: BigInt(Number(r.periodIndex)) },
      ]),
    );
    for (const [periodIdx, override] of localProgressOverrides.entries()) {
      const existing = map.get(periodIdx);
      map.set(periodIdx, {
        progressId: existing?.progressId ?? "",
        kpiId: kpi.kpiId,
        periodIndex: BigInt(periodIdx),
        achievement: override.achievement,
        score: override.score,
        updatedAt: BigInt(Date.now()) * 1_000_000n,
        updatedBy: existing?.updatedBy ?? null,
      });
    }
    return Array.from(map.values());
  }, [progressData?.progress, localProgressOverrides, kpi.kpiId]);

  const yearlyAchievement = useMemo(() => {
    if (!effectiveProgress.length) return 0;
    return calcYearlyAchievement(kpi.kpiPeriod, effectiveProgress);
  }, [kpi.kpiPeriod, effectiveProgress]);

  const finalScore = useMemo(
    () => calcFinalScore(yearlyAchievement, kpi.kpiWeight),
    [yearlyAchievement, kpi.kpiWeight],
  );

  // Notify parent when computed values change
  useEffect(() => {
    onAchievementChange?.(kpi.kpiId, yearlyAchievement, finalScore);
  }, [kpi.kpiId, yearlyAchievement, finalScore, onAchievementChange]);

  const getTargetForPeriod = (periodIdx: number) =>
    progressData?.targets?.find(
      (t) =>
        Number(t.periodIndex) === periodIdx ||
        String(t.periodIndex) === String(periodIdx),
    );

  const getProgressForPeriod = (periodIdx: number) =>
    effectiveProgress.find(
      (p) =>
        Number(p.periodIndex) === periodIdx ||
        String(p.periodIndex) === String(periodIdx),
    );

  const { data: scoreParam = "" } = useGetKPIScoreParameter(kpi.kpiId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: "easeOut" }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Score Parameter Banner — shown at top of card if present */}
      {scoreParam && (
        <div className="px-5 pt-3 pb-0">
          <div
            className="px-3 py-2 rounded-lg text-xs leading-relaxed"
            style={{
              background: "oklch(0.94 0.012 252)",
              color: "oklch(0.38 0.065 258)",
            }}
          >
            <span className="font-semibold">Score Criteria: </span>
            {scoreParam}
          </div>
        </div>
      )}

      {/* Card Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "oklch(0.92 0.04 145)" }}
        >
          <TrendingUp
            className="w-4 h-4"
            style={{ color: "oklch(0.38 0.12 145)" }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-sm text-foreground leading-snug">
            {kpi.kpiMeasurement}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {aspectName} · {PERIOD_TYPE_LABELS[kpi.kpiPeriod] ?? kpi.kpiPeriod}
          </p>

          {/* Summary metrics row */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <div className="flex flex-col gap-0">
              <span className="text-xs text-muted-foreground">
                Yearly Achievement
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
                {yearlyAchievement.toFixed(2)} / 5
              </span>
            </div>
            <div
              className="w-px h-8 rounded-full"
              style={{ background: "oklch(0.88 0.018 252)" }}
            />
            <div className="flex flex-col gap-0">
              <span className="text-xs text-muted-foreground">
                Final KPI Score
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
            </div>
            <div
              className="w-px h-8 rounded-full"
              style={{ background: "oklch(0.88 0.018 252)" }}
            />
            <div className="flex flex-col gap-0">
              <span className="text-xs text-muted-foreground">Formula</span>
              <span className="text-xs text-muted-foreground font-mono">
                {yearlyAchievement.toFixed(2)} × {kpi.kpiWeight}% ={" "}
                {finalScore.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full hidden sm:inline"
            style={{
              background: "oklch(0.92 0.04 145)",
              color: "oklch(0.32 0.12 145)",
            }}
          >
            {kpi.kpiWeight}%
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Period Rows */}
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
              className="px-5 pb-5 pt-1"
              style={{ background: "oklch(0.985 0.003 252)" }}
            >
              {/* Column headers */}
              <div
                className="grid items-center gap-2 px-4 py-2 mb-1"
                style={{ gridTemplateColumns: "60px 1fr 1fr 1fr 140px 80px" }}
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
                <span className="text-xs font-semibold text-muted-foreground">
                  Action
                </span>
              </div>

              {progressLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: count }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
                    <Skeleton key={i} className="h-12 rounded-xl w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {labels.map((label, i) => (
                    <PeriodRow
                      key={`${kpi.kpiId}-${label}`}
                      label={label}
                      periodIndex={i + 1}
                      kpiId={kpi.kpiId}
                      targetRecord={getTargetForPeriod(i + 1)}
                      progressRecord={getProgressForPeriod(i + 1)}
                      index={i}
                      onSaved={handlePeriodSaved}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── KPI Node View (dashboard + cards) ───────────────────────────────────────

interface KPINodeViewProps {
  nodeId: string;
  nodeName: string;
  kpis: KPI[];
  aspectMap: Map<string, string>;
}

function KPINodeView({
  nodeId: _nodeId,
  nodeName,
  kpis,
  aspectMap,
}: KPINodeViewProps) {
  // Track achievements per KPI for the dashboard
  const [achievements, setAchievements] = useState<
    Map<string, { achievement: number; finalScore: number }>
  >(new Map());

  const handleAchievementChange = (
    kpiId: string,
    achievement: number,
    finalScore: number,
  ) => {
    setAchievements((prev) => {
      const next = new Map(prev);
      next.set(kpiId, { achievement, finalScore });
      return next;
    });
  };

  const kpisWithAchievement: KPIWithAchievement[] = kpis.map((kpi) => ({
    ...kpi,
    yearlyAchievement: achievements.get(kpi.kpiId)?.achievement ?? 0,
    finalScore: achievements.get(kpi.kpiId)?.finalScore ?? 0,
  }));

  const totalFinalScore = kpisWithAchievement.reduce(
    (sum, k) => sum + k.finalScore,
    0,
  );

  return (
    <div className="space-y-5">
      {/* Dashboard */}
      <BSCDashboard
        kpisWithAchievement={kpisWithAchievement}
        aspectMap={aspectMap}
        totalFinalScore={totalFinalScore}
        nodeName={nodeName}
      />

      {/* KPI Cards */}
      <div className="space-y-4">
        {kpis.map((kpi, i) => (
          <KPIProgressCard
            key={kpi.kpiId}
            kpi={kpi}
            aspectName={aspectMap.get(kpi.bscAspectId) ?? kpi.bscAspectId}
            index={i}
            onAchievementChange={handleAchievementChange}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Gate States ──────────────────────────────────────────────────────────────

function RevisedBanner({ revisedNodeNames }: { revisedNodeNames: string[] }) {
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
                style={{ background: "oklch(0.55 0.18 72)", color: "white" }}
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

function AwaitingApprovalState({
  pendingNodeNames,
}: { pendingNodeNames: string[] }) {
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

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({
  approvedCount,
  totalCount,
}: { approvedCount: number; totalCount: number }) {
  const allApproved = approvedCount === totalCount && totalCount > 0;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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

      <div
        className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 sm:col-span-1 col-span-2"
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

// ─── Multi-Node Navigation ────────────────────────────────────────────────────

interface NodeNavProps {
  nodeIds: string[];
  activeNodeId: string;
  orgNodeMap: Map<string, string>;
  kpisByNode: Map<string, KPI[]>;
  onSelect: (nodeId: string) => void;
}

function NodeNav({
  nodeIds,
  activeNodeId,
  orgNodeMap,
  kpisByNode,
  onSelect,
}: NodeNavProps) {
  if (nodeIds.length <= 1) return null;

  const activeIndex = nodeIds.indexOf(activeNodeId);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        disabled={activeIndex <= 0}
        onClick={() => {
          const prev = nodeIds[activeIndex - 1];
          if (prev) onSelect(prev);
        }}
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>

      <div className="flex flex-wrap gap-2">
        {nodeIds.map((nodeId, i) => {
          const isActive = nodeId === activeNodeId;
          const kpiCount = kpisByNode.get(nodeId)?.length ?? 0;
          return (
            <button
              key={nodeId}
              type="button"
              onClick={() => onSelect(nodeId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={
                isActive
                  ? {
                      background: "oklch(0.26 0.065 258)",
                      color: "oklch(0.92 0.02 252)",
                      border: "1px solid oklch(0.36 0.08 258)",
                    }
                  : {
                      background: "oklch(0.96 0.01 252)",
                      color: "oklch(0.40 0.05 258)",
                      border: "1px solid oklch(0.88 0.02 252)",
                    }
              }
            >
              <span>{orgNodeMap.get(nodeId) ?? `Node ${i + 1}`}</span>
              <Badge
                className="text-xs px-1.5 py-0 h-4"
                style={
                  isActive
                    ? { background: "oklch(0.42 0.12 145)", color: "white" }
                    : {
                        background: "oklch(0.88 0.02 252)",
                        color: "oklch(0.44 0.05 258)",
                      }
                }
              >
                {kpiCount}
              </Badge>
            </button>
          );
        })}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        disabled={activeIndex >= nodeIds.length - 1}
        onClick={() => {
          const next = nodeIds[activeIndex + 1];
          if (next) onSelect(next);
        }}
      >
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {["s1", "s2", "s3"].map((id) => (
          <div key={id} className="bg-card border border-border rounded-xl p-5">
            <Skeleton className="h-8 w-12 mb-2 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
      {["c1", "c2"].map((id) => (
        <div
          key={id}
          className="bg-card border border-border rounded-xl p-5 flex items-center gap-4"
        >
          <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkspaceKPIProgress() {
  const { data: profile } = useMyProfile();
  const { data: kpiYears, isLoading: yearsLoading } = useListKPIYears();
  const { data: bscAspects } = useListBSCAspects();
  const { data: orgNodes } = useListOrganizationNodes();

  // Derive active assignment IDs and org node IDs from roles
  const myAssignmentIds = useMemo(
    () =>
      new Set(
        (profile?.roles ?? [])
          .filter((r) => r.activeStatus)
          .map((r) => r.assignmentId),
      ),
    [profile],
  );

  const userOrgNodeIds = useMemo(
    () =>
      (profile?.roles ?? [])
        .filter((r) => r.activeStatus && r.orgNodeId)
        .map((r) => r.orgNodeId!)
        .filter(Boolean),
    [profile],
  );

  const openYears = useMemo(
    () => (kpiYears ?? []).filter((y) => y.status === Variant_Open_Closed.Open),
    [kpiYears],
  );

  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const effectiveYearId = useMemo(
    () => selectedYearId || (openYears[0]?.kpiYearId ?? ""),
    [selectedYearId, openYears],
  );

  const { data: allKPIs, isLoading: kpisLoading } = useListKPIs();

  // Filter to user's own KPIs
  const myKPIs = useMemo(
    () =>
      myAssignmentIds.size === 0
        ? []
        : (allKPIs ?? []).filter((k) =>
            myAssignmentIds.has(k.ownerRoleAssignmentId),
          ),
    [allKPIs, myAssignmentIds],
  );

  // Filter to selected year
  const myKPIsForYear = useMemo(
    () =>
      effectiveYearId
        ? myKPIs.filter((k) => k.kpiYearId === effectiveYearId)
        : myKPIs,
    [myKPIs, effectiveYearId],
  );

  // Group by org node
  const kpisByNode = useMemo(() => {
    const map = new Map<string, KPI[]>();
    for (const kpi of myKPIsForYear) {
      const existing = map.get(kpi.organizationNodeId) ?? [];
      map.set(kpi.organizationNodeId, [...existing, kpi]);
    }
    return map;
  }, [myKPIsForYear]);

  // Maps
  const orgNodeMap = useMemo(
    () => new Map((orgNodes ?? []).map((n) => [n.nodeId, n.nodeName])),
    [orgNodes],
  );
  const aspectMap = useMemo(
    () => new Map((bscAspects ?? []).map((a) => [a.aspectId, a.aspectName])),
    [bscAspects],
  );

  // ── Gate Logic ──────────────────────────────────────────────────────────────

  const nodeGateStatus = useMemo(() => {
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
      result.set(
        nodeId,
        hasRevised ? "revised" : allApproved ? "approved" : "pending",
      );
    }
    return result;
  }, [userOrgNodeIds, kpisByNode]);

  const revisedNodeNames = useMemo(
    () =>
      Array.from(nodeGateStatus.entries())
        .filter(([, s]) => s === "revised")
        .map(([nodeId]) => orgNodeMap.get(nodeId) ?? nodeId),
    [nodeGateStatus, orgNodeMap],
  );

  const pendingNodeNames = useMemo(
    () =>
      Array.from(nodeGateStatus.entries())
        .filter(([, s]) => s === "pending")
        .map(([nodeId]) => orgNodeMap.get(nodeId) ?? nodeId),
    [nodeGateStatus, orgNodeMap],
  );

  const approvedNodeIds = useMemo(
    () =>
      Array.from(nodeGateStatus.entries())
        .filter(([, s]) => s === "approved")
        .map(([n]) => n),
    [nodeGateStatus],
  );

  const hasAnyKPIs = myKPIsForYear.length > 0;
  const canShowProgress = approvedNodeIds.length > 0;

  // Active node for navigation
  const [activeNodeId, setActiveNodeId] = useState<string>("");
  const effectiveNodeId = useMemo(
    () =>
      activeNodeId && approvedNodeIds.includes(activeNodeId)
        ? activeNodeId
        : (approvedNodeIds[0] ?? ""),
    [activeNodeId, approvedNodeIds],
  );

  const currentNodeKPIs = useMemo(
    () => (effectiveNodeId ? (kpisByNode.get(effectiveNodeId) ?? []) : []),
    [effectiveNodeId, kpisByNode],
  );

  const totalApproved = myKPIsForYear.filter(
    (k) => k.kpiStatus === Variant_Approved_Draft_Submitted_Revised.Approved,
  ).length;

  const selectedYear = (kpiYears ?? []).find(
    (y) => y.kpiYearId === effectiveYearId,
  );
  const isLoading = yearsLoading || kpisLoading;

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
                Update achievement and score for each KPI period
                {selectedYear ? ` — ${String(selectedYear.year)}` : ""}
              </p>
            </div>
          </div>

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
          <PageSkeleton />
        ) : (
          <>
            {/* Stats */}
            <StatsBar
              approvedCount={totalApproved}
              totalCount={myKPIsForYear.length}
            />

            {/* Revised banner */}
            {revisedNodeNames.length > 0 && (
              <RevisedBanner revisedNodeNames={revisedNodeNames} />
            )}

            {/* Gate: No KPIs */}
            {!hasAnyKPIs && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <NotStartedState />
              </div>
            )}

            {/* Gate: Submitted/Pending */}
            {hasAnyKPIs && !canShowProgress && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <AwaitingApprovalState pendingNodeNames={pendingNodeNames} />
              </div>
            )}

            {/* Progress UI */}
            {canShowProgress && (
              <div className="space-y-5">
                {/* Multi-node navigation */}
                {approvedNodeIds.length > 1 && (
                  <NodeNav
                    nodeIds={approvedNodeIds}
                    activeNodeId={effectiveNodeId}
                    orgNodeMap={orgNodeMap}
                    kpisByNode={kpisByNode}
                    onSelect={setActiveNodeId}
                  />
                )}

                {/* Single-node label */}
                {approvedNodeIds.length === 1 && (
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{
                        background: "oklch(0.94 0.012 252)",
                        color: "oklch(0.42 0.055 258)",
                      }}
                    >
                      {orgNodeMap.get(effectiveNodeId) ?? "My KPIs"}
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

                {/* Node view with dashboard + cards */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={effectiveNodeId}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <KPINodeView
                      nodeId={effectiveNodeId}
                      nodeName={orgNodeMap.get(effectiveNodeId) ?? "My KPIs"}
                      kpis={currentNodeKPIs}
                      aspectMap={aspectMap}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
