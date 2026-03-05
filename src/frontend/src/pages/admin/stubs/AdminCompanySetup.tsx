import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
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
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  useDeactivateCompany,
  useGetCompanyInfo,
  useListKPIYears,
  useMyProfile,
  useResetYearProgressData,
  useUpdateCompanyName,
} from "@/hooks/useQueries";
import { getExtendedActor } from "@/utils/backendExtended";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Copy,
  Edit2,
  Loader2,
  RefreshCw,
  ShieldOff,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { AuditLog } from "../../../backend.d";

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

function formatDate(ns: bigint): string {
  const ms = Number(ns) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function truncatePrincipal(p: { toString(): string } | string): string {
  const s = typeof p === "string" ? p : p.toString();
  if (s.length <= 16) return s;
  return `${s.slice(0, 10)}…${s.slice(-5)}`;
}

function principalStr(p: unknown): string {
  if (!p) return "";
  if (typeof p === "string") return p;
  if (typeof (p as { toString(): string }).toString === "function") {
    return (p as { toString(): string }).toString();
  }
  return String(p);
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  description,
  variant = "default",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant?: "default" | "warning" | "destructive";
}) {
  const iconStyles = {
    default: {
      bg: "oklch(0.26 0.065 258)",
      color: "oklch(0.82 0.14 72)",
    },
    warning: {
      bg: "oklch(0.88 0.12 72 / 0.20)",
      color: "oklch(0.62 0.18 72)",
    },
    destructive: {
      bg: "oklch(0.95 0.04 27)",
      color: "oklch(0.58 0.22 27)",
    },
  };

  const style = iconStyles[variant];

  return (
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: style.bg }}
        >
          <span style={{ color: style.color }}>{icon}</span>
        </div>
        <div>
          <CardTitle className="font-display text-base">{title}</CardTitle>
          <CardDescription className="text-xs mt-0.5">
            {description}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}

// ─── Company Information Section ──────────────────────────────────────────────

function CompanyInformationSection() {
  const { data: companyInfo, isLoading: isLoadingCompany } =
    useGetCompanyInfo();
  const { data: profile, isLoading: isLoadingProfile } = useMyProfile();
  const updateNameMutation = useUpdateCompanyName();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");

  const isLoading = isLoadingCompany || isLoadingProfile;

  // Determine company name — prefer companyInfo, fall back to profile
  const companyName =
    companyInfo?.companyName ??
    (profile ? `Company ${profile.companyId.slice(0, 8)}` : null);

  const isActive =
    companyInfo?.activeStatus !== undefined
      ? "Active" in companyInfo.activeStatus
      : true;

  const handleEditStart = () => {
    setEditedName(companyName ?? "");
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditedName("");
  };

  const handleEditSave = async () => {
    if (!editedName.trim()) {
      toast.error("Company name cannot be empty");
      return;
    }
    try {
      await updateNameMutation.mutateAsync(editedName.trim());
      toast.success("Company name updated");
      setIsEditing(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("not a function") ||
        msg.includes("has no method") ||
        msg.includes("is not a function")
      ) {
        toast.error(
          "This feature requires a backend update. Contact your administrator.",
        );
      } else {
        toast.error(msg || "Failed to update company name");
      }
    }
  };

  return (
    <Card className="border border-border">
      <SectionHeader
        icon={<Building2 className="w-5 h-5" />}
        title="Company Information"
        description="Manage your company profile and active status"
      />
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-6 w-40 rounded" />
            <Skeleton className="h-6 w-60 rounded" />
          </div>
        ) : (
          <>
            {/* Company Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Company Name
              </Label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    data-ocid="company-setup.input"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleEditSave();
                      if (e.key === "Escape") handleEditCancel();
                    }}
                    className="flex-1 font-medium"
                    autoFocus
                    maxLength={120}
                    placeholder="Enter company name"
                  />
                  <Button
                    data-ocid="company-setup.save_button"
                    size="sm"
                    onClick={() => void handleEditSave()}
                    disabled={updateNameMutation.isPending}
                    className="gap-1.5"
                  >
                    {updateNameMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Save
                  </Button>
                  <Button
                    data-ocid="company-setup.cancel_button"
                    size="sm"
                    variant="outline"
                    onClick={handleEditCancel}
                    disabled={updateNameMutation.isPending}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold text-foreground">
                    {companyName ?? "—"}
                  </span>
                  <Button
                    data-ocid="company-setup.edit_button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-7 text-xs"
                    onClick={handleEditStart}
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Status & Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                  Status
                </p>
                {isActive ? (
                  <Badge
                    className="gap-1.5 border-0 text-xs"
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
                    className="gap-1.5 border-0 text-xs"
                    style={{
                      background: "oklch(0.95 0.04 27)",
                      color: "oklch(0.55 0.22 27)",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "oklch(0.58 0.22 27)" }}
                    />
                    Inactive
                  </Badge>
                )}
              </div>

              {companyInfo?.createdAt !== undefined && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                    Created
                  </p>
                  <p className="text-sm text-foreground">
                    {formatDate(companyInfo.createdAt)}
                  </p>
                </div>
              )}

              {companyInfo?.createdBy !== undefined && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                    Created By
                  </p>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="font-mono text-xs text-muted-foreground cursor-default truncate">
                          {truncatePrincipal(
                            principalStr(companyInfo.createdBy),
                          )}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="font-mono text-xs max-w-xs break-all"
                      >
                        {principalStr(companyInfo.createdBy)}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Company Admin Section ────────────────────────────────────────────────────

function CompanyAdminSection() {
  const { data: profile, isLoading } = useMyProfile();
  const [copied, setCopied] = useState(false);

  const principalId = principalStr(profile?.principalId);
  const memberSince =
    profile?.roles?.[0]?.assignedAt !== undefined
      ? formatDate(profile.roles[0].assignedAt)
      : null;

  const handleCopy = async () => {
    if (!principalId) return;
    try {
      await navigator.clipboard.writeText(principalId);
      setCopied(true);
      toast.success("Principal ID copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <Card className="border border-border">
      <SectionHeader
        icon={<User className="w-5 h-5" />}
        title="Company Administrator"
        description="Your account details and principal identifier"
      />
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48 rounded" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-6 w-36 rounded" />
          </div>
        ) : (
          <>
            {/* Admin Name */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                Full Name
              </p>
              <p className="text-sm font-semibold text-foreground">
                {profile?.fullName ?? "—"}
              </p>
            </div>

            <Separator />

            {/* Principal ID */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                Principal ID
              </p>
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 border border-border"
                style={{ background: "oklch(0.97 0.004 252)" }}
              >
                <p className="font-mono text-xs text-muted-foreground flex-1 break-all min-w-0">
                  {principalId || "—"}
                </p>
                {principalId && (
                  <Button
                    data-ocid="company-setup.secondary_button"
                    size="sm"
                    variant="ghost"
                    className="flex-shrink-0 h-7 w-7 p-0"
                    onClick={() => void handleCopy()}
                    title="Copy Principal ID"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {copied ? (
                        <motion.span
                          key="check"
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.6, opacity: 0 }}
                          transition={{ duration: 0.12 }}
                        >
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="copy"
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.6, opacity: 0 }}
                          transition={{ duration: 0.12 }}
                        >
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                )}
              </div>
            </div>

            {/* Member Since */}
            {memberSince && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                    Member Since
                  </p>
                  <p className="text-sm text-foreground">{memberSince}</p>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Year-Based Reset Section ─────────────────────────────────────────────────

function YearBasedResetSection() {
  const { data: kpiYears, isLoading: isLoadingYears } = useListKPIYears();
  const { data: companyInfo } = useGetCompanyInfo();
  const { data: profile } = useMyProfile();
  const resetMutation = useResetYearProgressData();

  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [confirmText, setConfirmText] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Derive company name for confirmation
  const companyName = companyInfo?.companyName ?? (profile ? null : null);

  const selectedYear = kpiYears?.find((y) => y.kpiYearId === selectedYearId);
  const isConfirmed =
    !!companyName &&
    confirmText.trim().toLowerCase() === companyName.trim().toLowerCase();
  const canReset = !!selectedYearId && isConfirmed;

  const handleResetConfirm = async () => {
    if (!selectedYearId) return;
    try {
      await resetMutation.mutateAsync(selectedYearId);
      toast.success(
        `Progress data reset for year ${selectedYear?.year.toString() ?? selectedYearId}`,
      );
      setShowConfirmDialog(false);
      setSelectedYearId("");
      setConfirmText("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("not a function") ||
        msg.includes("has no method") ||
        msg.includes("is not a function")
      ) {
        toast.error("This feature requires a backend update.");
      } else {
        toast.error(msg || "Failed to reset progress data");
      }
      setShowConfirmDialog(false);
    }
  };

  return (
    <>
      <Card
        className="border"
        style={{ borderColor: "oklch(0.88 0.10 72 / 0.50)" }}
      >
        <SectionHeader
          icon={<RefreshCw className="w-5 h-5" />}
          title="Year-Based Data Reset"
          description="Reset KPI progress and OKR realization data for a specific year"
          variant="warning"
        />
        <CardContent className="space-y-5">
          {/* Warning Banner */}
          <div
            className="rounded-xl px-4 py-3 flex gap-3 items-start"
            style={{ background: "oklch(0.96 0.06 72 / 0.25)" }}
          >
            <AlertTriangle
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              style={{ color: "oklch(0.62 0.18 72)" }}
            />
            <p
              className="text-sm leading-relaxed"
              style={{ color: "oklch(0.48 0.12 72)" }}
            >
              This will permanently delete all{" "}
              <strong>KPI progress records</strong> and reset all{" "}
              <strong>OKR realization status to Backlog</strong> for the
              selected year. Organization structure, users, role assignments,
              and KPI/OKR definitions are preserved.
            </p>
          </div>

          {/* Year Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Select Year to Reset
            </Label>
            {isLoadingYears ? (
              <Skeleton className="h-10 w-full rounded-lg" />
            ) : (
              <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                <SelectTrigger
                  data-ocid="company-setup.select"
                  className="w-full"
                >
                  <SelectValue placeholder="Choose a KPI year…" />
                </SelectTrigger>
                <SelectContent>
                  {kpiYears && kpiYears.length > 0 ? (
                    kpiYears.map((year) => (
                      <SelectItem key={year.kpiYearId} value={year.kpiYearId}>
                        {year.year.toString()}{" "}
                        <span className="text-muted-foreground text-xs ml-1">
                          ({year.status})
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__none" disabled>
                      No years available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Confirmation Input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Type your company name to confirm
            </Label>
            {companyName ? (
              <p className="text-xs text-muted-foreground mb-1">
                Type exactly:{" "}
                <code
                  className="font-mono font-semibold px-1 py-0.5 rounded"
                  style={{
                    background: "oklch(0.93 0.008 252)",
                    color: "oklch(0.38 0.065 258)",
                  }}
                >
                  {companyName}
                </code>
              </p>
            ) : null}
            <Input
              data-ocid="company-setup.input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Enter company name to confirm"
              className="w-full"
            />
          </div>

          {/* Reset Button */}
          <Button
            data-ocid="company-setup.delete_button"
            variant="outline"
            disabled={!canReset || resetMutation.isPending}
            onClick={() => setShowConfirmDialog(true)}
            className="gap-2"
            style={
              canReset
                ? {
                    borderColor: "oklch(0.72 0.16 72 / 0.6)",
                    color: "oklch(0.48 0.14 72)",
                  }
                : {}
            }
          >
            {resetMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Reset Year Progress Data
          </Button>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent data-ocid="company-setup.dialog" className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(0.96 0.06 72 / 0.35)" }}
              >
                <AlertTriangle
                  className="w-5 h-5"
                  style={{ color: "oklch(0.62 0.18 72)" }}
                />
              </div>
              <div>
                <DialogTitle className="font-display text-base">
                  Confirm Data Reset
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  This action is permanent and cannot be undone
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div
            className="rounded-xl px-4 py-3 space-y-1.5"
            style={{ background: "oklch(0.97 0.004 252)" }}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Year</span>
              <span className="font-semibold text-foreground">
                {selectedYear?.year.toString() ?? selectedYearId}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Scope</span>
              <span className="font-semibold text-foreground">
                KPI Progress + OKR Realization
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            All KPI progress records and OKR realization statuses for{" "}
            <strong className="text-foreground">
              {selectedYear?.year.toString()}
            </strong>{" "}
            will be permanently deleted. Definitions, structure, and user data
            are preserved.
          </p>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              data-ocid="company-setup.cancel_button"
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={resetMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              data-ocid="company-setup.confirm_button"
              disabled={resetMutation.isPending}
              onClick={() => void handleResetConfirm()}
              className="flex-1 gap-2"
              style={{
                background: "oklch(0.62 0.18 72)",
                color: "oklch(0.12 0.025 258)",
              }}
            >
              {resetMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Confirm Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Deactivate Company Section ───────────────────────────────────────────────

function DeactivateCompanySection() {
  const { data: companyInfo } = useGetCompanyInfo();
  const { data: profile } = useMyProfile();
  const deactivateMutation = useDeactivateCompany();
  const navigate = useNavigate();

  const [confirmText, setConfirmText] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const companyName = companyInfo?.companyName ?? (profile ? null : null);

  const isConfirmed =
    !!companyName &&
    confirmText.trim().toLowerCase() === companyName.trim().toLowerCase();

  const handleDeactivateConfirm = async () => {
    try {
      await deactivateMutation.mutateAsync();
      toast.success("Company deactivated");
      setShowConfirmDialog(false);
      void navigate({ to: "/onboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("not a function") ||
        msg.includes("has no method") ||
        msg.includes("is not a function")
      ) {
        toast.error("This feature requires a backend update.");
      } else {
        toast.error(msg || "Failed to deactivate company");
      }
      setShowConfirmDialog(false);
    }
  };

  return (
    <>
      <Card
        className="border"
        style={{ borderColor: "oklch(0.58 0.22 27 / 0.30)" }}
      >
        <SectionHeader
          icon={<ShieldOff className="w-5 h-5" />}
          title="Deactivate Company"
          description="Permanently block all user access to this company's workspace"
          variant="destructive"
        />
        <CardContent className="space-y-5">
          {/* Warning Banner */}
          <div
            className="rounded-xl px-4 py-3 flex gap-3 items-start"
            style={{ background: "oklch(0.98 0.02 27 / 0.35)" }}
          >
            <AlertTriangle
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              style={{ color: "oklch(0.58 0.22 27)" }}
            />
            <p
              className="text-sm leading-relaxed"
              style={{ color: "oklch(0.45 0.15 27)" }}
            >
              Deactivating the company will{" "}
              <strong>block all user access</strong> to the system. This action
              can be reversed by contacting support. All data is preserved.
            </p>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Type your company name to confirm
            </Label>
            {companyName ? (
              <p className="text-xs text-muted-foreground mb-1">
                Type exactly:{" "}
                <code
                  className="font-mono font-semibold px-1 py-0.5 rounded"
                  style={{
                    background: "oklch(0.93 0.008 252)",
                    color: "oklch(0.38 0.065 258)",
                  }}
                >
                  {companyName}
                </code>
              </p>
            ) : null}
            <Input
              data-ocid="company-setup.input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Enter company name to confirm"
              className="w-full"
              style={
                confirmText && !isConfirmed
                  ? { borderColor: "oklch(0.68 0.18 27 / 0.60)" }
                  : {}
              }
            />
          </div>

          {/* Deactivate Button */}
          <Button
            data-ocid="company-setup.delete_button"
            variant="destructive"
            disabled={!isConfirmed || deactivateMutation.isPending}
            onClick={() => setShowConfirmDialog(true)}
            className="gap-2"
          >
            {deactivateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldOff className="w-4 h-4" />
            )}
            Deactivate Company
          </Button>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent data-ocid="company-setup.dialog" className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(0.95 0.04 27)" }}
              >
                <ShieldOff
                  className="w-5 h-5"
                  style={{ color: "oklch(0.58 0.22 27)" }}
                />
              </div>
              <div>
                <DialogTitle className="font-display text-base">
                  Deactivate Company?
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  All users will immediately lose access
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Are you sure you want to deactivate{" "}
            <strong className="text-foreground">{companyName}</strong>? All
            users will be blocked from accessing the workspace. Contact support
            to reverse this action.
          </p>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              data-ocid="company-setup.cancel_button"
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={deactivateMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              data-ocid="company-setup.confirm_button"
              variant="destructive"
              disabled={deactivateMutation.isPending}
              onClick={() => void handleDeactivateConfirm()}
              className="flex-1 gap-2"
            >
              {deactivateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldOff className="w-4 h-4" />
              )}
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Audit Log Section ────────────────────────────────────────────────────────

const ENTITY_TYPES = [
  "All",
  "Company",
  "User",
  "OrgNode",
  "KPI",
  "OKR",
  "RoleAssignment",
  "RegistrationCode",
] as const;

type EntityTypeFilter = (typeof ENTITY_TYPES)[number];

const PAGE_SIZE = 20;

function AuditLogSection() {
  const { identity } = useInternetIdentity();
  const { isFetching: isActorFetching } = useActor();
  const [entityFilter, setEntityFilter] = useState<EntityTypeFilter>("All");
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch logs when actor is ready or filter changes
  const fetchLogs = useMemo(
    () => async () => {
      if (!identity || isActorFetching) return;
      setIsLoading(true);
      try {
        const actor = await getExtendedActor(identity);
        const filter = entityFilter === "All" ? [] : [entityFilter];
        const raw = await actor.getAuditLogs(filter as [string] | [], []);
        // Sort newest first; cast raw performedBy (unknown) to Principal for display
        const sorted = [...raw]
          .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
          .map((r) => ({
            ...r,
            performedBy: r.performedBy as AuditLog["performedBy"],
          }));
        setLogs(sorted);
        setPage(1);
      } catch {
        toast.error("Failed to load audit logs");
      } finally {
        setIsLoading(false);
        setHasFetched(true);
      }
    },
    [identity, isActorFetching, entityFilter],
  );

  // Auto-fetch on mount and filter change
  const [lastFilter, setLastFilter] = useState<EntityTypeFilter | null>(null);
  if (!hasFetched || lastFilter !== entityFilter) {
    setLastFilter(entityFilter);
    void fetchLogs();
  }

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const pagedLogs = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const entityTypeColor: Record<string, { bg: string; text: string }> = {
    Company: {
      bg: "oklch(0.94 0.03 258)",
      text: "oklch(0.36 0.085 258)",
    },
    User: { bg: "oklch(0.94 0.05 195)", text: "oklch(0.35 0.12 195)" },
    OrgNode: { bg: "oklch(0.94 0.05 258)", text: "oklch(0.36 0.09 258)" },
    KPI: { bg: "oklch(0.92 0.06 145)", text: "oklch(0.38 0.14 145)" },
    OKR: { bg: "oklch(0.94 0.04 72)", text: "oklch(0.42 0.12 72)" },
    RoleAssignment: {
      bg: "oklch(0.94 0.03 310)",
      text: "oklch(0.40 0.10 310)",
    },
    RegistrationCode: {
      bg: "oklch(0.93 0.008 252)",
      text: "oklch(0.48 0.022 258)",
    },
  };

  return (
    <Card className="border border-border">
      <SectionHeader
        icon={<ClipboardList className="w-5 h-5" />}
        title="Audit Log"
        description="Track all actions performed in your company workspace"
      />
      <CardContent className="space-y-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {ENTITY_TYPES.map((et) => (
            <button
              key={et}
              type="button"
              data-ocid="company-setup.tab"
              onClick={() => setEntityFilter(et)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-150"
              style={
                entityFilter === et
                  ? {
                      background: "oklch(0.26 0.065 258)",
                      color: "oklch(0.95 0.006 252)",
                    }
                  : {
                      background: "oklch(0.94 0.012 252)",
                      color: "oklch(0.48 0.032 258)",
                    }
              }
            >
              {et}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex gap-3"
                  data-ocid="company-setup.loading_state"
                >
                  <Skeleton className="h-5 w-32 rounded" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-40 rounded" />
                  <Skeleton className="h-5 w-28 rounded" />
                  <Skeleton className="h-5 w-32 rounded" />
                </div>
              ))}
            </div>
          ) : !hasFetched || logs.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-14 px-8 text-center"
              data-ocid="company-setup.empty_state"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "oklch(0.94 0.012 252)" }}
              >
                <ClipboardList
                  className="w-7 h-7"
                  strokeWidth={1.5}
                  style={{ color: "oklch(0.52 0.065 258)" }}
                />
              </div>
              <p className="text-sm font-medium text-foreground">
                No audit logs found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {entityFilter !== "All"
                  ? `No logs for entity type "${entityFilter}"`
                  : "System actions will appear here as you use the platform"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[18%]">
                    Timestamp
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[15%]">
                    Entity Type
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[20%]">
                    Action
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[22%]">
                    Entity ID
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[25%]">
                    Performed By
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {pagedLogs.map((log, i) => {
                    const etColor = entityTypeColor[log.entityType] ?? {
                      bg: "oklch(0.93 0.008 252)",
                      text: "oklch(0.48 0.022 258)",
                    };
                    return (
                      <motion.tr
                        key={log.auditId}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.2,
                          delay: i * 0.025,
                          ease: "easeOut",
                        }}
                        className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                        data-ocid={`company-setup.item.${(page - 1) * PAGE_SIZE + i + 1}`}
                      >
                        <TableCell className="text-xs text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              background: etColor.bg,
                              color: etColor.text,
                            }}
                          >
                            {log.entityType}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-foreground font-medium">
                          {log.action}
                        </TableCell>
                        <TableCell>
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-mono text-xs text-muted-foreground cursor-default">
                                  {log.entityId.length > 18
                                    ? `${log.entityId.slice(0, 14)}…`
                                    : log.entityId}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="font-mono text-xs max-w-xs break-all"
                              >
                                {log.entityId}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-mono text-xs text-muted-foreground cursor-default">
                                  {truncatePrincipal(log.performedBy)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="font-mono text-xs max-w-xs break-all"
                              >
                                {log.performedBy.toString()}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && logs.length > PAGE_SIZE && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, logs.length)} of {logs.length} entries
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                data-ocid="company-setup.pagination_prev"
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                {page} / {totalPages}
              </span>
              <Button
                data-ocid="company-setup.pagination_next"
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCompanySetup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex-1 flex flex-col"
    >
      {/* Page Header */}
      <div className="border-b border-border bg-card px-8 py-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "oklch(0.26 0.065 258)" }}
          >
            <Building2
              className="w-5 h-5"
              style={{ color: "oklch(0.82 0.14 72)" }}
            />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground leading-tight">
              Company Setup
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage your company profile, security settings, and data
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-8 space-y-6 max-w-4xl w-full">
        {/* Section 1 — Company Information */}
        <CompanyInformationSection />

        {/* Section 2 — Company Admin */}
        <CompanyAdminSection />

        {/* Section 3 — Year-Based Reset */}
        <YearBasedResetSection />

        {/* Section 4 — Deactivate Company */}
        <DeactivateCompanySection />

        {/* Section 5 — Audit Log (full width) */}
        <AuditLogSection />
      </div>
    </motion.div>
  );
}
