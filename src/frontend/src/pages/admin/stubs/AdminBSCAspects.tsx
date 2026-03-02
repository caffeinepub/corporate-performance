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
  useCreateBSCAspect,
  useListBSCAspects,
  useUpdateBSCAspect,
} from "@/hooks/useQueries";
import { Info, Layers, Loader2, Pencil, PieChart, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { BSCAspect } from "../../../backend.d";

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

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "oklch(0.94 0.012 252)" }}
      >
        <span style={{ color: "oklch(0.38 0.065 258)" }}>{icon}</span>
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

const SKELETON_ROW_IDS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"];

function SkeletonRows() {
  return (
    <>
      {SKELETON_ROW_IDS.map((id) => (
        <TableRow key={id}>
          <TableCell>
            <Skeleton className="h-5 w-44 rounded" />
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

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      {/* Info banner */}
      <div
        className="flex items-start gap-3 rounded-xl px-5 py-4 mb-8 max-w-md text-left"
        style={{ background: "oklch(0.96 0.03 72 / 0.35)" }}
      >
        <Info
          className="w-4 h-4 flex-shrink-0 mt-0.5"
          style={{ color: "oklch(0.62 0.14 72)" }}
        />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">BSC Aspects are required</strong>{" "}
          before creating Strategic Objectives. Define the Balanced Scorecard
          categories that will classify your KPIs.
        </p>
      </div>

      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "oklch(0.94 0.012 252)" }}
      >
        <PieChart
          className="w-8 h-8"
          strokeWidth={1.5}
          style={{ color: "oklch(0.52 0.065 258)" }}
        />
      </div>
      <h3 className="font-display font-semibold text-base text-foreground mb-1">
        No BSC aspects yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        Add your first Balanced Scorecard aspect to begin organizing KPIs by
        strategic category.
      </p>
      <Button onClick={onAdd} className="gap-2">
        <Plus className="w-4 h-4" />
        Add Aspect
      </Button>
    </div>
  );
}

// ─── Add Aspect Dialog ────────────────────────────────────────────────────────

interface AddAspectDialogProps {
  open: boolean;
  onClose: () => void;
}

function AddAspectDialog({ open, onClose }: AddAspectDialogProps) {
  const createMutation = useCreateBSCAspect();
  const [aspectName, setAspectName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aspectName.trim()) {
      setError("Aspect name is required.");
      return;
    }
    try {
      await createMutation.mutateAsync(aspectName.trim());
      toast.success(`BSC Aspect "${aspectName.trim()}" created`);
      setAspectName("");
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create aspect",
      );
    }
  };

  const handleClose = () => {
    setAspectName("");
    setError(null);
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
              <PieChart
                className="w-5 h-5"
                style={{ color: "oklch(0.38 0.065 258)" }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                Add BSC Aspect
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Define a new Balanced Scorecard category
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="aspect-name-input" className="text-sm font-medium">
              Aspect Name
            </Label>
            <Input
              id="aspect-name-input"
              type="text"
              placeholder="e.g. Financial Perspective"
              value={aspectName}
              onChange={(e) => {
                setAspectName(e.target.value);
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
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !aspectName.trim()}
              className="flex-1 gap-2"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {createMutation.isPending ? "Creating…" : "Create Aspect"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Aspect Dialog ───────────────────────────────────────────────────────

interface EditAspectDialogProps {
  aspect: BSCAspect | null;
  open: boolean;
  onClose: () => void;
}

function EditAspectDialog({ aspect, open, onClose }: EditAspectDialogProps) {
  const updateMutation = useUpdateBSCAspect();
  const [aspectName, setAspectName] = useState(aspect?.aspectName ?? "");
  const [error, setError] = useState<string | null>(null);

  // Sync input when aspect changes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && aspect) {
      setAspectName(aspect.aspectName);
      setError(null);
    } else if (!isOpen) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aspectName.trim()) {
      setError("Aspect name is required.");
      return;
    }
    if (!aspect) return;
    try {
      await updateMutation.mutateAsync({
        aspectId: aspect.aspectId,
        aspectName: aspectName.trim(),
      });
      toast.success(`BSC Aspect updated to "${aspectName.trim()}"`);
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update aspect",
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
                Edit BSC Aspect
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Update the name of this Balanced Scorecard category
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="edit-aspect-name-input"
              className="text-sm font-medium"
            >
              Aspect Name
            </Label>
            <Input
              id="edit-aspect-name-input"
              type="text"
              placeholder="e.g. Financial Perspective"
              value={aspectName}
              onChange={(e) => {
                setAspectName(e.target.value);
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
              disabled={updateMutation.isPending || !aspectName.trim()}
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

// ─── Aspect Row ───────────────────────────────────────────────────────────────

interface AspectRowProps {
  aspect: BSCAspect;
  onEdit: (aspect: BSCAspect) => void;
  animationDelay: number;
}

function AspectRow({ aspect, onEdit, animationDelay }: AspectRowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: animationDelay, ease: "easeOut" }}
      className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
    >
      {/* Aspect Name */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1.5 text-xs font-medium border-0 flex-shrink-0"
            style={{
              background: "oklch(0.94 0.012 252)",
              color: "oklch(0.38 0.065 258)",
            }}
          >
            <Layers className="w-3 h-3" />
          </Badge>
          <span className="font-medium text-sm text-foreground">
            {aspect.aspectName}
          </span>
        </div>
      </TableCell>

      {/* Created At */}
      <TableCell className="text-sm text-muted-foreground">
        {formatTimestamp(aspect.createdAt)}
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
                {truncatePrincipal(aspect.createdBy)}
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="font-mono text-xs max-w-xs break-all"
            >
              {aspect.createdBy.toString()}
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
          onClick={() => onEdit(aspect)}
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </Button>
      </TableCell>
    </motion.tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminBSCAspects() {
  const { data: aspects, isLoading } = useListBSCAspects();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAspect, setEditingAspect] = useState<BSCAspect | null>(null);

  const totalAspects = aspects?.length ?? 0;

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
              <PieChart
                className="w-5 h-5"
                style={{ color: "oklch(0.82 0.14 72)" }}
              />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground leading-tight">
                BSC Aspects
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Define Balanced Scorecard categories to classify KPIs
                strategically
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="gap-2 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Aspect
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-8 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Aspects"
            value={totalAspects}
            icon={<PieChart className="w-5 h-5" />}
          />
        </div>

        {/* Table Card */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm text-foreground">
                All Aspects
              </span>
              {!isLoading && aspects && aspects.length > 0 && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: "oklch(0.93 0.012 252)",
                    color: "oklch(0.42 0.055 258)",
                  }}
                >
                  {aspects.length}
                </span>
              )}
            </div>
          </div>

          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[40%]">
                    Aspect Name
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[22%]">
                    Created
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[25%]">
                    Created By
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[13%]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SkeletonRows />
              </TableBody>
            </Table>
          ) : !aspects || aspects.length === 0 ? (
            <EmptyState onAdd={() => setShowAddDialog(true)} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[40%]">
                    Aspect Name
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[22%]">
                    Created
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[25%]">
                    Created By
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[13%]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {aspects.map((aspect, i) => (
                    <AspectRow
                      key={aspect.aspectId}
                      aspect={aspect}
                      onEdit={(a) => setEditingAspect(a)}
                      animationDelay={i * 0.04}
                    />
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Add Aspect Dialog */}
      <AddAspectDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />

      {/* Edit Aspect Dialog */}
      <EditAspectDialog
        aspect={editingAspect}
        open={!!editingAspect}
        onClose={() => setEditingAspect(null)}
      />
    </motion.div>
  );
}
