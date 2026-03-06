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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Eye,
  Filter,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { KPI, OrgNode } from "../../../backend.d";
import { Variant_Approved_Draft_Submitted_Revised } from "../../../backend.d";
import {
  useApproveKPI,
  useGetKPIScoreParameter,
  useGetKPITargets,
  useListBSCAspects,
  useListKPIYears,
  useListKPIs,
  useListOrganizationNodes,
  useListStrategicObjectives,
  useMyProfile,
  useRejectKPI,
} from "../../../hooks/useQueries";

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_LABELS: Record<string, string> = {
  OneTime: "One-time",
  Annual: "Annual",
  Monthly: "Monthly",
  Quarterly: "Quarterly",
  SemiAnnual: "Semi-Annual",
};

const STATUS_CONFIG: Record<
  string,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NODE_TYPE_LABELS: Record<string, string> = {
  PRESIDENT_DIRECTOR: "President Director",
  DIRECTOR: "Director",
  DIVISION: "Division",
  DEPARTMENT: "Department",
};

function getStatusConfig(status: string) {
  return (
    STATUS_CONFIG[status] ??
    STATUS_CONFIG[Variant_Approved_Draft_Submitted_Revised.Submitted]
  );
}

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get nodes from root down to the given node (for chain display).
 */
function getNodeChain(nodeId: string, allNodes: OrgNode[]): OrgNode[] {
  const nodeMap = new Map(allNodes.map((n) => [n.nodeId, n]));
  const chain: OrgNode[] = [];
  let current = nodeMap.get(nodeId);
  while (current) {
    chain.unshift(current);
    if (current.parentNodeId) {
      current = nodeMap.get(current.parentNodeId);
    } else {
      break;
    }
  }
  return chain;
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
        style={{ background: "oklch(0.92 0.04 250)" }}
      >
        <span style={{ color: "oklch(0.38 0.14 250)" }}>{icon}</span>
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

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  selectedYear: string;
  onYearChange: (v: string) => void;
  selectedAspect: string;
  onAspectChange: (v: string) => void;
  selectedOrgNode: string;
  onOrgNodeChange: (v: string) => void;
  orgNodes: OrgNode[];
}

function FilterBar({
  selectedYear,
  onYearChange,
  selectedAspect,
  onAspectChange,
  selectedOrgNode,
  onOrgNodeChange,
  orgNodes,
}: FilterBarProps) {
  const { data: kpiYears } = useListKPIYears();
  const { data: bscAspects } = useListBSCAspects();
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-4 pb-4">
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

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  BSC Aspect
                </Label>
                <Select value={selectedAspect} onValueChange={onAspectChange}>
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

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Organization Node
                </Label>
                <Select value={selectedOrgNode} onValueChange={onOrgNodeChange}>
                  <SelectTrigger
                    className="h-8 text-xs"
                    data-ocid="kpi.approval.filter.org_node_select"
                  >
                    <SelectValue placeholder="All nodes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All nodes</SelectItem>
                    {orgNodes.map((n) => (
                      <SelectItem key={n.nodeId} value={n.nodeId}>
                        {n.nodeName}
                        {n.nodeType
                          ? ` (${NODE_TYPE_LABELS[n.nodeType] ?? n.nodeType})`
                          : ""}
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

// ─── Period label helper for approval sheet ───────────────────────────────────

function getPeriodLabelsForApproval(period: string): string[] {
  switch (period) {
    case "Annual":
    case "Monthly":
      return [
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
    case "Quarterly":
      return ["Q1", "Q2", "Q3", "Q4"];
    case "SemiAnnual":
      return ["H1", "H2"];
    default:
      return ["Year Target"];
  }
}

// ─── KPI Detail Sheet ─────────────────────────────────────────────────────────

interface KPIDetailSheetProps {
  kpi: KPI | null;
  open: boolean;
  onClose: () => void;
  allNodes: OrgNode[];
  aspectName: string;
  objectiveName: string;
  orgNodeName: string;
  onApprove: (kpiId: string) => void;
  onRevise: (kpi: KPI) => void;
  isApproving: boolean;
}

function KPIDetailSheet({
  kpi,
  open,
  onClose,
  allNodes,
  aspectName,
  objectiveName,
  orgNodeName,
  onApprove,
  onRevise,
  isApproving,
}: KPIDetailSheetProps) {
  // Hook calls must always run (no conditional hooks)
  const { data: scoreParameter } = useGetKPIScoreParameter(kpi?.kpiId ?? "");
  const { data: kpiTargets } = useGetKPITargets(kpi?.kpiId ?? "");

  if (!kpi) return null;

  const status = getStatusConfig(kpi.kpiStatus);
  const nodeChain = getNodeChain(kpi.organizationNodeId, allNodes);
  const periodLabels = getPeriodLabelsForApproval(kpi.kpiPeriod);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto"
      >
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.92 0.04 250)" }}
            >
              <ClipboardCheck
                className="w-5 h-5"
                style={{ color: "oklch(0.38 0.14 250)" }}
              />
            </div>
            <div>
              <SheetTitle className="font-display text-base">
                KPI Review
              </SheetTitle>
              <SheetDescription className="text-xs mt-0.5">
                Review details before approving or requesting revision
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* KPI Details */}
        <div className="space-y-4">
          {/* KPI Information */}
          <div
            className="rounded-xl border border-border p-4 space-y-0"
            style={{ background: "oklch(0.98 0.004 252)" }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              KPI Detail
            </h3>
            {/* Organization Node — highlighted */}
            <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border">
              <span className="text-sm text-muted-foreground shrink-0">
                Organization Node
              </span>
              <span
                className="text-sm font-semibold text-right break-words max-w-[240px] px-2 py-0.5 rounded"
                style={{
                  background: "oklch(0.92 0.04 250)",
                  color: "oklch(0.32 0.14 250)",
                }}
              >
                {orgNodeName}
              </span>
            </div>
            {[
              { label: "BSC Aspect", value: aspectName },
              { label: "Strategic Objective", value: objectiveName },
              { label: "KPI Measurement", value: kpi.kpiMeasurement },
              {
                label: "Period Type",
                value: PERIOD_LABELS[kpi.kpiPeriod] ?? kpi.kpiPeriod,
              },
              { label: "KPI Weight", value: `${kpi.kpiWeight}%` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-0"
              >
                <span className="text-sm text-muted-foreground shrink-0">
                  {label}
                </span>
                <span className="text-sm font-medium text-foreground text-right break-words max-w-[280px]">
                  {value}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2.5 border-t border-border">
              <span className="text-sm text-muted-foreground">Status</span>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: status.bg, color: status.color }}
              >
                {status.label}
              </span>
            </div>
          </div>

          {/* Score Parameter (Scoring Criteria) */}
          <div
            className="rounded-xl border border-border p-4 space-y-2"
            style={{ background: "oklch(0.97 0.012 250)" }}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Score Parameter (Scoring Criteria)
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              How to rate this KPI from 0 to 5
            </p>
            {scoreParameter ? (
              <div
                className="px-3 py-2.5 rounded-lg text-sm leading-relaxed font-mono"
                style={{
                  background: "oklch(0.93 0.018 250)",
                  color: "oklch(0.32 0.10 250)",
                  border: "1px solid oklch(0.85 0.025 250)",
                }}
              >
                {scoreParameter}
              </div>
            ) : (
              <p
                className="text-xs italic"
                style={{ color: "oklch(0.62 0.04 258)" }}
              >
                Not specified
              </p>
            )}
          </div>

          {/* KPI Targets + Yearly Target */}
          {periodLabels.length > 0 && (
            <div
              className="rounded-xl border border-border p-4 space-y-3"
              style={{ background: "oklch(0.98 0.004 252)" }}
            >
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                KPI Score Parameter &amp; Targets
              </h3>
              {kpiTargets && kpiTargets.length > 0 ? (
                <>
                  {/* Yearly Target summary row */}
                  {(() => {
                    const numericTargets = periodLabels.map((_, i) => {
                      const t = kpiTargets.find(
                        (t) =>
                          Number(t.periodIndex) === i + 1 ||
                          String(t.periodIndex) === String(i + 1),
                      );
                      return t?.targetValue ?? null;
                    });
                    const validTargets = numericTargets.filter(
                      (v): v is number => v !== null,
                    );
                    let yearlyTarget: number | null = null;
                    if (validTargets.length > 0) {
                      if (kpi.kpiPeriod === "Annual") {
                        yearlyTarget = validTargets.reduce((a, b) => a + b, 0);
                      } else if (kpi.kpiPeriod === "OneTime") {
                        yearlyTarget = validTargets[0] ?? null;
                      } else {
                        yearlyTarget =
                          validTargets.reduce((a, b) => a + b, 0) /
                          validTargets.length;
                      }
                    }
                    return yearlyTarget !== null ? (
                      <div
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                        style={{
                          background: "oklch(0.93 0.018 145)",
                          border: "1px solid oklch(0.82 0.06 145)",
                        }}
                      >
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "oklch(0.38 0.12 145)" }}
                        >
                          Yearly Target
                          {kpi.kpiPeriod === "Annual"
                            ? " (Sum)"
                            : kpi.kpiPeriod !== "OneTime"
                              ? " (Avg)"
                              : ""}
                        </span>
                        <span
                          className="font-bold font-mono"
                          style={{ color: "oklch(0.32 0.14 145)" }}
                        >
                          {yearlyTarget.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    ) : null;
                  })()}
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr
                          style={{ background: "oklch(0.94 0.012 252)" }}
                          className="border-b border-border"
                        >
                          <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">
                            Period
                          </th>
                          <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">
                            Target Value
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {periodLabels.map((label, i) => {
                          const target = kpiTargets.find(
                            (t) =>
                              Number(t.periodIndex) === i + 1 ||
                              String(t.periodIndex) === String(i + 1),
                          );
                          return (
                            <tr
                              // biome-ignore lint/suspicious/noArrayIndexKey: stable period index
                              key={i}
                              className="border-b border-border last:border-0"
                              style={{
                                background:
                                  i % 2 === 0
                                    ? "oklch(0.99 0.002 252)"
                                    : "oklch(0.97 0.004 252)",
                              }}
                            >
                              <td className="px-3 py-2">
                                <span
                                  className="text-xs font-bold px-2 py-0.5 rounded"
                                  style={{
                                    background: "oklch(0.92 0.012 252)",
                                    color: "oklch(0.40 0.055 258)",
                                  }}
                                >
                                  {label}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span className="text-sm font-semibold text-foreground">
                                  {target !== undefined
                                    ? target.targetValue.toLocaleString()
                                    : "—"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p
                  className="text-xs italic"
                  style={{ color: "oklch(0.62 0.04 258)" }}
                >
                  No targets saved yet
                </p>
              )}
            </div>
          )}

          {/* Approval Chain */}
          <div
            className="rounded-xl border border-border p-4 space-y-3"
            style={{ background: "oklch(0.98 0.004 252)" }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Approval Hierarchy
            </h3>
            {nodeChain.length > 0 ? (
              <div className="space-y-1.5">
                {nodeChain.map((node, i) => (
                  <div key={node.nodeId} className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{
                        background:
                          node.nodeId === kpi.organizationNodeId
                            ? "oklch(0.92 0.04 250)"
                            : "oklch(0.93 0.012 252)",
                        color:
                          node.nodeId === kpi.organizationNodeId
                            ? "oklch(0.38 0.14 250)"
                            : "oklch(0.42 0.055 258)",
                      }}
                    >
                      {i + 1}
                    </div>
                    <span
                      className="text-sm"
                      style={{
                        color:
                          node.nodeId === kpi.organizationNodeId
                            ? "oklch(0.38 0.14 250)"
                            : "oklch(0.42 0.065 258)",
                        fontWeight:
                          node.nodeId === kpi.organizationNodeId ? 600 : 400,
                      }}
                    >
                      {node.nodeName}
                    </span>
                    {node.nodeId === kpi.organizationNodeId && (
                      <span
                        className="ml-auto text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "oklch(0.92 0.04 250)",
                          color: "oklch(0.38 0.14 250)",
                        }}
                      >
                        Submitter
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No hierarchy information available.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isApproving}
          >
            Close
          </Button>
          <Button
            variant="outline"
            onClick={() => onRevise(kpi)}
            disabled={isApproving}
            className="flex-1 gap-2"
            style={{
              borderColor: "oklch(0.82 0.10 72)",
              color: "oklch(0.50 0.14 72)",
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Revise
          </Button>
          <Button
            onClick={() => onApprove(kpi.kpiId)}
            disabled={isApproving}
            className="flex-1 gap-2"
            style={{ background: "oklch(0.38 0.14 250)", color: "white" }}
          >
            {isApproving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {isApproving ? "Approving…" : "Approve KPI"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Approve Confirm Dialog ───────────────────────────────────────────────────

interface ApproveConfirmDialogProps {
  open: boolean;
  kpi: KPI | null;
  aspectName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isApproving: boolean;
}

function ApproveConfirmDialog({
  open,
  kpi,
  aspectName,
  onConfirm,
  onCancel,
  isApproving,
}: ApproveConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.92 0.04 145)" }}
            >
              <CheckCircle2
                className="w-5 h-5"
                style={{ color: "oklch(0.38 0.12 145)" }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                Approve KPI
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                This action is final and cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div
          className="rounded-xl p-4 space-y-2 text-sm"
          style={{ background: "oklch(0.97 0.008 252)" }}
        >
          <p className="text-foreground leading-relaxed">
            You are about to approve:
          </p>
          <p className="font-medium text-foreground break-words">
            {kpi?.kpiMeasurement ?? ""}
          </p>
          <p className="text-xs text-muted-foreground">Aspect: {aspectName}</p>
          <p className="text-xs text-muted-foreground">
            Weight: {kpi?.kpiWeight ?? 0}%
          </p>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          After approval, the KPI definition is locked. The owner will be able
          to update progress only.
        </p>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isApproving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isApproving}
            className="flex-1 gap-2"
            style={{ background: "oklch(0.38 0.12 145)", color: "white" }}
          >
            {isApproving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {isApproving ? "Approving…" : "Confirm Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Request Revision Dialog ──────────────────────────────────────────────────

interface RequestRevisionDialogProps {
  open: boolean;
  kpi: KPI | null;
  aspectName: string;
  revisionNotes: string;
  onNotesChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function RequestRevisionDialog({
  open,
  kpi,
  aspectName,
  revisionNotes,
  onNotesChange,
  onConfirm,
  onCancel,
  isSubmitting,
}: RequestRevisionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.95 0.04 72)" }}
            >
              <RotateCcw
                className="w-5 h-5"
                style={{ color: "oklch(0.50 0.14 72)" }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                Request Revision
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                The submitter will be asked to revise their KPI
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div
          className="rounded-xl p-4 space-y-1 text-sm"
          style={{ background: "oklch(0.97 0.008 252)" }}
        >
          <p className="font-medium text-foreground break-words">
            {kpi?.kpiMeasurement ?? ""}
          </p>
          <p className="text-xs text-muted-foreground">Aspect: {aspectName}</p>
          <p className="text-xs text-muted-foreground">
            Weight: {kpi?.kpiWeight ?? 0}%
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="revision-notes" className="text-sm font-medium">
            Revision Notes <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="revision-notes"
            placeholder="Explain what needs to be revised…"
            value={revisionNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="min-h-[100px] resize-none text-sm"
          />
          {revisionNotes.trim() === "" && (
            <p className="text-xs text-muted-foreground">
              Notes are required before requesting revision.
            </p>
          )}
        </div>

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
            disabled={isSubmitting || revisionNotes.trim() === ""}
            className="flex-1 gap-2"
            style={{ background: "oklch(0.50 0.14 72)", color: "white" }}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            {isSubmitting ? "Requesting…" : "Request Revision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Skeleton Rows ────────────────────────────────────────────────────────────

const SK_IDS = ["sk1", "sk2", "sk3", "sk4"];
const SK_WIDTHS = [
  "w-16",
  "w-28",
  "w-32",
  "w-16",
  "w-10",
  "w-20",
  "w-20",
  "w-24",
];

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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "oklch(0.92 0.04 250)" }}
      >
        <ClipboardCheck
          className="w-8 h-8"
          strokeWidth={1.5}
          style={{ color: "oklch(0.52 0.14 250)" }}
        />
      </div>
      <h3 className="font-display font-semibold text-base text-foreground mb-1">
        No KPIs pending approval
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
        KPIs submitted by your direct reports will appear here once they are
        ready for your review.
      </p>
    </div>
  );
}

// ─── KPI Table Row ────────────────────────────────────────────────────────────

interface KPIApprovalRowProps {
  kpi: KPI;
  aspectName: string;
  objectiveName: string;
  submitterNodeName: string;
  onView: (kpi: KPI) => void;
  onApprove: (kpi: KPI) => void;
  onRevise: (kpi: KPI) => void;
  delay: number;
}

function KPIApprovalRow({
  kpi,
  aspectName,
  objectiveName,
  submitterNodeName,
  onView,
  onApprove,
  onRevise,
  delay,
}: KPIApprovalRowProps) {
  const status = getStatusConfig(kpi.kpiStatus);

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay, ease: "easeOut" }}
      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => onView(kpi)}
    >
      <TableCell>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
          style={{
            background: "oklch(0.93 0.012 252)",
            color: "oklch(0.38 0.065 258)",
          }}
        >
          {aspectName}
        </span>
      </TableCell>
      <TableCell>
        <span
          className="text-sm text-foreground truncate max-w-[160px] block"
          title={objectiveName}
        >
          {objectiveName}
        </span>
      </TableCell>
      <TableCell>
        <span
          className="text-sm text-foreground truncate max-w-[180px] block"
          title={kpi.kpiMeasurement}
        >
          {kpi.kpiMeasurement}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {PERIOD_LABELS[kpi.kpiPeriod] ?? kpi.kpiPeriod}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm font-mono font-semibold">
          {kpi.kpiWeight}%
        </span>
      </TableCell>
      <TableCell>
        <span
          className="text-xs text-muted-foreground truncate max-w-[120px] block"
          title={submitterNodeName}
        >
          {submitterNodeName}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatTimestamp(kpi.createdAt)}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{ background: status.bg, color: status.color }}
          >
            {status.label}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onView(kpi);
            }}
            className="gap-1 text-xs h-8 px-2"
            data-ocid="kpi.approval.view_detail_button"
          >
            <Eye className="w-3 h-3" />
            Detail
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onRevise(kpi);
            }}
            className="gap-1 text-xs h-8 px-2"
            style={{
              borderColor: "oklch(0.82 0.10 72)",
              color: "oklch(0.50 0.14 72)",
            }}
          >
            <RotateCcw className="w-3 h-3" />
            Revise
          </Button>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onApprove(kpi);
            }}
            className="gap-1.5 text-xs h-8"
            style={{ background: "oklch(0.38 0.12 145)", color: "white" }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approve
          </Button>
        </div>
      </TableCell>
    </motion.tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkspaceKPIApproval() {
  const { data: profile } = useMyProfile();
  const { data: allNodes, isLoading: nodesLoading } =
    useListOrganizationNodes();
  const { data: bscAspects } = useListBSCAspects();
  const { data: allObjectives } = useListStrategicObjectives();
  const approveKPI = useApproveKPI();

  // Filters
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedAspect, setSelectedAspect] = useState("all");
  const [selectedOrgNode, setSelectedOrgNode] = useState("all");

  // Load submitted KPIs
  const { data: submittedKPIs, isLoading: kpisLoading } = useListKPIs(
    selectedYear !== "all" ? selectedYear : undefined,
    undefined,
    "SUBMITTED",
  );

  // Determine the current user's active node IDs from profile.roles (no admin call needed).
  const myActiveNodeIds = useMemo(() => {
    if (!profile?.roles) return new Set<string>();
    return new Set(
      profile.roles
        .filter((r) => r.activeStatus && r.orgNodeId)
        .map((r) => r.orgNodeId as string),
    );
  }, [profile]);

  // Filter KPIs that the logged-in user is eligible to approve.
  // The backend approveKPI checks: user must have a role in the DIRECT PARENT node
  // of the KPI's org node (or be an admin). We use the org nodes tree to find the
  // direct parent of each KPI's org node and check if the user is assigned there.
  const eligibleKPIs = useMemo(() => {
    if (!submittedKPIs || !allNodes) return [];
    const nodeMap = new Map(allNodes.map((n) => [n.nodeId, n]));
    return submittedKPIs.filter((kpi) => {
      const kpiNode = nodeMap.get(kpi.organizationNodeId);
      if (!kpiNode) return false;
      // If the KPI node has no parent, only company admins can approve —
      // those won't have an orgNodeId, so skip.
      if (!kpiNode.parentNodeId) return false;
      // Check if the approver has a role in the direct parent node.
      // Also allow if approver has a role in any ancestor (for multi-level chains).
      let current: typeof kpiNode | undefined = kpiNode;
      while (current?.parentNodeId) {
        if (myActiveNodeIds.has(current.parentNodeId)) return true;
        current = nodeMap.get(current.parentNodeId);
      }
      return false;
    });
  }, [submittedKPIs, allNodes, myActiveNodeIds]);

  // Client-side aspect + org node filter
  const filteredKPIs = useMemo(() => {
    if (!eligibleKPIs) return [];
    return eligibleKPIs.filter((k) => {
      if (selectedAspect !== "all" && k.bscAspectId !== selectedAspect)
        return false;
      if (selectedOrgNode !== "all" && k.organizationNodeId !== selectedOrgNode)
        return false;
      return true;
    });
  }, [eligibleKPIs, selectedAspect, selectedOrgNode]);

  // Lookup maps
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
    () => new Map((allNodes ?? []).map((n) => [n.nodeId, n.nodeName])),
    [allNodes],
  );

  // Stats: breakdown by submitter node
  const nodeBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const k of filteredKPIs) {
      const name = orgNodeMap.get(k.organizationNodeId) ?? k.organizationNodeId;
      map.set(name, (map.get(name) ?? 0) + 1);
    }
    return map;
  }, [filteredKPIs, orgNodeMap]);

  // Dialog / sheet state
  const [detailKPI, setDetailKPI] = useState<KPI | null>(null);
  const [approveTarget, setApproveTarget] = useState<KPI | null>(null);
  const [revisionTarget, setRevisionTarget] = useState<KPI | null>(null);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const rejectKPI = useRejectKPI();

  const handleApproveConfirm = async () => {
    if (!approveTarget) return;
    setIsApproving(true);
    try {
      await approveKPI.mutateAsync(approveTarget.kpiId);
      toast.success("KPI approved successfully");
      setApproveTarget(null);
      setDetailKPI(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve KPI");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRevisionConfirm = async () => {
    if (!revisionTarget || !revisionNotes.trim()) return;
    setIsApproving(true);
    try {
      await rejectKPI.mutateAsync({
        kpiId: revisionTarget.kpiId,
        revisionNotes: revisionNotes.trim(),
      });
      toast.success("Revision requested successfully");
      setRevisionTarget(null);
      setRevisionNotes("");
      setDetailKPI(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to request revision",
      );
    } finally {
      setIsApproving(false);
    }
  };

  const isLoading = kpisLoading || nodesLoading;

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
              <ClipboardCheck
                className="w-5 h-5"
                style={{ color: "oklch(0.82 0.14 250)" }}
              />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground leading-tight">
                KPI Approval
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Review and approve KPI proposals from your direct reports
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-8 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Pending Approval"
            value={
              isLoading ? (
                <Skeleton className="h-7 w-10" />
              ) : (
                filteredKPIs.length
              )
            }
            icon={<ClipboardCheck className="w-5 h-5" />}
          />
          <StatCard
            label="Unique Submitter Nodes"
            value={
              isLoading ? <Skeleton className="h-7 w-10" /> : nodeBreakdown.size
            }
            icon={<BarChart2 className="w-5 h-5" />}
          />
          <StatCard
            label="Total Submitted Company-wide"
            value={
              isLoading ? (
                <Skeleton className="h-7 w-10" />
              ) : (
                (submittedKPIs?.length ?? 0)
              )
            }
            icon={<AlertTriangle className="w-5 h-5" />}
          />
        </div>

        {/* Node breakdown pills */}
        {nodeBreakdown.size > 0 && (
          <div className="flex flex-wrap gap-2">
            {Array.from(nodeBreakdown.entries()).map(([name, count]) => (
              <span
                key={name}
                className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{
                  background: "oklch(0.92 0.04 250)",
                  color: "oklch(0.38 0.14 250)",
                }}
              >
                {name} — {count}
              </span>
            ))}
          </div>
        )}

        {/* Filters */}
        <FilterBar
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          selectedAspect={selectedAspect}
          onAspectChange={setSelectedAspect}
          selectedOrgNode={selectedOrgNode}
          onOrgNodeChange={setSelectedOrgNode}
          orgNodes={allNodes ?? []}
        />

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm text-foreground">
                Pending KPI Approvals
              </span>
              {!isLoading && filteredKPIs.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "oklch(0.92 0.04 250)",
                    color: "oklch(0.38 0.14 250)",
                  }}
                >
                  {filteredKPIs.length}
                </Badge>
              )}
            </div>
          </div>

          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {[
                    "BSC Aspect",
                    "Strategic Objective",
                    "KPI Measurement",
                    "Period",
                    "Weight",
                    "Submitter Node",
                    "Submitted",
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
          ) : filteredKPIs.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {[
                    "BSC Aspect",
                    "Strategic Objective",
                    "KPI Measurement",
                    "Period",
                    "Weight",
                    "Submitter Node",
                    "Submitted",
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
                  {filteredKPIs.map((kpi, i) => (
                    <KPIApprovalRow
                      key={kpi.kpiId}
                      kpi={kpi}
                      aspectName={
                        aspectMap.get(kpi.bscAspectId) ?? kpi.bscAspectId
                      }
                      objectiveName={
                        objectiveMap.get(kpi.strategicObjectiveId) ??
                        kpi.strategicObjectiveId
                      }
                      submitterNodeName={
                        orgNodeMap.get(kpi.organizationNodeId) ??
                        kpi.organizationNodeId
                      }
                      onView={setDetailKPI}
                      onApprove={setApproveTarget}
                      onRevise={setRevisionTarget}
                      delay={i * 0.04}
                    />
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* KPI Detail Sheet */}
      <KPIDetailSheet
        kpi={detailKPI}
        open={!!detailKPI}
        onClose={() => setDetailKPI(null)}
        allNodes={allNodes ?? []}
        aspectName={
          detailKPI
            ? (aspectMap.get(detailKPI.bscAspectId) ?? detailKPI.bscAspectId)
            : ""
        }
        objectiveName={
          detailKPI
            ? (objectiveMap.get(detailKPI.strategicObjectiveId) ??
              detailKPI.strategicObjectiveId)
            : ""
        }
        orgNodeName={
          detailKPI
            ? (orgNodeMap.get(detailKPI.organizationNodeId) ??
              detailKPI.organizationNodeId)
            : ""
        }
        onApprove={(id) => {
          const kpi = filteredKPIs.find((k) => k.kpiId === id);
          if (kpi) setApproveTarget(kpi);
        }}
        onRevise={(kpi) => setRevisionTarget(kpi)}
        isApproving={isApproving}
      />

      {/* Approve Confirm Dialog */}
      <ApproveConfirmDialog
        open={!!approveTarget}
        kpi={approveTarget}
        aspectName={
          approveTarget
            ? (aspectMap.get(approveTarget.bscAspectId) ??
              approveTarget.bscAspectId)
            : ""
        }
        onConfirm={() => void handleApproveConfirm()}
        onCancel={() => setApproveTarget(null)}
        isApproving={isApproving}
      />

      {/* Request Revision Dialog */}
      <RequestRevisionDialog
        open={!!revisionTarget}
        kpi={revisionTarget}
        aspectName={
          revisionTarget
            ? (aspectMap.get(revisionTarget.bscAspectId) ??
              revisionTarget.bscAspectId)
            : ""
        }
        revisionNotes={revisionNotes}
        onNotesChange={setRevisionNotes}
        onConfirm={() => void handleRevisionConfirm()}
        onCancel={() => {
          setRevisionTarget(null);
          setRevisionNotes("");
        }}
        isSubmitting={isApproving}
      />
    </motion.div>
  );
}
