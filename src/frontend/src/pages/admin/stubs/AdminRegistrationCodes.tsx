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
  useDeactivateRegistrationCode,
  useGenerateRegistrationCode,
  useListRegistrationCodes,
} from "@/hooks/useQueries";
import {
  AlertTriangle,
  Check,
  Copy,
  Hash,
  KeyRound,
  Loader2,
  Plus,
  ShieldOff,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { RegistrationCodeRecord } from "../../../backend.d";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
            <Skeleton className="h-5 w-48 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-32 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-40 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-24 rounded" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  onGenerate,
  isLoading,
}: { onGenerate: () => void; isLoading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "oklch(0.94 0.012 252)" }}
      >
        <KeyRound
          className="w-8 h-8"
          strokeWidth={1.5}
          style={{ color: "oklch(0.52 0.065 258)" }}
        />
      </div>
      <h3 className="font-display font-semibold text-base text-foreground mb-1">
        No registration codes yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        Generate single-use codes to invite employees to join your company
        securely via Internet Identity.
      </p>
      <Button onClick={onGenerate} disabled={isLoading} className="gap-2">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        Generate your first code
      </Button>
    </div>
  );
}

// ─── Generate Success Dialog ──────────────────────────────────────────────────

interface GenerateSuccessDialogProps {
  code: string | null;
  open: boolean;
  onClose: () => void;
}

function GenerateSuccessDialog({
  code,
  open,
  onClose,
}: GenerateSuccessDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy. Please copy it manually.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.92 0.06 145)" }}
            >
              <KeyRound
                className="w-5 h-5"
                style={{ color: "oklch(0.42 0.14 145)" }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                Registration Code Generated
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Share this with the employee you want to onboard
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Code display */}
        <div
          className="rounded-xl px-5 py-4 text-center relative"
          style={{ background: "oklch(0.96 0.012 252)" }}
        >
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium">
            Registration Code
          </p>
          <p
            className="font-mono text-xl font-bold tracking-wider break-all select-all"
            style={{ color: "oklch(0.22 0.058 258)" }}
          >
            {code}
          </p>
        </div>

        {/* Copy button */}
        <Button variant="outline" className="w-full gap-2" onClick={handleCopy}>
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-green-600" />
                Copied!
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Code
              </motion.span>
            )}
          </AnimatePresence>
        </Button>

        {/* Instruction */}
        <div
          className="rounded-lg px-4 py-3 flex gap-3 items-start"
          style={{ background: "oklch(0.96 0.03 72 / 0.35)" }}
        >
          <Sparkles
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            style={{ color: "oklch(0.62 0.14 72)" }}
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            This code can only be used{" "}
            <strong className="text-foreground">once</strong>. Once an employee
            registers with it, the code is automatically deactivated. Share it
            securely through a trusted channel.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Deactivate Confirm Dialog ────────────────────────────────────────────────

interface DeactivateDialogProps {
  code: string | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function DeactivateDialog({
  code,
  open,
  onClose,
  onConfirm,
  isLoading,
}: DeactivateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.95 0.04 27)" }}
            >
              <AlertTriangle
                className="w-5 h-5"
                style={{ color: "oklch(0.58 0.22 27)" }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                Deactivate Code?
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {code && (
          <div
            className="rounded-lg px-4 py-2.5 text-center"
            style={{ background: "oklch(0.96 0.012 252)" }}
          >
            <p className="font-mono text-sm font-semibold text-foreground break-all">
              {code}
            </p>
          </div>
        )}

        <p className="text-sm text-muted-foreground leading-relaxed">
          Any employee holding this code will no longer be able to use it to
          join the company.
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
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldOff className="w-4 h-4" />
            )}
            Deactivate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Code Row ─────────────────────────────────────────────────────────────────

interface CodeRowProps {
  record: RegistrationCodeRecord;
  onDeactivate: (code: string) => void;
  animationDelay: number;
}

function CodeRow({ record, onDeactivate, animationDelay }: CodeRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(record.code);
      setCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: animationDelay, ease: "easeOut" }}
      className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
    >
      {/* Code */}
      <TableCell>
        <div className="flex items-center gap-2">
          <code
            className="font-mono text-sm font-semibold tracking-wide"
            style={{ color: "oklch(0.28 0.065 258)" }}
          >
            {record.code}
          </code>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-shrink-0 p-1 rounded-md transition-colors hover:bg-muted"
                  aria-label="Copy code"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {copied ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0.6 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.6 }}
                        transition={{ duration: 0.12 }}
                      >
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ scale: 0.6 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.6 }}
                        transition={{ duration: 0.12 }}
                      >
                        <Copy
                          className="w-3.5 h-3.5"
                          style={{ color: "oklch(0.52 0.022 258)" }}
                        />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Copy code</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        {record.isActive ? (
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
            Active
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
            Used
          </Badge>
        )}
      </TableCell>

      {/* Created At */}
      <TableCell className="text-sm text-muted-foreground">
        {formatTimestamp(record.createdAt)}
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
                {truncatePrincipal(record.createdBy)}
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="font-mono text-xs max-w-xs break-all"
            >
              {record.createdBy.toString()}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* Actions */}
      <TableCell>
        {record.isActive ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8 border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/60"
            onClick={() => onDeactivate(record.code)}
          >
            <ShieldOff className="w-3.5 h-3.5" />
            Deactivate
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </TableCell>
    </motion.tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminRegistrationCodes() {
  const { data: codes, isLoading } = useListRegistrationCodes();
  const generateMutation = useGenerateRegistrationCode();
  const deactivateMutation = useDeactivateRegistrationCode();

  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [deactivatingCode, setDeactivatingCode] = useState<string | null>(null);

  const totalCodes = codes?.length ?? 0;
  const activeCodes = codes?.filter((c) => c.isActive).length ?? 0;
  const usedCodes = codes?.filter((c) => !c.isActive).length ?? 0;

  const handleGenerate = async () => {
    try {
      const code = await generateMutation.mutateAsync();
      setGeneratedCode(code);
      setShowSuccessDialog(true);
      toast.success("Registration code generated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate code",
      );
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivatingCode) return;
    try {
      await deactivateMutation.mutateAsync(deactivatingCode);
      toast.success("Code deactivated successfully");
      setDeactivatingCode(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to deactivate code",
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
              <KeyRound
                className="w-5 h-5"
                style={{ color: "oklch(0.82 0.14 72)" }}
              />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground leading-tight">
                Registration Codes
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Generate and manage single-use codes for employee onboarding
              </p>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="gap-2 flex-shrink-0"
          >
            {generateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {generateMutation.isPending ? "Generating…" : "Generate Code"}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-8 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Codes"
            value={totalCodes}
            icon={<Hash className="w-5 h-5" />}
            accent="default"
          />
          <StatCard
            label="Active Codes"
            value={activeCodes}
            icon={<KeyRound className="w-5 h-5" />}
            accent="green"
          />
          <StatCard
            label="Used Codes"
            value={usedCodes}
            icon={<ShieldOff className="w-5 h-5" />}
            accent="gray"
          />
        </div>

        {/* Table Card */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Table header bar */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm text-foreground">
                All Codes
              </span>
              {!isLoading && codes && codes.length > 0 && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: "oklch(0.93 0.012 252)",
                    color: "oklch(0.42 0.055 258)",
                  }}
                >
                  {codes.length}
                </span>
              )}
            </div>
            {!isLoading && codes && codes.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {activeCodes} active · {usedCodes} used
              </p>
            )}
          </div>

          {/* Table or empty state */}
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[35%]">
                    Code
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[12%]">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[20%]">
                    Created
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[20%]">
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
          ) : !codes || codes.length === 0 ? (
            <EmptyState
              onGenerate={handleGenerate}
              isLoading={generateMutation.isPending}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[35%]">
                    Code
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[12%]">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[20%]">
                    Created
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[20%]">
                    Created By
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[13%]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {codes.map((record, i) => (
                    <CodeRow
                      key={record.code}
                      record={record}
                      onDeactivate={(code) => setDeactivatingCode(code)}
                      animationDelay={i * 0.04}
                    />
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Generate Success Dialog */}
      <GenerateSuccessDialog
        code={generatedCode}
        open={showSuccessDialog}
        onClose={() => {
          setShowSuccessDialog(false);
          setGeneratedCode(null);
        }}
      />

      {/* Deactivate Confirm Dialog */}
      <DeactivateDialog
        code={deactivatingCode}
        open={!!deactivatingCode}
        onClose={() => setDeactivatingCode(null)}
        onConfirm={handleDeactivateConfirm}
        isLoading={deactivateMutation.isPending}
      />
    </motion.div>
  );
}
