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
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit2,
  Eye,
  Filter,
  Loader2,
  Plus,
  Send,
  Target,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { OKR } from "../../../backend.d";
import {
  Variant_Approved_Draft_Rejected_Submitted_Revised,
  Variant_Open_Closed,
  Variant_People_Tools_Process,
} from "../../../backend.d";
import {
  useCreateOKR,
  useDeleteOKR,
  useListKPIYears,
  useListOKRs,
  useMyProfile,
  useSubmitOKR,
  useUpdateOKR,
} from "../../../hooks/useQueries";

// ─── Constants ────────────────────────────────────────────────────────────────

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

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  [Variant_Approved_Draft_Rejected_Submitted_Revised.Draft]: {
    label: "Draft",
    color: "oklch(0.40 0.06 258)",
    bg: "oklch(0.93 0.015 252)",
  },
  [Variant_Approved_Draft_Rejected_Submitted_Revised.Revised]: {
    label: "Revised",
    color: "oklch(0.50 0.14 72)",
    bg: "oklch(0.95 0.04 72)",
  },
  [Variant_Approved_Draft_Rejected_Submitted_Revised.Submitted]: {
    label: "Submitted",
    color: "oklch(0.40 0.14 250)",
    bg: "oklch(0.92 0.04 250)",
  },
  [Variant_Approved_Draft_Rejected_Submitted_Revised.Approved]: {
    label: "Approved",
    color: "oklch(0.38 0.12 145)",
    bg: "oklch(0.92 0.04 145)",
  },
  [Variant_Approved_Draft_Rejected_Submitted_Revised.Rejected]: {
    label: "Rejected",
    color: "oklch(0.42 0.18 27)",
    bg: "oklch(0.95 0.04 27)",
  },
};

const ASPECT_OPTIONS = [
  {
    value: "TOOLS",
    label: "Tools",
    display: Variant_People_Tools_Process.Tools,
  },
  {
    value: "PROCESS",
    label: "Process",
    display: Variant_People_Tools_Process.Process,
  },
  {
    value: "PEOPLE",
    label: "People",
    display: Variant_People_Tools_Process.People,
  },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getStatusConfig(status: string) {
  return (
    STATUS_CONFIG[status] ??
    STATUS_CONFIG[Variant_Approved_Draft_Rejected_Submitted_Revised.Draft]
  );
}

function getAspectConfig(aspect: string) {
  return (
    ASPECT_CONFIG[aspect] ?? ASPECT_CONFIG[Variant_People_Tools_Process.Tools]
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "oklch(0.94 0.03 145)" }}
      >
        <span style={{ color: "oklch(0.38 0.12 145)" }}>{icon}</span>
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

// ─── OKR Form ─────────────────────────────────────────────────────────────────

interface OKRFormProps {
  open: boolean;
  onClose: () => void;
  editingOKR?: OKR | null;
  defaultYearId?: string;
}

function OKRForm({ open, onClose, editingOKR, defaultYearId }: OKRFormProps) {
  const { data: kpiYears } = useListKPIYears();
  const createOKR = useCreateOKR();
  const updateOKR = useUpdateOKR();

  const openYears = useMemo(
    () => (kpiYears ?? []).filter((y) => y.status === Variant_Open_Closed.Open),
    [kpiYears],
  );

  const [kpiYearId, setKpiYearId] = useState(
    editingOKR?.kpiYearId ?? defaultYearId ?? "",
  );
  const [okrAspect, setOkrAspect] = useState(
    editingOKR
      ? (ASPECT_OPTIONS.find((a) => a.display === editingOKR.okrAspect)
          ?.value ?? "TOOLS")
      : "TOOLS",
  );
  const [objective, setObjective] = useState(editingOKR?.objective ?? "");
  const [keyResult, setKeyResult] = useState(editingOKR?.keyResult ?? "");
  const [targetValue, setTargetValue] = useState(
    editingOKR ? String(editingOKR.targetValue) : "",
  );
  const [initialTargetDate, setInitialTargetDate] = useState(
    editingOKR?.initialTargetDate ?? "",
  );
  const [revisedTargetDate, setRevisedTargetDate] = useState(
    editingOKR?.revisedTargetDate ?? "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!kpiYearId) errs.kpiYearId = "OKR Year is required";
    if (!okrAspect) errs.okrAspect = "OKR Aspect is required";
    if (!objective.trim()) errs.objective = "Objective title is required";
    if (!keyResult.trim()) errs.keyResult = "Key Result is required";
    if (
      targetValue === "" ||
      Number.isNaN(Number.parseFloat(targetValue)) ||
      Number.parseFloat(targetValue) < 0
    ) {
      errs.targetValue = "Enter a valid non-negative target value";
    }
    if (!initialTargetDate)
      errs.initialTargetDate = "Initial target date is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    try {
      if (editingOKR) {
        await updateOKR.mutateAsync({
          okrId: editingOKR.okrId,
          okrAspect,
          objective: objective.trim(),
          keyResult: keyResult.trim(),
          targetValue: Number.parseFloat(targetValue),
          initialTargetDate,
          revisedTargetDate: revisedTargetDate || null,
        });
        toast.success("OKR updated successfully");
      } else {
        await createOKR.mutateAsync({
          kpiYearId,
          okrAspect,
          objective: objective.trim(),
          keyResult: keyResult.trim(),
          targetValue: Number.parseFloat(targetValue),
          initialTargetDate,
        });
        toast.success("OKR saved as draft");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save OKR");
    }
  };

  const isPending = createOKR.isPending || updateOKR.isPending;

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.94 0.03 145)" }}
            >
              <Target
                className="w-5 h-5"
                style={{ color: "oklch(0.38 0.12 145)" }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                {editingOKR ? "Edit OKR" : "New OKR"}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {editingOKR
                  ? "Update your OKR details. It will remain as draft until submitted."
                  : "Define an Objective and Key Result. Save as draft, then submit individually."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* OKR Year + Aspect */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="okr-year-select" className="text-sm font-medium">
                OKR Year <span className="text-destructive">*</span>
              </Label>
              <Select
                value={kpiYearId}
                onValueChange={setKpiYearId}
                disabled={!!editingOKR}
              >
                <SelectTrigger id="okr-year-select">
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
              <Label
                htmlFor="okr-aspect-select"
                className="text-sm font-medium"
              >
                OKR Aspect <span className="text-destructive">*</span>
              </Label>
              <Select value={okrAspect} onValueChange={setOkrAspect}>
                <SelectTrigger id="okr-aspect-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASPECT_OPTIONS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.okrAspect && (
                <p className="text-xs text-destructive">{errors.okrAspect}</p>
              )}
            </div>
          </div>

          {/* Objective */}
          <div className="space-y-1.5">
            <Label htmlFor="objective-input" className="text-sm font-medium">
              Objective Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="objective-input"
              type="text"
              placeholder="e.g. Improve customer onboarding experience"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            />
            {errors.objective && (
              <p className="text-xs text-destructive">{errors.objective}</p>
            )}
          </div>

          {/* Key Result */}
          <div className="space-y-1.5">
            <Label htmlFor="key-result-input" className="text-sm font-medium">
              Key Result <span className="text-destructive">*</span>
            </Label>
            <Input
              id="key-result-input"
              type="text"
              placeholder="e.g. Reduce onboarding time from 14 days to 7 days"
              value={keyResult}
              onChange={(e) => setKeyResult(e.target.value)}
            />
            {errors.keyResult && (
              <p className="text-xs text-destructive">{errors.keyResult}</p>
            )}
          </div>

          {/* Target Value + Initial Target Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="target-value-input"
                className="text-sm font-medium"
              >
                Target Value <span className="text-destructive">*</span>
              </Label>
              <Input
                id="target-value-input"
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 7"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
              {errors.targetValue && (
                <p className="text-xs text-destructive">{errors.targetValue}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="initial-date-input"
                className="text-sm font-medium"
              >
                Initial Target Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="initial-date-input"
                type="date"
                value={initialTargetDate}
                onChange={(e) => setInitialTargetDate(e.target.value)}
              />
              {errors.initialTargetDate && (
                <p className="text-xs text-destructive">
                  {errors.initialTargetDate}
                </p>
              )}
            </div>
          </div>

          {/* Revised Target Date (only when editing) */}
          {editingOKR && (
            <div className="space-y-1.5">
              <Label
                htmlFor="revised-date-input"
                className="text-sm font-medium"
              >
                Revised Target Date{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="revised-date-input"
                type="date"
                value={revisedTargetDate}
                onChange={(e) => setRevisedTargetDate(e.target.value)}
              />
            </div>
          )}
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
              <Target className="w-4 h-4" />
            )}
            {isPending ? "Saving…" : "Save Draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Submit Confirm Dialog ────────────────────────────────────────────────────

interface SubmitConfirmProps {
  open: boolean;
  okr: OKR | null;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function SubmitConfirmDialog({
  open,
  okr,
  onConfirm,
  onCancel,
  isSubmitting,
}: SubmitConfirmProps) {
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
                Submit OKR
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                This action cannot be undone without approver revision
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div
          className="rounded-xl p-4 text-sm space-y-2"
          style={{ background: "oklch(0.97 0.008 252)" }}
        >
          <p className="text-foreground leading-relaxed">
            You are about to submit:{" "}
            <strong className="break-words">{okr?.objective ?? ""}</strong>
          </p>
          {okr?.notes && (
            <div
              className="flex items-start gap-2 px-3 py-2 rounded-lg mt-2 text-xs"
              style={{
                background: "oklch(0.95 0.04 72)",
                color: "oklch(0.44 0.14 72)",
              }}
            >
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>Revision notes: {okr.notes}</span>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          After submission, this OKR cannot be edited unless rejected by an
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

interface DeleteConfirmProps {
  open: boolean;
  okr: OKR | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

function DeleteConfirmDialog({
  open,
  okr,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmProps) {
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
                Delete OKR
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
            <strong className="break-words">{okr?.objective ?? ""}</strong>?
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            This OKR will be permanently removed and cannot be recovered.
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
            {isDeleting ? "Deleting…" : "Delete OKR"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── View Dialog (Read-Only) ──────────────────────────────────────────────────

interface ViewDialogProps {
  open: boolean;
  okr: OKR | null;
  yearLabel: string;
  onClose: () => void;
}

function ViewDialog({ open, okr, yearLabel, onClose }: ViewDialogProps) {
  if (!okr) return null;
  const status = getStatusConfig(okr.okrStatus);
  const aspect = getAspectConfig(okr.okrAspect);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
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
                OKR Details
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Read-only view
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {[
            { label: "Year", value: yearLabel },
            { label: "Objective", value: okr.objective },
            { label: "Key Result", value: okr.keyResult },
            { label: "Target Value", value: String(okr.targetValue) },
            {
              label: "Initial Target Date",
              value: formatDate(okr.initialTargetDate),
            },
            ...(okr.revisedTargetDate
              ? [
                  {
                    label: "Revised Target Date",
                    value: formatDate(okr.revisedTargetDate),
                  },
                ]
              : []),
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0"
            >
              <span className="text-sm text-muted-foreground shrink-0">
                {label}
              </span>
              <span className="text-sm font-medium text-foreground text-right break-words max-w-[240px]">
                {value}
              </span>
            </div>
          ))}

          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Aspect</span>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: aspect.bg, color: aspect.color }}
            >
              {aspect.label}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Status</span>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: status.bg, color: status.color }}
            >
              {status.label}
            </span>
          </div>

          {okr.realization && (
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Realization</span>
              <span className="text-sm font-medium text-foreground">
                {okr.realization}
              </span>
            </div>
          )}

          {okr.notes && (
            <div
              className="rounded-lg p-3 text-sm"
              style={{
                background: "oklch(0.95 0.04 72)",
                color: "oklch(0.44 0.14 72)",
              }}
            >
              <p className="font-medium text-xs mb-1">Revision Notes</p>
              <p className="leading-relaxed">{okr.notes}</p>
            </div>
          )}
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

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  selectedYear: string;
  onYearChange: (v: string) => void;
  selectedStatus: string;
  onStatusChange: (v: string) => void;
}

function FilterBar({
  selectedYear,
  onYearChange,
  selectedStatus,
  onStatusChange,
}: FilterBarProps) {
  const { data: kpiYears } = useListKPIYears();
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
            <div className="grid grid-cols-2 gap-3 px-4 pb-4">
              {/* Year */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  OKR Year
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
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Revised">Revised</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
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

// ─── OKR Table Row ────────────────────────────────────────────────────────────

interface OKRRowProps {
  okr: OKR;
  yearLabel: string;
  onEdit: (okr: OKR) => void;
  onView: (okr: OKR) => void;
  onSubmit: (okr: OKR) => void;
  onDelete: (okr: OKR) => void;
  delay: number;
}

function OKRRow({
  okr,
  yearLabel,
  onEdit,
  onView,
  onSubmit,
  onDelete,
  delay,
}: OKRRowProps) {
  const status = getStatusConfig(okr.okrStatus);
  const aspect = getAspectConfig(okr.okrAspect);

  const isDraftOrRevised =
    okr.okrStatus === Variant_Approved_Draft_Rejected_Submitted_Revised.Draft ||
    okr.okrStatus === Variant_Approved_Draft_Rejected_Submitted_Revised.Revised;

  const isSubmitted =
    okr.okrStatus ===
    Variant_Approved_Draft_Rejected_Submitted_Revised.Submitted;

  const isViewOnly = !isDraftOrRevised;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay, ease: "easeOut" }}
      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
    >
      <TableCell>
        <div className="max-w-[200px]">
          <p
            className="text-sm font-medium text-foreground truncate"
            title={okr.objective}
          >
            {okr.objective}
          </p>
          <p
            className="text-xs text-muted-foreground truncate mt-0.5"
            title={okr.keyResult}
          >
            {okr.keyResult}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
          style={{ background: aspect.bg, color: aspect.color }}
        >
          {aspect.label}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm font-mono font-semibold">
          {okr.targetValue}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {yearLabel}
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
                onClick={() => onEdit(okr)}
                className="gap-1.5 text-xs h-8"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </Button>
              <Button
                size="sm"
                onClick={() => onSubmit(okr)}
                className="gap-1.5 text-xs h-8"
                style={{ background: "oklch(0.38 0.14 250)", color: "white" }}
              >
                <Send className="w-3.5 h-3.5" />
                {okr.okrStatus ===
                Variant_Approved_Draft_Rejected_Submitted_Revised.Revised
                  ? "Resubmit"
                  : "Submit"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(okr)}
                className="gap-1.5 text-xs h-8 border-destructive/50 hover:bg-destructive/10"
                style={{ color: "oklch(0.42 0.18 27)" }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
          {isViewOnly && !isSubmitted && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView(okr)}
              className="gap-1.5 text-xs h-8"
            >
              <Eye className="w-3.5 h-3.5" />
              View
            </Button>
          )}
          {isSubmitted && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView(okr)}
              className="gap-1.5 text-xs h-8"
            >
              <Eye className="w-3.5 h-3.5" />
              View
            </Button>
          )}
        </div>
      </TableCell>
    </motion.tr>
  );
}

// ─── Skeleton Rows ────────────────────────────────────────────────────────────

const SK_IDS = ["sk1", "sk2", "sk3"];
const SK_WIDTHS = ["w-40", "w-16", "w-12", "w-16", "w-20", "w-28"];

function SkeletonRows() {
  return (
    <>
      {SK_IDS.map((id) => (
        <TableRow key={id}>
          {SK_WIDTHS.map((w) => (
            <TableCell key={`${w}-${id}`}>
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
        style={{ background: "oklch(0.94 0.03 145)" }}
      >
        <Target
          className="w-8 h-8"
          strokeWidth={1.5}
          style={{ color: "oklch(0.52 0.12 145)" }}
        />
      </div>
      <h3 className="font-display font-semibold text-base text-foreground mb-1">
        No OKRs yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        Create your first Objective and Key Result. Each OKR is submitted
        individually after saving as a draft.
      </p>
      <Button onClick={onAdd} className="gap-2">
        <Plus className="w-4 h-4" />
        New OKR
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkspaceOKRProposal() {
  const { data: profile } = useMyProfile();
  const { data: kpiYears } = useListKPIYears();
  const submitOKR = useSubmitOKR();
  const deleteOKR = useDeleteOKR();

  // Filters
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const { data: okrs, isLoading: okrsLoading } = useListOKRs(
    selectedYear !== "all" ? selectedYear : undefined,
  );

  // Derive the current user's active role assignment IDs directly from profile.roles
  // (profile is always populated after login, unlike listRoleAssignments which is admin-only).
  const myAssignmentIds = useMemo(() => {
    if (!profile?.roles) return new Set<string>();
    return new Set(
      profile.roles.filter((r) => r.activeStatus).map((r) => r.assignmentId),
    );
  }, [profile]);

  // Client-side filter: own OKRs only + optional status filter
  const filteredOKRs = useMemo(() => {
    if (!okrs) return [];
    return okrs.filter((o) => {
      // Only show OKRs owned by the current user
      if (
        myAssignmentIds.size > 0 &&
        !myAssignmentIds.has(o.ownerRoleAssignmentId)
      )
        return false;
      if (selectedStatus !== "all" && o.okrStatus !== selectedStatus)
        return false;
      return true;
    });
  }, [okrs, selectedStatus, myAssignmentIds]);

  // Stats
  const totalCount = okrs?.length ?? 0;
  const draftCount = useMemo(
    () =>
      (okrs ?? []).filter(
        (o) =>
          o.okrStatus ===
          Variant_Approved_Draft_Rejected_Submitted_Revised.Draft,
      ).length,
    [okrs],
  );
  const submittedCount = useMemo(
    () =>
      (okrs ?? []).filter(
        (o) =>
          o.okrStatus ===
          Variant_Approved_Draft_Rejected_Submitted_Revised.Submitted,
      ).length,
    [okrs],
  );
  const approvedCount = useMemo(
    () =>
      (okrs ?? []).filter(
        (o) =>
          o.okrStatus ===
          Variant_Approved_Draft_Rejected_Submitted_Revised.Approved,
      ).length,
    [okrs],
  );

  // Year label lookup
  const yearLabelMap = useMemo(
    () => new Map((kpiYears ?? []).map((y) => [y.kpiYearId, String(y.year)])),
    [kpiYears],
  );

  // Dialog state
  const [showForm, setShowForm] = useState(false);
  const [editingOKR, setEditingOKR] = useState<OKR | null>(null);
  const [viewingOKR, setViewingOKR] = useState<OKR | null>(null);
  const [submitTarget, setSubmitTarget] = useState<OKR | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OKR | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmitConfirm = async () => {
    if (!submitTarget) return;
    setIsSubmitting(true);
    try {
      await submitOKR.mutateAsync(submitTarget.okrId);
      toast.success("OKR submitted successfully");
      setSubmitTarget(null);
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
      await deleteOKR.mutateAsync(deleteTarget.okrId);
      toast.success("OKR deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
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
              <Target
                className="w-5 h-5"
                style={{ color: "oklch(0.82 0.14 145)" }}
              />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground leading-tight">
                OKR Proposal
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Draft and submit your Objectives and Key Results individually
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingOKR(null);
              setShowForm(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New OKR
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-8 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total OKRs"
            value={totalCount}
            icon={<Target className="w-5 h-5" />}
          />
          <StatCard
            label="Draft"
            value={draftCount}
            icon={<Edit2 className="w-5 h-5" />}
          />
          <StatCard
            label="Submitted"
            value={submittedCount}
            icon={<Send className="w-5 h-5" />}
          />
          <StatCard
            label="Approved"
            value={approvedCount}
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
        </div>

        {/* Filters */}
        <FilterBar
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm text-foreground">
                OKR List
              </span>
              {!okrsLoading && filteredOKRs.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "oklch(0.93 0.012 252)",
                    color: "oklch(0.42 0.055 258)",
                  }}
                >
                  {filteredOKRs.length}
                </Badge>
              )}
            </div>
          </div>

          {okrsLoading ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {[
                    "Objective / Key Result",
                    "Aspect",
                    "Target",
                    "Year",
                    "Status",
                    "Actions",
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
          ) : filteredOKRs.length === 0 ? (
            <EmptyState
              onAdd={() => {
                setEditingOKR(null);
                setShowForm(true);
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {[
                    "Objective / Key Result",
                    "Aspect",
                    "Target",
                    "Year",
                    "Status",
                    "Actions",
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
                  {filteredOKRs.map((okr, i) => (
                    <OKRRow
                      key={okr.okrId}
                      okr={okr}
                      yearLabel={
                        yearLabelMap.get(okr.kpiYearId) ?? okr.kpiYearId
                      }
                      onEdit={(o) => {
                        setEditingOKR(o);
                        setShowForm(true);
                      }}
                      onView={setViewingOKR}
                      onSubmit={setSubmitTarget}
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

      {/* OKR Form Dialog */}
      {showForm && (
        <OKRForm
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingOKR(null);
          }}
          editingOKR={editingOKR}
          defaultYearId={selectedYear !== "all" ? selectedYear : undefined}
        />
      )}

      {/* Submit Confirm Dialog */}
      <SubmitConfirmDialog
        open={!!submitTarget}
        okr={submitTarget}
        onConfirm={() => void handleSubmitConfirm()}
        onCancel={() => setSubmitTarget(null)}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        okr={deleteTarget}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />

      {/* View Dialog */}
      <ViewDialog
        open={!!viewingOKR}
        okr={viewingOKR}
        yearLabel={
          viewingOKR
            ? (yearLabelMap.get(viewingOKR.kpiYearId) ?? viewingOKR.kpiYearId)
            : ""
        }
        onClose={() => setViewingOKR(null)}
      />
    </motion.div>
  );
}
