import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Activity,
  Calendar,
  CheckCircle2,
  Info,
  Loader2,
  Lock,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { OKR } from "../../../backend.d";
import {
  Variant_Done_OnProgress_Backlog_CarriedForNextYear_Pending,
  Variant_Open_Closed,
  Variant_People_Tools_Process,
} from "../../../backend.d";
import {
  useListKPIYears,
  useListOKRs,
  useMyProfile,
  useUpdateOKRProgressWithDate,
} from "../../../hooks/useQueries";

// ─── Constants ────────────────────────────────────────────────────────────────

const REALIZATION_OPTIONS = [
  {
    value: "BACKLOG",
    label: "Backlog",
    display: Variant_Done_OnProgress_Backlog_CarriedForNextYear_Pending.Backlog,
  },
  {
    value: "ON_PROGRESS",
    label: "On Progress",
    display:
      Variant_Done_OnProgress_Backlog_CarriedForNextYear_Pending.OnProgress,
  },
  {
    value: "PENDING",
    label: "Pending",
    display: Variant_Done_OnProgress_Backlog_CarriedForNextYear_Pending.Pending,
  },
  {
    value: "DONE",
    label: "Done",
    display: Variant_Done_OnProgress_Backlog_CarriedForNextYear_Pending.Done,
  },
  {
    value: "CARRIED_FOR_NEXT_YEAR",
    label: "Carried For Next Year",
    display:
      Variant_Done_OnProgress_Backlog_CarriedForNextYear_Pending.CarriedForNextYear,
  },
];

const REALIZATION_DISPLAY_MAP: Record<string, string> = {
  Backlog: "Backlog",
  OnProgress: "On Progress",
  Pending: "Pending",
  Done: "Done",
  CarriedForNextYear: "Carried For Next Year",
};

const ASPECT_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  [Variant_People_Tools_Process.Tools]: {
    label: "Tools",
    color: "oklch(0.38 0.12 300)",
    bg: "oklch(0.94 0.03 300)",
  },
  [Variant_People_Tools_Process.Process]: {
    label: "Process",
    color: "oklch(0.42 0.14 55)",
    bg: "oklch(0.95 0.04 55)",
  },
  [Variant_People_Tools_Process.People]: {
    label: "People",
    color: "oklch(0.38 0.12 185)",
    bg: "oklch(0.93 0.04 185)",
  },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function getRealizationDisplay(raw: string): string {
  return REALIZATION_DISPLAY_MAP[raw] ?? raw;
}

function getRealizationBackendValue(displayValue: string): string {
  const found = REALIZATION_OPTIONS.find(
    (r) => r.display === displayValue || r.label === displayValue,
  );
  return found?.value ?? "BACKLOG";
}

function getAspectConfig(aspect: string) {
  return (
    ASPECT_CONFIG[aspect] ?? ASPECT_CONFIG[Variant_People_Tools_Process.Tools]
  );
}

// ─── OKR Progress Card ────────────────────────────────────────────────────────

interface OKRProgressCardProps {
  okr: OKR;
  yearLabel: string;
  isYearOpen: boolean;
  delay: number;
}

function OKRProgressCard({
  okr,
  yearLabel,
  isYearOpen,
  delay,
}: OKRProgressCardProps) {
  const updateProgress = useUpdateOKRProgressWithDate();
  const aspect = getAspectConfig(okr.okrAspect);

  // Initialize with backend's current realization value
  const currentBackendValue = getRealizationBackendValue(okr.realization);
  const [realization, setRealization] = useState(currentBackendValue);
  const [notes, setNotes] = useState(okr.notes ?? "");
  const [revisedTargetDate, setRevisedTargetDate] = useState(
    okr.revisedTargetDate ?? "",
  );
  const [saved, setSaved] = useState(false);
  const isSaving = updateProgress.isPending;

  const handleSave = async () => {
    try {
      await updateProgress.mutateAsync({
        okrId: okr.okrId,
        realization,
        notes: notes.trim() || null,
        revisedTargetDate: revisedTargetDate.trim() || null,
      });
      setSaved(true);
      toast.success("Progress updated");
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update progress",
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Card Header */}
      <div
        className="px-6 py-4 border-b border-border flex items-start justify-between gap-4"
        style={{ background: "oklch(0.99 0.004 145)" }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
              style={{ background: aspect.bg, color: aspect.color }}
            >
              {aspect.label}
            </span>
            <span className="text-xs text-muted-foreground">{yearLabel}</span>
          </div>
          <h3 className="font-display font-semibold text-sm text-foreground leading-snug break-words">
            {okr.objective}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 break-words">
            Key Result: {okr.keyResult}
          </p>
          {/* Initial Target Date */}
          {okr.initialTargetDate && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Calendar
                className="w-3 h-3 flex-shrink-0"
                style={{ color: "oklch(0.55 0.04 258)" }}
              />
              <span className="text-xs text-muted-foreground">
                Initial target:{" "}
                <span className="font-medium">{okr.initialTargetDate}</span>
              </span>
            </div>
          )}
        </div>

        {/* Target */}
        <div className="flex flex-col items-end flex-shrink-0 ml-2">
          <span className="text-xs text-muted-foreground mb-0.5">Target</span>
          <span className="text-lg font-display font-bold text-foreground leading-none">
            {okr.targetValue}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="px-6 py-4 space-y-4">
        {/* Realization Status */}
        <div className="space-y-1.5">
          <Label
            htmlFor={`realization-${okr.okrId}`}
            className="text-sm font-medium"
          >
            Realization Status
          </Label>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Select
                    value={realization}
                    onValueChange={setRealization}
                    disabled={!isYearOpen}
                  >
                    <SelectTrigger
                      id={`realization-${okr.okrId}`}
                      className={
                        !isYearOpen ? "opacity-60 cursor-not-allowed" : ""
                      }
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REALIZATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TooltipTrigger>
              {!isYearOpen && (
                <TooltipContent side="bottom" className="text-xs">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3 h-3" />
                    Year is closed — progress updates are locked
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <p className="text-xs text-muted-foreground">
            Current:{" "}
            <span className="font-medium">
              {getRealizationDisplay(okr.realization)}
            </span>
          </p>
        </div>

        {/* Revised Target Date — editable via updateOKRProgressWithDate */}
        <div className="space-y-1.5">
          <Label
            htmlFor={`revised-date-${okr.okrId}`}
            className="text-sm font-medium flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            Revised Target Date{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <input
            id={`revised-date-${okr.okrId}`}
            type="date"
            value={revisedTargetDate}
            onChange={(e) => setRevisedTargetDate(e.target.value)}
            disabled={!isYearOpen}
            className={[
              "w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm",
              "ring-offset-background placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              !isYearOpen ? "opacity-60 cursor-not-allowed" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            data-ocid={"okr.progress.revised_date.input"}
          />
          {okr.revisedTargetDate && (
            <p className="text-xs text-muted-foreground">
              Current:{" "}
              <span className="font-medium">{okr.revisedTargetDate}</span>
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor={`notes-${okr.okrId}`} className="text-sm font-medium">
            Notes{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Textarea
            id={`notes-${okr.okrId}`}
            placeholder="Add progress notes, blockers, or context…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!isYearOpen}
            className="resize-none text-sm"
            rows={2}
          />
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end">
          <Button
            size="sm"
            onClick={() => void handleSave()}
            disabled={!isYearOpen || isSaving}
            className="gap-1.5 text-xs h-8"
            style={
              isYearOpen
                ? { background: "oklch(0.38 0.12 145)", color: "white" }
                : undefined
            }
            data-ocid="okr.progress.save_button"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <Activity className="w-3.5 h-3.5" />
            )}
            {isSaving ? "Saving…" : saved ? "Saved!" : "Save Progress"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border space-y-2">
        <Skeleton className="h-4 w-20 rounded" />
        <Skeleton className="h-5 w-64 rounded" />
        <Skeleton className="h-3 w-48 rounded" />
      </div>
      <div className="px-6 py-4 space-y-3">
        <Skeleton className="h-9 w-full rounded" />
        <Skeleton className="h-16 w-full rounded" />
        <Skeleton className="h-8 w-28 rounded ml-auto" />
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ yearSelected }: { yearSelected: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "oklch(0.94 0.03 145)" }}
      >
        <Activity
          className="w-8 h-8"
          strokeWidth={1.5}
          style={{ color: "oklch(0.52 0.12 145)" }}
        />
      </div>
      <h3 className="font-display font-semibold text-base text-foreground mb-1">
        {yearSelected
          ? "No approved OKRs for this year"
          : "Select a year to view OKRs"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
        {yearSelected
          ? "OKRs appear here once they have been approved by your approver chain."
          : "Choose an OKR year from the selector above to view progress."}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkspaceOKRProgress() {
  const { data: profile } = useMyProfile();
  const { data: kpiYears } = useListKPIYears();

  // Default to most recent open year
  const defaultYear = useMemo(() => {
    const sorted = (kpiYears ?? []).sort(
      (a, b) => Number(b.year) - Number(a.year),
    );
    const openYear = sorted.find((y) => y.status === Variant_Open_Closed.Open);
    return openYear?.kpiYearId ?? sorted[0]?.kpiYearId ?? "";
  }, [kpiYears]);

  const [selectedYear, setSelectedYear] = useState("");

  // Use default year once loaded
  const effectiveYear = selectedYear || defaultYear;

  // Fetch all approved OKRs for the selected year (company-wide from backend)
  const { data: allApprovedOKRs, isLoading } = useListOKRs(
    effectiveYear || undefined,
    "APPROVED",
  );

  // Build set of the current user's active role assignment IDs so we can
  // filter to only OKRs owned by this user (not all company-wide approved OKRs)
  const myAssignmentIds = useMemo(() => {
    if (!profile?.roles) return new Set<string>();
    return new Set(
      profile.roles.filter((r) => r.activeStatus).map((r) => r.assignmentId),
    );
  }, [profile]);

  // Client-side ownership filter — only show OKRs where this user is the owner
  const approvedOKRs = useMemo(() => {
    if (!allApprovedOKRs) return [];
    return allApprovedOKRs.filter((o) =>
      myAssignmentIds.has(o.ownerRoleAssignmentId),
    );
  }, [allApprovedOKRs, myAssignmentIds]);

  const selectedYearObj = useMemo(
    () => (kpiYears ?? []).find((y) => y.kpiYearId === effectiveYear),
    [kpiYears, effectiveYear],
  );
  const isYearOpen = selectedYearObj?.status === Variant_Open_Closed.Open;

  const yearLabelMap = useMemo(
    () => new Map((kpiYears ?? []).map((y) => [y.kpiYearId, String(y.year)])),
    [kpiYears],
  );

  const displayYear = selectedYearObj ? String(selectedYearObj.year) : "—";

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
              <Activity
                className="w-5 h-5"
                style={{ color: "oklch(0.82 0.14 145)" }}
              />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground leading-tight">
                OKR Progress
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Update your realization status for approved OKRs
              </p>
            </div>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">
              OKR Year
            </Label>
            <Select value={effectiveYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32 h-9 text-sm">
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
        {/* Info Banner */}
        {effectiveYear && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
            style={{
              background: isYearOpen
                ? "oklch(0.92 0.04 145)"
                : "oklch(0.95 0.015 258)",
              color: isYearOpen
                ? "oklch(0.32 0.12 145)"
                : "oklch(0.42 0.04 258)",
            }}
          >
            {isYearOpen ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <span>
              Showing APPROVED OKRs for <strong>{displayYear}</strong>.{" "}
              {isYearOpen
                ? "Year is OPEN — progress updates are enabled."
                : "Year is CLOSED — progress updates are locked."}
            </span>
          </div>
        )}

        {/* Info tip when no year selected */}
        {!effectiveYear && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{
              background: "oklch(0.95 0.015 258)",
              color: "oklch(0.42 0.04 258)",
            }}
          >
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>
              Select an OKR year from the header to view approved OKRs.
            </span>
          </div>
        )}

        {/* OKR Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : !effectiveYear || (approvedOKRs ?? []).length === 0 ? (
          <EmptyState yearSelected={!!effectiveYear} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence initial={false}>
              {(approvedOKRs ?? []).map((okr: OKR, i: number) => (
                <OKRProgressCard
                  key={okr.okrId}
                  okr={okr}
                  yearLabel={yearLabelMap.get(okr.kpiYearId) ?? okr.kpiYearId}
                  isYearOpen={!!isYearOpen}
                  delay={i * 0.06}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
