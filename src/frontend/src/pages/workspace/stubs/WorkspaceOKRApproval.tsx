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
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Filter,
  Info,
  Loader2,
  MessageSquare,
  RotateCcw,
  Target,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { OKR, OrgNode } from "../../../backend.d";
import {
  Variant_Approved_Draft_Rejected_Submitted_Revised,
  Variant_People_Tools_Process,
} from "../../../backend.d";
import {
  useApproveOKR,
  useListKPIYears,
  useListOKRs,
  useListOrganizationNodes,
  useMyProfile,
  useRejectOKR,
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
  [Variant_Approved_Draft_Rejected_Submitted_Revised.Revised]: {
    label: "Revised",
    color: "oklch(0.50 0.14 72)",
    bg: "oklch(0.95 0.04 72)",
  },
  [Variant_Approved_Draft_Rejected_Submitted_Revised.Draft]: {
    label: "Draft",
    color: "oklch(0.40 0.06 258)",
    bg: "oklch(0.93 0.015 252)",
  },
  [Variant_Approved_Draft_Rejected_Submitted_Revised.Rejected]: {
    label: "Rejected",
    color: "oklch(0.42 0.18 27)",
    bg: "oklch(0.95 0.04 27)",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAspectConfig(aspect: string) {
  return (
    ASPECT_CONFIG[aspect] ?? ASPECT_CONFIG[Variant_People_Tools_Process.Tools]
  );
}

function getStatusConfig(status: string) {
  return (
    STATUS_CONFIG[status] ??
    STATUS_CONFIG[Variant_Approved_Draft_Rejected_Submitted_Revised.Submitted]
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

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

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

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  selectedYear: string;
  onYearChange: (v: string) => void;
  selectedAspect: string;
  onAspectChange: (v: string) => void;
}

function FilterBar({
  selectedYear,
  onYearChange,
  selectedAspect,
  onAspectChange,
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

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Aspect</Label>
                <Select value={selectedAspect} onValueChange={onAspectChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All aspects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All aspects</SelectItem>
                    <SelectItem value="Tools">Tools</SelectItem>
                    <SelectItem value="Process">Process</SelectItem>
                    <SelectItem value="People">People</SelectItem>
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

// ─── OKR Detail Sheet ─────────────────────────────────────────────────────────

interface OKRDetailSheetProps {
  okr: OKR | null;
  open: boolean;
  onClose: () => void;
  allNodes: OrgNode[];
  ownerNodeId: string | null;
  yearLabel: string;
  onApprove: (okrId: string) => void;
  onRequestRevision: (okrId: string) => void;
  isProcessing: boolean;
}

function OKRDetailSheet({
  okr,
  open,
  onClose,
  allNodes,
  ownerNodeId,
  yearLabel,
  onApprove,
  onRequestRevision,
  isProcessing,
}: OKRDetailSheetProps) {
  if (!okr) return null;

  const aspect = getAspectConfig(okr.okrAspect);
  const status = getStatusConfig(okr.okrStatus);
  const nodeChain = ownerNodeId ? getNodeChain(ownerNodeId, allNodes) : [];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-3">
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
              <SheetTitle className="font-display text-base">
                OKR Review
              </SheetTitle>
              <SheetDescription className="text-xs mt-0.5">
                Review details and take action
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4">
          {/* OKR Details */}
          <div
            className="rounded-xl border border-border p-4 space-y-3"
            style={{ background: "oklch(0.98 0.004 252)" }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              OKR Information
            </h3>
            <div className="flex items-start justify-between gap-4 py-2 border-b border-border">
              <span className="text-sm text-muted-foreground shrink-0">
                Year
              </span>
              <span className="text-sm font-medium text-right">
                {yearLabel}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Aspect</span>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: aspect.bg, color: aspect.color }}
              >
                {aspect.label}
              </span>
            </div>
            <div className="py-2 border-b border-border space-y-1.5">
              <p className="text-sm text-muted-foreground">Objective</p>
              <p className="text-sm font-medium text-foreground leading-relaxed break-words">
                {okr.objective}
              </p>
            </div>
            <div className="py-2 border-b border-border space-y-1.5">
              <p className="text-sm text-muted-foreground">Key Result</p>
              <p className="text-sm font-medium text-foreground leading-relaxed break-words">
                {okr.keyResult}
              </p>
            </div>
            <div className="flex items-start justify-between gap-4 py-2 border-b border-border">
              <span className="text-sm text-muted-foreground shrink-0">
                Target Value
              </span>
              <span className="text-sm font-mono font-semibold text-right">
                {okr.targetValue}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 py-2 border-b border-border">
              <span className="text-sm text-muted-foreground shrink-0">
                Initial Target Date
              </span>
              <span className="text-sm font-medium text-right">
                {formatDate(okr.initialTargetDate)}
              </span>
            </div>
            {okr.revisedTargetDate && (
              <div className="flex items-start justify-between gap-4 py-2 border-b border-border">
                <span className="text-sm text-muted-foreground shrink-0">
                  Revised Target Date
                </span>
                <span className="text-sm font-medium text-right">
                  {formatDate(okr.revisedTargetDate)}
                </span>
              </div>
            )}
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

          {/* Approval Chain */}
          {nodeChain.length > 0 && (
            <div
              className="rounded-xl border border-border p-4 space-y-3"
              style={{ background: "oklch(0.98 0.004 252)" }}
            >
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Approval Hierarchy
              </h3>
              <div className="space-y-1.5">
                {nodeChain.map((node, i) => (
                  <div key={node.nodeId} className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{
                        background:
                          node.nodeId === ownerNodeId
                            ? "oklch(0.94 0.03 145)"
                            : "oklch(0.93 0.012 252)",
                        color:
                          node.nodeId === ownerNodeId
                            ? "oklch(0.38 0.12 145)"
                            : "oklch(0.42 0.055 258)",
                      }}
                    >
                      {i + 1}
                    </div>
                    <span
                      className="text-sm"
                      style={{
                        color:
                          node.nodeId === ownerNodeId
                            ? "oklch(0.38 0.12 145)"
                            : "oklch(0.42 0.065 258)",
                        fontWeight: node.nodeId === ownerNodeId ? 600 : 400,
                      }}
                    >
                      {node.nodeName}
                    </span>
                    {node.nodeId === ownerNodeId && (
                      <span
                        className="ml-auto text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "oklch(0.94 0.03 145)",
                          color: "oklch(0.38 0.12 145)",
                        }}
                      >
                        Submitter
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previous revision notes */}
          {okr.notes && (
            <div
              className="rounded-xl px-4 py-3 text-sm border"
              style={{
                background: "oklch(0.95 0.04 72)",
                borderColor: "oklch(0.88 0.08 72)",
              }}
            >
              <p
                className="text-xs font-semibold mb-1"
                style={{ color: "oklch(0.44 0.14 72)" }}
              >
                Previous Revision Notes
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "oklch(0.44 0.14 72)" }}
              >
                {okr.notes}
              </p>
            </div>
          )}

          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
            style={{
              background: "oklch(0.96 0.012 252)",
              color: "oklch(0.42 0.055 258)",
            }}
          >
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-xs leading-relaxed">
              Approving locks the OKR structure. Request Revision sends it back
              to the submitter with your comments for editing and resubmission.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isProcessing}
          >
            Close
          </Button>
          <Button
            variant="outline"
            onClick={() => onRequestRevision(okr.okrId)}
            disabled={isProcessing}
            className="flex-1 gap-1.5 text-sm"
            style={{
              borderColor: "oklch(0.80 0.10 72)",
              color: "oklch(0.44 0.14 72)",
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Revise
          </Button>
          <Button
            onClick={() => onApprove(okr.okrId)}
            disabled={isProcessing}
            className="flex-1 gap-1.5 text-sm"
            style={{ background: "oklch(0.38 0.12 145)", color: "white" }}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Approve
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Approve Confirm Dialog ───────────────────────────────────────────────────

interface ApproveConfirmDialogProps {
  open: boolean;
  okr: OKR | null;
  onConfirm: () => void;
  onCancel: () => void;
  isApproving: boolean;
}

function ApproveConfirmDialog({
  open,
  okr,
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
                Approve OKR
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
            {okr?.objective ?? ""}
          </p>
          <p className="text-xs text-muted-foreground break-words">
            Key Result: {okr?.keyResult ?? ""}
          </p>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          After approval, the OKR structure is locked. The owner will be able to
          update progress only.
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

interface RevisionDialogProps {
  open: boolean;
  okr: OKR | null;
  onConfirm: (comment: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function RevisionDialog({
  open,
  okr,
  onConfirm,
  onCancel,
  isSubmitting,
}: RevisionDialogProps) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!comment.trim()) {
      setError("A revision comment is required");
      return;
    }
    onConfirm(comment.trim());
  };

  const handleCancel = () => {
    setComment("");
    setError("");
    onCancel();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleCancel();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.95 0.04 72)" }}
            >
              <MessageSquare
                className="w-5 h-5"
                style={{ color: "oklch(0.44 0.14 72)" }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                Request Revision
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Explain what needs to be changed
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {okr && (
          <div
            className="rounded-xl p-3 text-sm"
            style={{ background: "oklch(0.97 0.008 252)" }}
          >
            <p className="font-medium text-foreground break-words line-clamp-2">
              {okr.objective}
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="revision-comment" className="text-sm font-medium">
            Revision Comment <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="revision-comment"
            placeholder="Describe what needs to be revised…"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (error) setError("");
            }}
            rows={4}
            className="resize-none"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || !comment.trim()}
            className="flex-1 gap-2"
            style={{ background: "oklch(0.44 0.14 72)", color: "white" }}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            {isSubmitting ? "Sending…" : "Send for Revision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Skeleton Rows ────────────────────────────────────────────────────────────

const SK_IDS = ["sk1", "sk2", "sk3", "sk4"];
const SK_WIDTHS = ["w-40", "w-16", "w-12", "w-20", "w-24", "w-20", "w-28"];

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
        style={{ background: "oklch(0.94 0.03 145)" }}
      >
        <Target
          className="w-8 h-8"
          strokeWidth={1.5}
          style={{ color: "oklch(0.52 0.12 145)" }}
        />
      </div>
      <h3 className="font-display font-semibold text-base text-foreground mb-1">
        No OKRs pending approval
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
        OKRs submitted by your direct reports will appear here once they are
        ready for your review.
      </p>
    </div>
  );
}

// ─── OKR Approval Table Row ───────────────────────────────────────────────────

interface OKRApprovalRowProps {
  okr: OKR;
  ownerNodeName: string;
  onView: (okr: OKR) => void;
  onApprove: (okr: OKR) => void;
  onRevise: (okr: OKR) => void;
  delay: number;
}

function OKRApprovalRow({
  okr,
  ownerNodeName,
  onView,
  onApprove,
  onRevise,
  delay,
}: OKRApprovalRowProps) {
  const aspect = getAspectConfig(okr.okrAspect);
  const status = getStatusConfig(okr.okrStatus);

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay, ease: "easeOut" }}
      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => onView(okr)}
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
          {formatDate(okr.initialTargetDate)}
        </span>
      </TableCell>
      <TableCell>
        <span
          className="text-xs text-muted-foreground truncate max-w-[110px] block"
          title={ownerNodeName}
        >
          {ownerNodeName}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatTimestamp(okr.createdAt)}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
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
              onRevise(okr);
            }}
            className="gap-1 text-xs h-8"
            style={{ color: "oklch(0.44 0.14 72)" }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Revise
          </Button>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onApprove(okr);
            }}
            className="gap-1 text-xs h-8"
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

export default function WorkspaceOKRApproval() {
  const { data: profile } = useMyProfile();
  const { data: allNodes, isLoading: nodesLoading } =
    useListOrganizationNodes();
  const { data: kpiYears } = useListKPIYears();
  const approveOKR = useApproveOKR();
  const rejectOKR = useRejectOKR();

  // Filters
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedAspect, setSelectedAspect] = useState("all");

  // Load submitted OKRs — pass "SUBMITTED" (backend format) so the server-side
  // filter actually matches and returns only Submitted OKRs. After an approval
  // the query is invalidated and the newly-Approved OKR won't appear anymore.
  const { data: submittedOKRs, isLoading: okrsLoading } = useListOKRs(
    selectedYear !== "all" ? selectedYear : undefined,
    "SUBMITTED",
  );

  // Collect the current user's active role assignment IDs from their profile.
  // The backend stores approver1RoleAssignmentId / approver2RoleAssignmentId
  // directly on each OKR when it is submitted, so we just need to check whether
  // the logged-in user holds any of those assignments — no hierarchy traversal needed.
  const myAssignmentIds = useMemo(() => {
    if (!profile?.roles) return new Set<string>();
    return new Set(
      profile.roles.filter((r) => r.activeStatus).map((r) => r.assignmentId),
    );
  }, [profile]);

  // Build a map from roleAssignmentId → orgNodeId so we can display submitter's node.
  // We derive this from the OKR owner's role data available via the nodes list.
  // Note: this is display-only; approval eligibility is handled via myAssignmentIds.
  const roleAssignmentNodeMap = useMemo(() => {
    // We use the profile's own roles only (we cannot call listRoleAssignments as non-admin).
    // For the submitter node display we fall back to the OKR's ownerRoleAssignmentId lookup.
    const map = new Map<string, string>();
    for (const ra of profile?.roles ?? []) {
      if (ra.orgNodeId) {
        map.set(ra.assignmentId, ra.orgNodeId);
      }
    }
    return map;
  }, [profile]);

  // Filter OKRs that the logged-in user is in the approval chain for.
  // The backend sets approver1/approver2 to the upstream role assignment IDs.
  const eligibleOKRs = useMemo(() => {
    if (!submittedOKRs) return [];
    return submittedOKRs.filter((okr) => {
      const inChain =
        (okr.approver1RoleAssignmentId != null &&
          myAssignmentIds.has(okr.approver1RoleAssignmentId)) ||
        (okr.approver2RoleAssignmentId != null &&
          myAssignmentIds.has(okr.approver2RoleAssignmentId));
      return inChain;
    });
  }, [submittedOKRs, myAssignmentIds]);

  // Client-side aspect filter
  const filteredOKRs = useMemo(() => {
    return eligibleOKRs.filter((o) => {
      if (selectedAspect !== "all" && o.okrAspect !== selectedAspect)
        return false;
      return true;
    });
  }, [eligibleOKRs, selectedAspect]);

  // Lookup maps
  const yearLabelMap = useMemo(
    () => new Map((kpiYears ?? []).map((y) => [y.kpiYearId, String(y.year)])),
    [kpiYears],
  );
  const orgNodeMap = useMemo(
    () => new Map((allNodes ?? []).map((n) => [n.nodeId, n.nodeName])),
    [allNodes],
  );

  // Stats breakdown by aspect
  const aspectBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of filteredOKRs) {
      const cfg = ASPECT_CONFIG[o.okrAspect];
      const label = cfg?.label ?? o.okrAspect;
      map.set(label, (map.get(label) ?? 0) + 1);
    }
    return map;
  }, [filteredOKRs]);

  // Dialog / sheet state
  const [detailOKR, setDetailOKR] = useState<OKR | null>(null);
  const [approveTarget, setApproveTarget] = useState<OKR | null>(null);
  const [reviseTarget, setReviseTarget] = useState<OKR | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRevising, setIsRevising] = useState(false);

  const handleApproveConfirm = async () => {
    if (!approveTarget) return;
    setIsApproving(true);
    try {
      await approveOKR.mutateAsync(approveTarget.okrId);
      toast.success("OKR approved successfully");
      setApproveTarget(null);
      setDetailOKR(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve OKR");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRevisionConfirm = async (comment: string) => {
    if (!reviseTarget) return;
    setIsRevising(true);
    try {
      await rejectOKR.mutateAsync({
        okrId: reviseTarget.okrId,
        revisionNotes: comment,
      });
      toast.success("Revision request sent — OKR returned to submitter");
      setReviseTarget(null);
      setDetailOKR(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to request revision",
      );
    } finally {
      setIsRevising(false);
    }
  };

  const isLoading = okrsLoading || nodesLoading;

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
                OKR Approval
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Review and approve OKR submissions from your direct reports
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
                filteredOKRs.length
              )
            }
            icon={<Target className="w-5 h-5" />}
          />
          <StatCard
            label="Total Submitted Company-wide"
            value={
              isLoading ? (
                <Skeleton className="h-7 w-10" />
              ) : (
                (submittedOKRs?.length ?? 0)
              )
            }
            icon={<Activity className="w-5 h-5" />}
          />
          <StatCard
            label="Aspects Represented"
            value={
              isLoading ? (
                <Skeleton className="h-7 w-10" />
              ) : (
                aspectBreakdown.size
              )
            }
            icon={<AlertTriangle className="w-5 h-5" />}
          />
        </div>

        {/* Aspect breakdown pills */}
        {aspectBreakdown.size > 0 && (
          <div className="flex flex-wrap gap-2">
            {Array.from(aspectBreakdown.entries()).map(([aspect, count]) => {
              const cfg = Object.values(ASPECT_CONFIG).find(
                (c) => c.label === aspect,
              );
              return (
                <span
                  key={aspect}
                  className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{
                    background: cfg?.bg ?? "oklch(0.93 0.012 252)",
                    color: cfg?.color ?? "oklch(0.42 0.055 258)",
                  }}
                >
                  {aspect} — {count}
                </span>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <FilterBar
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          selectedAspect={selectedAspect}
          onAspectChange={setSelectedAspect}
        />

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm text-foreground">
                Pending OKR Approvals
              </span>
              {!isLoading && filteredOKRs.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "oklch(0.94 0.03 145)",
                    color: "oklch(0.38 0.12 145)",
                  }}
                >
                  {filteredOKRs.length}
                </Badge>
              )}
            </div>
          </div>

          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {[
                    "Objective / Key Result",
                    "Aspect",
                    "Target",
                    "Target Date",
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
          ) : filteredOKRs.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {[
                    "Objective / Key Result",
                    "Aspect",
                    "Target",
                    "Target Date",
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
                  {filteredOKRs.map((okr, i) => {
                    const ownerNodeId =
                      roleAssignmentNodeMap.get(okr.ownerRoleAssignmentId) ??
                      null;
                    return (
                      <OKRApprovalRow
                        key={okr.okrId}
                        okr={okr}
                        ownerNodeName={
                          ownerNodeId
                            ? (orgNodeMap.get(ownerNodeId) ?? ownerNodeId)
                            : "—"
                        }
                        onView={setDetailOKR}
                        onApprove={setApproveTarget}
                        onRevise={setReviseTarget}
                        delay={i * 0.04}
                      />
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* OKR Detail Sheet */}
      {detailOKR && (
        <OKRDetailSheet
          okr={detailOKR}
          open={!!detailOKR}
          onClose={() => setDetailOKR(null)}
          allNodes={allNodes ?? []}
          ownerNodeId={
            roleAssignmentNodeMap.get(detailOKR.ownerRoleAssignmentId) ?? null
          }
          yearLabel={
            yearLabelMap.get(detailOKR.kpiYearId) ?? detailOKR.kpiYearId
          }
          onApprove={(id) => {
            const okr = filteredOKRs.find((o) => o.okrId === id);
            if (okr) setApproveTarget(okr);
          }}
          onRequestRevision={(id) => {
            const okr = filteredOKRs.find((o) => o.okrId === id);
            if (okr) setReviseTarget(okr);
          }}
          isProcessing={isApproving || isRevising}
        />
      )}

      {/* Approve Confirm Dialog */}
      <ApproveConfirmDialog
        open={!!approveTarget}
        okr={approveTarget}
        onConfirm={() => void handleApproveConfirm()}
        onCancel={() => setApproveTarget(null)}
        isApproving={isApproving}
      />

      {/* Revision Dialog */}
      <RevisionDialog
        open={!!reviseTarget}
        okr={reviseTarget}
        onConfirm={(comment) => void handleRevisionConfirm(comment)}
        onCancel={() => setReviseTarget(null)}
        isSubmitting={isRevising}
      />
    </motion.div>
  );
}
