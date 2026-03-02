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
  useCreateStrategicObjective,
  useListBSCAspects,
  useListStrategicObjectives,
  useUpdateStrategicObjective,
} from "@/hooks/useQueries";
import { Hash, Info, Loader2, Pencil, Plus, Target } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { BSCAspect, StrategicObjective } from "../../../backend.d";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(ns: bigint): string {
  const ms = Number(ns) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncatePrincipal(principal: { toString(): string }): string {
  const s = principal.toString();
  if (s.length <= 16) return s;
  return `${s.slice(0, 10)}…${s.slice(-5)}`;
}

// Deterministic palette cycling for BSC aspect badges
const ASPECT_BADGE_PALETTES = [
  { bg: "oklch(0.92 0.06 145)", color: "oklch(0.38 0.14 145)" }, // green
  { bg: "oklch(0.92 0.08 260)", color: "oklch(0.38 0.14 260)" }, // blue
  { bg: "oklch(0.93 0.07 320)", color: "oklch(0.40 0.14 320)" }, // purple
  { bg: "oklch(0.93 0.07 55)", color: "oklch(0.40 0.14 55)" }, // amber
  { bg: "oklch(0.92 0.07 180)", color: "oklch(0.38 0.14 180)" }, // teal
];

function getAspectPalette(index: number) {
  return ASPECT_BADGE_PALETTES[index % ASPECT_BADGE_PALETTES.length];
}

// ─── Skeleton Rows ────────────────────────────────────────────────────────────

const SKELETON_ROW_IDS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"];

function SkeletonRows() {
  return (
    <>
      {SKELETON_ROW_IDS.map((id) => (
        <TableRow key={id}>
          <TableCell>
            <Skeleton className="h-5 w-56 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-28 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-36 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-40 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-16 rounded" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  hasAspects: boolean;
  isFiltered: boolean;
  onAdd: () => void;
}

function EmptyState({ hasAspects, isFiltered, onAdd }: EmptyStateProps) {
  if (!hasAspects) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <div
          className="flex items-start gap-3 rounded-xl px-5 py-4 mb-8 max-w-md text-left"
          style={{ background: "oklch(0.96 0.03 72 / 0.35)" }}
        >
          <Info
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            style={{ color: "oklch(0.62 0.14 72)" }}
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">
              BSC Aspects are required
            </strong>{" "}
            before creating Strategic Objectives. Go to BSC Aspects first to
            define your Balanced Scorecard categories.
          </p>
        </div>
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: "oklch(0.94 0.012 252)" }}
        >
          <Target
            className="w-8 h-8"
            strokeWidth={1.5}
            style={{ color: "oklch(0.52 0.065 258)" }}
          />
        </div>
        <h3 className="font-display font-semibold text-base text-foreground mb-1">
          No BSC Aspects defined
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          Create BSC Aspects first, then come back to add Strategic Objectives.
        </p>
      </div>
    );
  }

  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "oklch(0.94 0.012 252)" }}
        >
          <Target
            className="w-7 h-7"
            strokeWidth={1.5}
            style={{ color: "oklch(0.52 0.065 258)" }}
          />
        </div>
        <h3 className="font-display font-semibold text-sm text-foreground mb-1">
          No objectives in this aspect
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-5 leading-relaxed">
          No strategic objectives have been added to this BSC Aspect yet.
        </p>
        <Button onClick={onAdd} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Objective
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "oklch(0.94 0.012 252)" }}
      >
        <Target
          className="w-8 h-8"
          strokeWidth={1.5}
          style={{ color: "oklch(0.52 0.065 258)" }}
        />
      </div>
      <h3 className="font-display font-semibold text-base text-foreground mb-1">
        No strategic objectives yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        Add strategic objectives linked to BSC Aspects to align KPIs with your
        company strategy.
      </p>
      <Button onClick={onAdd} className="gap-2">
        <Plus className="w-4 h-4" />
        Add Objective
      </Button>
    </div>
  );
}

// ─── Add Objective Dialog ─────────────────────────────────────────────────────

interface AddObjectiveDialogProps {
  open: boolean;
  onClose: () => void;
  aspects: BSCAspect[];
  defaultAspectId?: string;
}

function AddObjectiveDialog({
  open,
  onClose,
  aspects,
  defaultAspectId,
}: AddObjectiveDialogProps) {
  const createMutation = useCreateStrategicObjective();
  const [selectedAspectId, setSelectedAspectId] = useState(
    defaultAspectId ?? "",
  );
  const [objectiveName, setObjectiveName] = useState("");
  const [errors, setErrors] = useState<{
    aspectId?: string;
    name?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!selectedAspectId) newErrors.aspectId = "Please select a BSC Aspect.";
    if (!objectiveName.trim()) newErrors.name = "Objective name is required.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    try {
      await createMutation.mutateAsync({
        bscAspectId: selectedAspectId,
        objectiveName: objectiveName.trim(),
      });
      toast.success(`Strategic Objective "${objectiveName.trim()}" created`);
      setObjectiveName("");
      setSelectedAspectId(defaultAspectId ?? "");
      setErrors({});
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create objective",
      );
    }
  };

  const handleClose = () => {
    setObjectiveName("");
    setSelectedAspectId(defaultAspectId ?? "");
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.94 0.012 252)" }}
            >
              <Target
                className="w-5 h-5"
                style={{ color: "oklch(0.38 0.065 258)" }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                Add Strategic Objective
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Link an objective to a Balanced Scorecard aspect
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* BSC Aspect selector */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">BSC Aspect</Label>
            <Select
              value={selectedAspectId}
              onValueChange={(v) => {
                setSelectedAspectId(v);
                setErrors((prev) => ({ ...prev, aspectId: undefined }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a BSC Aspect…" />
              </SelectTrigger>
              <SelectContent>
                {aspects.map((a) => (
                  <SelectItem key={a.aspectId} value={a.aspectId}>
                    {a.aspectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.aspectId && (
              <p className="text-xs text-destructive">{errors.aspectId}</p>
            )}
          </div>

          {/* Objective name */}
          <div className="space-y-1.5">
            <Label htmlFor="obj-name-input" className="text-sm font-medium">
              Objective Name
            </Label>
            <Input
              id="obj-name-input"
              type="text"
              placeholder="e.g. Increase Revenue Growth"
              value={objectiveName}
              onChange={(e) => {
                setObjectiveName(e.target.value);
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 gap-2"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {createMutation.isPending ? "Creating…" : "Create Objective"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Objective Dialog ────────────────────────────────────────────────────

interface EditObjectiveDialogProps {
  objective: StrategicObjective | null;
  open: boolean;
  onClose: () => void;
  aspects: BSCAspect[];
}

function EditObjectiveDialog({
  objective,
  open,
  onClose,
  aspects,
}: EditObjectiveDialogProps) {
  const updateMutation = useUpdateStrategicObjective();
  const [objectiveName, setObjectiveName] = useState(
    objective?.objectiveName ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && objective) {
      setObjectiveName(objective.objectiveName);
      setError(null);
    } else if (!isOpen) {
      onClose();
    }
  };

  const aspectName =
    aspects.find((a) => a.aspectId === objective?.bscAspectId)?.aspectName ??
    "—";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objectiveName.trim()) {
      setError("Objective name is required.");
      return;
    }
    if (!objective) return;
    try {
      await updateMutation.mutateAsync({
        objectiveId: objective.objectiveId,
        objectiveName: objectiveName.trim(),
      });
      toast.success(`Objective updated to "${objectiveName.trim()}"`);
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update objective",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.94 0.012 252)" }}
            >
              <Pencil
                className="w-5 h-5"
                style={{ color: "oklch(0.38 0.065 258)" }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                Edit Strategic Objective
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Update the objective name
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* BSC Aspect (read-only) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">BSC Aspect</Label>
            <div
              className="rounded-lg px-3 py-2.5 text-sm font-medium"
              style={{
                background: "oklch(0.96 0.012 252)",
                color: "oklch(0.38 0.065 258)",
              }}
            >
              {aspectName}
            </div>
            <p className="text-xs text-muted-foreground">
              BSC Aspect cannot be changed after creation
            </p>
          </div>

          {/* Objective name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="edit-obj-name-input"
              className="text-sm font-medium"
            >
              Objective Name
            </Label>
            <Input
              id="edit-obj-name-input"
              type="text"
              placeholder="e.g. Increase Revenue Growth"
              value={objectiveName}
              onChange={(e) => {
                setObjectiveName(e.target.value);
                setError(null);
              }}
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending || !objectiveName.trim()}
              className="flex-1 gap-2"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Pencil className="w-4 h-4" />
              )}
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Objective Row ────────────────────────────────────────────────────────────

interface ObjectiveRowProps {
  objective: StrategicObjective;
  aspectName: string;
  aspectIndex: number;
  onEdit: (obj: StrategicObjective) => void;
  animationDelay: number;
}

function ObjectiveRow({
  objective,
  aspectName,
  aspectIndex,
  onEdit,
  animationDelay,
}: ObjectiveRowProps) {
  const palette = getAspectPalette(aspectIndex);

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: animationDelay, ease: "easeOut" }}
      className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
    >
      {/* Objective Name */}
      <TableCell>
        <span className="font-medium text-sm text-foreground">
          {objective.objectiveName}
        </span>
      </TableCell>

      {/* BSC Aspect Badge */}
      <TableCell>
        <Badge
          variant="outline"
          className="text-xs font-medium border-0 whitespace-nowrap"
          style={{ background: palette.bg, color: palette.color }}
        >
          {aspectName}
        </Badge>
      </TableCell>

      {/* Created At */}
      <TableCell className="text-sm text-muted-foreground">
        {formatTimestamp(objective.createdAt)}
      </TableCell>

      {/* Created By */}
      <TableCell>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="font-mono text-xs cursor-default"
                style={{ color: "oklch(0.48 0.032 258)" }}
              >
                {truncatePrincipal(objective.createdBy)}
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="font-mono text-xs max-w-xs break-all"
            >
              {objective.createdBy.toString()}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs h-8"
          onClick={() => onEdit(objective)}
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </Button>
      </TableCell>
    </motion.tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminStrategicObjectives() {
  const { data: aspects, isLoading: isAspectsLoading } = useListBSCAspects();
  const { data: objectives, isLoading: isObjectivesLoading } =
    useListStrategicObjectives();

  const [selectedAspectId, setSelectedAspectId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingObjective, setEditingObjective] =
    useState<StrategicObjective | null>(null);

  const isLoading = isAspectsLoading || isObjectivesLoading;
  const hasAspects = (aspects?.length ?? 0) > 0;

  // Build aspect index map for badge color assignment (stable by aspectId)
  const aspectIndexMap = new Map<string, number>();
  aspects?.forEach((a, i) => aspectIndexMap.set(a.aspectId, i));

  // Filter objectives client-side
  const filteredObjectives = selectedAspectId
    ? (objectives?.filter((o) => o.bscAspectId === selectedAspectId) ?? [])
    : (objectives ?? []);

  const totalObjectives = objectives?.length ?? 0;
  const filteredCount = filteredObjectives.length;

  const isFiltered = selectedAspectId !== null;

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
              <Target
                className="w-5 h-5"
                style={{ color: "oklch(0.82 0.14 72)" }}
              />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground leading-tight">
                Strategic Objectives
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Link objectives to BSC Aspects to align KPIs with company
                strategy
              </p>
            </div>
          </div>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={() => setShowAddDialog(true)}
                    disabled={!hasAspects}
                    className="gap-2 flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Add Objective
                  </Button>
                </span>
              </TooltipTrigger>
              {!hasAspects && (
                <TooltipContent side="bottom" className="max-w-xs text-xs">
                  Define at least one BSC Aspect before adding Strategic
                  Objectives
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-8 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.94 0.012 252)" }}
            >
              <Target
                className="w-5 h-5"
                style={{ color: "oklch(0.38 0.065 258)" }}
              />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground leading-none">
                {totalObjectives}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total Objectives
              </p>
            </div>
          </div>
          {isFiltered && (
            <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(0.92 0.06 145)" }}
              >
                <Hash
                  className="w-5 h-5"
                  style={{ color: "oklch(0.45 0.14 145)" }}
                />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-foreground leading-none">
                  {filteredCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  In selected aspect
                </p>
              </div>
            </div>
          )}
        </div>

        {/* BSC Aspect Filter Pills */}
        {!isLoading && hasAspects && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedAspectId(null)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedAspectId === null
                  ? "text-card font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
              style={
                selectedAspectId === null
                  ? { background: "oklch(0.26 0.065 258)" }
                  : {}
              }
            >
              All
            </button>
            {aspects?.map((aspect) => {
              const idx = aspectIndexMap.get(aspect.aspectId) ?? 0;
              const palette = getAspectPalette(idx);
              const isActive = selectedAspectId === aspect.aspectId;
              return (
                <button
                  key={aspect.aspectId}
                  type="button"
                  onClick={() =>
                    setSelectedAspectId(isActive ? null : aspect.aspectId)
                  }
                  className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={
                    isActive
                      ? { background: palette.bg, color: palette.color }
                      : {
                          background: "oklch(0.96 0.008 252)",
                          color: "oklch(0.48 0.022 258)",
                        }
                  }
                >
                  {aspect.aspectName}
                </button>
              );
            })}
          </div>
        )}

        {/* Table Card */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm text-foreground">
                {isFiltered
                  ? (aspects?.find((a) => a.aspectId === selectedAspectId)
                      ?.aspectName ?? "Objectives")
                  : "All Objectives"}
              </span>
              {!isLoading && filteredObjectives.length > 0 && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: "oklch(0.93 0.012 252)",
                    color: "oklch(0.42 0.055 258)",
                  }}
                >
                  {filteredObjectives.length}
                </span>
              )}
            </div>
          </div>

          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[35%]">
                    Objective Name
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[18%]">
                    BSC Aspect
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[20%]">
                    Created
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[20%]">
                    Created By
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[7%]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SkeletonRows />
              </TableBody>
            </Table>
          ) : filteredObjectives.length === 0 ? (
            <EmptyState
              hasAspects={hasAspects}
              isFiltered={isFiltered}
              onAdd={() => setShowAddDialog(true)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[35%]">
                    Objective Name
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[18%]">
                    BSC Aspect
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[20%]">
                    Created
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[20%]">
                    Created By
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[7%]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {filteredObjectives.map((obj, i) => {
                    const aIdx = aspectIndexMap.get(obj.bscAspectId) ?? 0;
                    const aName =
                      aspects?.find((a) => a.aspectId === obj.bscAspectId)
                        ?.aspectName ?? "—";
                    return (
                      <ObjectiveRow
                        key={obj.objectiveId}
                        objective={obj}
                        aspectName={aName}
                        aspectIndex={aIdx}
                        onEdit={(o) => setEditingObjective(o)}
                        animationDelay={i * 0.04}
                      />
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Add Objective Dialog */}
      <AddObjectiveDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        aspects={aspects ?? []}
        defaultAspectId={selectedAspectId ?? undefined}
      />

      {/* Edit Objective Dialog */}
      <EditObjectiveDialog
        objective={editingObjective}
        open={!!editingObjective}
        onClose={() => setEditingObjective(null)}
        aspects={aspects ?? []}
      />
    </motion.div>
  );
}
