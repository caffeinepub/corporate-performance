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
  useCreateKPIYear,
  useListKPIYears,
  useSetKPIYearStatus,
} from "@/hooks/useQueries";
import {
  AlertTriangle,
  CalendarCheck2,
  CalendarClock,
  CalendarRange,
  CalendarX2,
  Loader2,
  Plus,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { KPIYear } from "../../../backend.d";
import { Variant_Open_Closed } from "../../../backend.d";

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
  accent?: "default" | "green" | "gray";
}

function StatCard({ label, value, icon, accent = "default" }: StatCardProps) {
  const accentStyles: Record<
    string,
    { bg: string; iconBg: string; iconColor: string }
  > = {
    default: {
      bg: "bg-card border border-border",
      iconBg: "oklch(0.94 0.012 252)",
      iconColor: "oklch(0.38 0.065 258)",
    },
    green: {
      bg: "bg-card border border-border",
      iconBg: "oklch(0.92 0.06 145)",
      iconColor: "oklch(0.45 0.14 145)",
    },
    gray: {
      bg: "bg-card border border-border",
      iconBg: "oklch(0.93 0.008 252)",
      iconColor: "oklch(0.48 0.022 258)",
    },
  };
  const style = accentStyles[accent];
  return (
    <div className={`${style.bg} rounded-xl p-5 flex items-center gap-4`}>
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: style.iconBg }}
      >
        <span style={{ color: style.iconColor }}>{icon}</span>
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
            <Skeleton className="h-7 w-16 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-36 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-40 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-28 rounded" />
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
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "oklch(0.94 0.012 252)" }}
      >
        <CalendarRange
          className="w-8 h-8"
          strokeWidth={1.5}
          style={{ color: "oklch(0.52 0.065 258)" }}
        />
      </div>
      <h3 className="font-display font-semibold text-base text-foreground mb-1">
        No performance years yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        Create a KPI &amp; OKR year to begin tracking performance. You can open
        or close a year to control submissions and progress updates.
      </p>
      <Button onClick={onAdd} className="gap-2">
        <Plus className="w-4 h-4" />
        Add Year
      </Button>
    </div>
  );
}

// ─── Add Year Dialog ──────────────────────────────────────────────────────────

interface AddYearDialogProps {
  open: boolean;
  onClose: () => void;
  existingYears: number[];
}

function AddYearDialog({ open, onClose, existingYears }: AddYearDialogProps) {
  const createMutation = useCreateKPIYear();
  const [yearInput, setYearInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = Number.parseInt(yearInput, 10);
    if (Number.isNaN(parsed) || parsed < 2020 || parsed > 2050) {
      setError("Year must be between 2020 and 2050.");
      return;
    }
    if (existingYears.includes(parsed)) {
      setError(`Year ${parsed} already exists.`);
      return;
    }
    try {
      await createMutation.mutateAsync(BigInt(parsed));
      toast.success(`Year ${parsed} created successfully`);
      setYearInput("");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create year");
    }
  };

  const handleClose = () => {
    setYearInput("");
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
              <CalendarRange
                className="w-5 h-5"
                style={{ color: "oklch(0.38 0.065 258)" }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                Add Performance Year
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Enter the year to create a new KPI &amp; OKR cycle
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="year-input" className="text-sm font-medium">
              Year
            </Label>
            <Input
              id="year-input"
              type="number"
              min={2020}
              max={2050}
              placeholder="e.g. 2025"
              value={yearInput}
              onChange={(e) => {
                setYearInput(e.target.value);
                setError(null);
              }}
              className="text-lg font-display font-bold tracking-wide"
              autoFocus
            />
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </p>
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
              disabled={createMutation.isPending || !yearInput}
              className="flex-1 gap-2"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {createMutation.isPending ? "Creating…" : "Create Year"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Status Toggle Confirm Dialog ─────────────────────────────────────────────

interface StatusToggleDialogProps {
  kpiYear: KPIYear | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function StatusToggleDialog({
  kpiYear,
  open,
  onClose,
  onConfirm,
  isLoading,
}: StatusToggleDialogProps) {
  if (!kpiYear) return null;
  const isOpen = kpiYear.status === Variant_Open_Closed.Open;
  const targetStatus = isOpen ? "Close" : "Re-open";
  const targetLabel = isOpen ? "CLOSED" : "OPEN";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: isOpen
                  ? "oklch(0.95 0.04 27)"
                  : "oklch(0.92 0.06 145)",
              }}
            >
              <AlertTriangle
                className="w-5 h-5"
                style={{
                  color: isOpen
                    ? "oklch(0.58 0.22 27)"
                    : "oklch(0.45 0.14 145)",
                }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                {targetStatus} Year {Number(kpiYear.year)}?
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                This will set the year status to {targetLabel}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div
          className="rounded-lg px-4 py-3 text-center"
          style={{ background: "oklch(0.96 0.012 252)" }}
        >
          <p className="font-display font-bold text-2xl text-foreground">
            {Number(kpiYear.year)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Status will change from{" "}
            <strong>{isOpen ? "OPEN" : "CLOSED"}</strong> →{" "}
            <strong>{targetLabel}</strong>
          </p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {isOpen
            ? "Closing this year will prevent new KPI submissions and progress updates."
            : "Re-opening this year will allow KPI submissions and progress updates again."}
        </p>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant={isOpen ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isOpen ? (
              <CalendarX2 className="w-4 h-4" />
            ) : (
              <CalendarCheck2 className="w-4 h-4" />
            )}
            {isLoading ? "Updating…" : `${targetStatus} Year`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Year Row ─────────────────────────────────────────────────────────────────

interface YearRowProps {
  kpiYear: KPIYear;
  onToggleStatus: (kpiYear: KPIYear) => void;
  animationDelay: number;
}

function YearRow({ kpiYear, onToggleStatus, animationDelay }: YearRowProps) {
  const isOpen = kpiYear.status === Variant_Open_Closed.Open;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: animationDelay, ease: "easeOut" }}
      className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
    >
      {/* Year */}
      <TableCell>
        <span className="font-display font-bold text-xl text-foreground">
          {Number(kpiYear.year)}
        </span>
      </TableCell>

      {/* Status */}
      <TableCell>
        {isOpen ? (
          <Badge
            variant="outline"
            className="gap-1.5 text-xs font-medium border-0"
            style={{
              background: "oklch(0.92 0.06 145)",
              color: "oklch(0.38 0.14 145)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "oklch(0.52 0.18 145)" }}
            />
            Open
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="gap-1.5 text-xs font-medium border-0"
            style={{
              background: "oklch(0.93 0.008 252)",
              color: "oklch(0.48 0.022 258)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "oklch(0.62 0.012 258)" }}
            />
            Closed
          </Badge>
        )}
      </TableCell>

      {/* Created At */}
      <TableCell className="text-sm text-muted-foreground">
        {formatTimestamp(kpiYear.createdAt)}
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
                {truncatePrincipal(kpiYear.createdBy)}
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="font-mono text-xs max-w-xs break-all"
            >
              {kpiYear.createdBy.toString()}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* Actions */}
      <TableCell>
        {isOpen ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8 border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/60"
            onClick={() => onToggleStatus(kpiYear)}
          >
            <CalendarX2 className="w-3.5 h-3.5" />
            Close Year
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8"
            onClick={() => onToggleStatus(kpiYear)}
          >
            <CalendarCheck2 className="w-3.5 h-3.5" />
            Re-open
          </Button>
        )}
      </TableCell>
    </motion.tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminKPIOKRYears() {
  const { data: kpiYears, isLoading } = useListKPIYears();
  const setStatusMutation = useSetKPIYearStatus();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<KPIYear | null>(null);

  const totalYears = kpiYears?.length ?? 0;
  const openYears =
    kpiYears?.filter((y) => y.status === Variant_Open_Closed.Open).length ?? 0;
  const closedYears =
    kpiYears?.filter((y) => y.status === Variant_Open_Closed.Closed).length ??
    0;

  const existingYears = kpiYears?.map((y) => Number(y.year)) ?? [];

  const handleToggleConfirm = async () => {
    if (!toggleTarget) return;
    const isOpen = toggleTarget.status === Variant_Open_Closed.Open;
    const newStatus = isOpen ? "CLOSED" : "OPEN";
    try {
      await setStatusMutation.mutateAsync({
        kpiYearId: toggleTarget.kpiYearId,
        newStatus,
      });
      toast.success(
        `Year ${Number(toggleTarget.year)} ${isOpen ? "closed" : "re-opened"} successfully`,
      );
      setToggleTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update year status",
      );
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
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.26 0.065 258)" }}
            >
              <CalendarRange
                className="w-5 h-5"
                style={{ color: "oklch(0.82 0.14 72)" }}
              />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground leading-tight">
                KPI &amp; OKR Years
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Manage annual performance cycles — open or close to control KPI
                submissions
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="gap-2 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Year
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-8 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Years"
            value={totalYears}
            icon={<CalendarRange className="w-5 h-5" />}
            accent="default"
          />
          <StatCard
            label="Open Years"
            value={openYears}
            icon={<CalendarClock className="w-5 h-5" />}
            accent="green"
          />
          <StatCard
            label="Closed Years"
            value={closedYears}
            icon={<CalendarX2 className="w-5 h-5" />}
            accent="gray"
          />
        </div>

        {/* Table Card */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm text-foreground">
                All Years
              </span>
              {!isLoading && kpiYears && kpiYears.length > 0 && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: "oklch(0.93 0.012 252)",
                    color: "oklch(0.42 0.055 258)",
                  }}
                >
                  {kpiYears.length}
                </span>
              )}
            </div>
            {!isLoading && kpiYears && kpiYears.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {openYears} open · {closedYears} closed
              </p>
            )}
          </div>

          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[15%]">
                    Year
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[14%]">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[25%]">
                    Created
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[25%]">
                    Created By
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[21%]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SkeletonRows />
              </TableBody>
            </Table>
          ) : !kpiYears || kpiYears.length === 0 ? (
            <EmptyState onAdd={() => setShowAddDialog(true)} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[15%]">
                    Year
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[14%]">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[25%]">
                    Created
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[25%]">
                    Created By
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[21%]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {kpiYears.map((y, i) => (
                    <YearRow
                      key={y.kpiYearId}
                      kpiYear={y}
                      onToggleStatus={(yr) => setToggleTarget(yr)}
                      animationDelay={i * 0.04}
                    />
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Add Year Dialog */}
      <AddYearDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        existingYears={existingYears}
      />

      {/* Status Toggle Confirm Dialog */}
      <StatusToggleDialog
        kpiYear={toggleTarget}
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggleConfirm}
        isLoading={setStatusMutation.isPending}
      />
    </motion.div>
  );
}
