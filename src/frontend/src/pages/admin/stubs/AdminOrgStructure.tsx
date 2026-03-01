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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useCreateOrganizationNode,
  useListOrganizationNodes,
  useUpdateOrganizationNode,
} from "@/hooks/useQueries";
import {
  Building2,
  ChevronRight,
  GitBranch,
  Info,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { OrgNode } from "../../../backend.d";
import { Variant_Division_Director_PresidentDirector_Department } from "../../../backend.d";

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeType = Variant_Division_Director_PresidentDirector_Department;
const NodeType = Variant_Division_Director_PresidentDirector_Department;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimestamp(ns: bigint): string {
  const ms = Number(ns) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const NODE_TYPE_ORDER: NodeType[] = [
  NodeType.PresidentDirector,
  NodeType.Director,
  NodeType.Division,
  NodeType.Department,
];

function getNodeTypeLabel(nodeType: NodeType): string {
  switch (nodeType) {
    case NodeType.PresidentDirector:
      return "President Director";
    case NodeType.Director:
      return "Director";
    case NodeType.Division:
      return "Division";
    case NodeType.Department:
      return "Department";
  }
}

function getParentNodeTypeLabel(nodeType: NodeType): string {
  switch (nodeType) {
    case NodeType.Director:
      return "President Director";
    case NodeType.Division:
      return "Director";
    case NodeType.Department:
      return "Division";
    default:
      return "Parent";
  }
}

function getParentNodeType(childType: NodeType): NodeType | null {
  switch (childType) {
    case NodeType.Director:
      return NodeType.PresidentDirector;
    case NodeType.Division:
      return NodeType.Director;
    case NodeType.Department:
      return NodeType.Division;
    default:
      return null;
  }
}

interface NodeBadgeStyleProps {
  bg: string;
  text: string;
  dot: string;
  iconBg: string;
  iconColor: string;
  indent: string;
  connectorColor: string;
}

function getNodeTypeStyle(nodeType: NodeType): NodeBadgeStyleProps {
  switch (nodeType) {
    case NodeType.PresidentDirector:
      return {
        bg: "oklch(0.24 0.065 258)",
        text: "oklch(0.88 0.06 252)",
        dot: "oklch(0.82 0.14 72)",
        iconBg: "oklch(0.30 0.08 258)",
        iconColor: "oklch(0.82 0.14 72)",
        indent: "0",
        connectorColor: "oklch(0.36 0.065 258)",
      };
    case NodeType.Director:
      return {
        bg: "oklch(0.28 0.075 280)",
        text: "oklch(0.88 0.06 280)",
        dot: "oklch(0.72 0.14 295)",
        iconBg: "oklch(0.34 0.08 280)",
        iconColor: "oklch(0.80 0.12 295)",
        indent: "28px",
        connectorColor: "oklch(0.40 0.065 280)",
      };
    case NodeType.Division:
      return {
        bg: "oklch(0.26 0.065 195)",
        text: "oklch(0.88 0.06 195)",
        dot: "oklch(0.72 0.14 185)",
        iconBg: "oklch(0.32 0.08 195)",
        iconColor: "oklch(0.80 0.12 185)",
        indent: "56px",
        connectorColor: "oklch(0.38 0.065 195)",
      };
    case NodeType.Department:
      return {
        bg: "oklch(0.28 0.065 65)",
        text: "oklch(0.92 0.06 72)",
        dot: "oklch(0.82 0.16 72)",
        iconBg: "oklch(0.34 0.085 65)",
        iconColor: "oklch(0.85 0.16 72)",
        indent: "84px",
        connectorColor: "oklch(0.40 0.065 65)",
      };
  }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: "default" | "indigo" | "teal" | "amber";
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
    indigo: {
      bg: "bg-card border border-border",
      iconBg: "oklch(0.92 0.04 280)",
      iconColor: "oklch(0.42 0.12 280)",
    },
    teal: {
      bg: "bg-card border border-border",
      iconBg: "oklch(0.92 0.04 195)",
      iconColor: "oklch(0.42 0.12 185)",
    },
    amber: {
      bg: "bg-card border border-border",
      iconBg: "oklch(0.94 0.05 72)",
      iconColor: "oklch(0.50 0.14 62)",
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

const SKELETON_IDS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6"];

function SkeletonRows() {
  return (
    <div className="divide-y divide-border">
      {SKELETON_IDS.map((id, i) => (
        <div
          key={id}
          className="flex items-center gap-3 px-5 py-3.5"
          style={{ paddingLeft: `${20 + i * 8}px` }}
        >
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-48 rounded" />
          <div className="ml-auto">
            <Skeleton className="h-7 w-7 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onAddPD }: { onAddPD: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "oklch(0.94 0.012 252)" }}
      >
        <GitBranch
          className="w-8 h-8"
          strokeWidth={1.5}
          style={{ color: "oklch(0.42 0.065 258)" }}
        />
      </div>
      <h3 className="font-display font-semibold text-base text-foreground mb-1">
        No organization structure yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        Start by adding a President Director. This is the root of your
        organization hierarchy.
      </p>
      <Button onClick={onAddPD} className="gap-2">
        <Plus className="w-4 h-4" />
        Add President Director
      </Button>
    </div>
  );
}

// ─── Add Node Dialog ──────────────────────────────────────────────────────────

interface AddNodeDialogProps {
  open: boolean;
  onClose: () => void;
  nodes: OrgNode[];
  isPending: boolean;
  onSubmit: (args: {
    nodeType: string;
    nodeName: string;
    parentNodeId: string | null;
  }) => void;
  preselectedType?: NodeType | null;
}

function AddNodeDialog({
  open,
  onClose,
  nodes,
  isPending,
  onSubmit,
  preselectedType,
}: AddNodeDialogProps) {
  const [nodeType, setNodeType] = useState<NodeType | "">(
    preselectedType ?? "",
  );
  const [nodeName, setNodeName] = useState("");
  const [parentNodeId, setParentNodeId] = useState("");
  const [errors, setErrors] = useState<{ nodeName?: string; parent?: string }>(
    {},
  );

  const hasPD = nodes.some((n) => n.nodeType === NodeType.PresidentDirector);

  const parentType = nodeType ? getParentNodeType(nodeType) : null;
  const parentCandidates = parentType
    ? nodes.filter((n) => n.nodeType === parentType)
    : [];
  const needsParent =
    nodeType !== "" && nodeType !== NodeType.PresidentDirector;

  const handleClose = () => {
    setNodeType(preselectedType ?? "");
    setNodeName("");
    setParentNodeId("");
    setErrors({});
    onClose();
  };

  const handleSubmit = () => {
    const errs: { nodeName?: string; parent?: string } = {};
    if (!nodeName.trim()) errs.nodeName = "Node name is required.";
    if (needsParent && !parentNodeId) {
      errs.parent = `Please select a ${parentType ? getNodeTypeLabel(parentType) : "parent"}.`;
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    onSubmit({
      nodeType: nodeType as string,
      nodeName: nodeName.trim(),
      parentNodeId: needsParent ? parentNodeId : null,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.94 0.012 252)" }}
            >
              <GitBranch
                className="w-5 h-5"
                style={{ color: "oklch(0.38 0.065 258)" }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                Add Organization Node
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Follow the hierarchy: PD → Director → Division → Department
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Node Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              Node Type
            </Label>
            <Select
              value={nodeType}
              onValueChange={(v) => {
                setNodeType(v as NodeType);
                setParentNodeId("");
                setErrors({});
              }}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select node type…" />
              </SelectTrigger>
              <SelectContent>
                <TooltipProvider delayDuration={100}>
                  {NODE_TYPE_ORDER.map((type) => {
                    const isPD = type === NodeType.PresidentDirector;
                    const disabled = isPD && hasPD;
                    return (
                      <Tooltip key={type} delayDuration={100}>
                        <TooltipTrigger asChild>
                          <div>
                            <SelectItem
                              value={type}
                              disabled={disabled}
                              className="text-sm"
                            >
                              {getNodeTypeLabel(type)}
                            </SelectItem>
                          </div>
                        </TooltipTrigger>
                        {disabled && (
                          <TooltipContent side="right" className="text-xs">
                            A President Director already exists
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>
              </SelectContent>
            </Select>
          </div>

          {/* Node Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              Node Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={nodeName}
              onChange={(e) => {
                setNodeName(e.target.value);
                if (errors.nodeName)
                  setErrors((p) => ({ ...p, nodeName: undefined }));
              }}
              placeholder="e.g. Finance Division"
              className="h-9 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            {errors.nodeName && (
              <p className="text-xs text-destructive">{errors.nodeName}</p>
            )}
          </div>

          {/* Parent Node (conditional) */}
          {needsParent && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Parent {parentType ? getNodeTypeLabel(parentType) : "Node"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              {parentCandidates.length === 0 ? (
                <div
                  className="rounded-lg px-4 py-3 flex gap-2 items-start"
                  style={{ background: "oklch(0.96 0.03 27 / 0.35)" }}
                >
                  <Info
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    style={{ color: "oklch(0.60 0.18 27)" }}
                  />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    No {parentType ? getNodeTypeLabel(parentType) : "parent"}{" "}
                    nodes exist yet. Create one first.
                  </p>
                </div>
              ) : (
                <>
                  <Select
                    value={parentNodeId}
                    onValueChange={(v) => {
                      setParentNodeId(v);
                      if (errors.parent)
                        setErrors((p) => ({ ...p, parent: undefined }));
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue
                        placeholder={`Select ${parentType ? getParentNodeTypeLabel(nodeType) : "parent"}…`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {parentCandidates.map((n) => (
                        <SelectItem
                          key={n.nodeId}
                          value={n.nodeId}
                          className="text-sm"
                        >
                          {n.nodeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.parent && (
                    <p className="text-xs text-destructive">{errors.parent}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isPending ||
              !nodeType ||
              (needsParent && parentCandidates.length === 0)
            }
            className="flex-1 gap-2"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isPending ? "Adding…" : "Add Node"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Node Dialog ─────────────────────────────────────────────────────────

interface EditNodeDialogProps {
  node: OrgNode | null;
  open: boolean;
  onClose: () => void;
  isPending: boolean;
  onSubmit: (args: { nodeId: string; nodeName: string }) => void;
}

function EditNodeDialog({
  node,
  open,
  onClose,
  isPending,
  onSubmit,
}: EditNodeDialogProps) {
  const [nodeName, setNodeName] = useState(node?.nodeName ?? "");
  const [error, setError] = useState("");

  // sync when dialog opens with new node
  const handleOpenChange = (o: boolean) => {
    if (o && node) setNodeName(node.nodeName);
    if (!o) {
      setError("");
      onClose();
    }
  };

  const handleSubmit = () => {
    if (!nodeName.trim()) {
      setError("Node name is required.");
      return;
    }
    if (!node) return;
    setError("");
    onSubmit({ nodeId: node.nodeId, nodeName: nodeName.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.94 0.04 280)" }}
            >
              <Pencil
                className="w-5 h-5"
                style={{ color: "oklch(0.42 0.12 280)" }}
              />
            </div>
            <div>
              <DialogTitle className="font-display text-base">
                Rename Node
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Only the name can be changed — type and parent are immutable
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {node && (
            <div
              className="rounded-lg px-4 py-2.5 flex items-center gap-2"
              style={{ background: "oklch(0.96 0.012 252)" }}
            >
              <Badge
                className="text-xs border-0 font-medium"
                style={{
                  background: getNodeTypeStyle(node.nodeType).iconBg,
                  color: getNodeTypeStyle(node.nodeType).text,
                }}
              >
                {getNodeTypeLabel(node.nodeType)}
              </Badge>
              <span className="text-sm text-muted-foreground truncate">
                {node.nodeName}
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              New Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={nodeName}
              onChange={(e) => {
                setNodeName(e.target.value);
                if (error) setError("");
              }}
              placeholder="Enter node name…"
              className="h-9 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 gap-2"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Pencil className="w-4 h-4" />
            )}
            {isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tree Node Row ────────────────────────────────────────────────────────────

interface NodeRowProps {
  node: OrgNode;
  level: number;
  animationDelay: number;
  onEdit: (node: OrgNode) => void;
}

function NodeRow({ node, level, animationDelay, onEdit }: NodeRowProps) {
  const style = getNodeTypeStyle(node.nodeType);
  const indentPx = level * 28;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: animationDelay, ease: "easeOut" }}
      className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors group"
      style={{ paddingLeft: `${20 + indentPx}px` }}
    >
      {/* Level connector hint */}
      {level > 0 && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {Array.from({ length: level }, (_, i) => `depth-${i}`).map((key) => (
            <ChevronRight
              key={key}
              className="w-3 h-3"
              style={{ color: style.connectorColor }}
            />
          ))}
        </div>
      )}

      {/* Icon */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: style.iconBg }}
      >
        {node.nodeType === NodeType.PresidentDirector && (
          <GitBranch
            className="w-3.5 h-3.5"
            style={{ color: style.iconColor }}
          />
        )}
        {node.nodeType === NodeType.Director && (
          <Users className="w-3.5 h-3.5" style={{ color: style.iconColor }} />
        )}
        {node.nodeType === NodeType.Division && (
          <Layers className="w-3.5 h-3.5" style={{ color: style.iconColor }} />
        )}
        {node.nodeType === NodeType.Department && (
          <Building2
            className="w-3.5 h-3.5"
            style={{ color: style.iconColor }}
          />
        )}
      </div>

      {/* Badge */}
      <Badge
        className="text-xs border-0 font-medium flex-shrink-0"
        style={{
          background: style.iconBg,
          color: style.text,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block"
          style={{ background: style.dot }}
        />
        {getNodeTypeLabel(node.nodeType)}
      </Badge>

      {/* Name */}
      <span className="font-medium text-sm text-foreground truncate flex-1">
        {node.nodeName}
      </span>

      {/* Created date */}
      <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
        {formatTimestamp(node.createdAt)}
      </span>

      {/* Edit button */}
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onEdit(node)}
              className="flex-shrink-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-muted"
              aria-label={`Rename ${node.nodeName}`}
            >
              <Pencil
                className="w-3.5 h-3.5"
                style={{ color: "oklch(0.52 0.022 258)" }}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            Rename node
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}

// ─── Tree Builder ─────────────────────────────────────────────────────────────

interface TreeNode {
  node: OrgNode;
  level: number;
  children: TreeNode[];
}

function buildTree(nodes: OrgNode[]): TreeNode[] {
  const byId = new Map<string, OrgNode>();
  for (const n of nodes) byId.set(n.nodeId, n);

  const roots: TreeNode[] = [];
  const treeNodes = new Map<string, TreeNode>();

  // Initialize all tree nodes
  for (const n of nodes) {
    treeNodes.set(n.nodeId, { node: n, level: 0, children: [] });
  }

  // Build parent-child relationships
  for (const n of nodes) {
    const treeNode = treeNodes.get(n.nodeId)!;
    if (n.parentNodeId) {
      const parent = treeNodes.get(n.parentNodeId);
      if (parent) {
        parent.children.push(treeNode);
        treeNode.level = parent.level + 1;
      } else {
        roots.push(treeNode);
      }
    } else {
      roots.push(treeNode);
    }
  }

  // Fix levels recursively
  function fixLevels(treeNode: TreeNode, level: number) {
    treeNode.level = level;
    for (const child of treeNode.children) {
      fixLevels(child, level + 1);
    }
  }
  for (const root of roots) fixLevels(root, 0);

  return roots;
}

function flattenTree(
  treeNodes: TreeNode[],
  result: { node: OrgNode; level: number }[] = [],
): { node: OrgNode; level: number }[] {
  // Sort by type order, then alphabetically within same level
  const sorted = [...treeNodes].sort((a, b) => {
    const ai = NODE_TYPE_ORDER.indexOf(a.node.nodeType);
    const bi = NODE_TYPE_ORDER.indexOf(b.node.nodeType);
    if (ai !== bi) return ai - bi;
    return a.node.nodeName.localeCompare(b.node.nodeName);
  });

  for (const tn of sorted) {
    result.push({ node: tn.node, level: tn.level });
    flattenTree(tn.children, result);
  }
  return result;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOrgStructure() {
  const { data: nodes, isLoading } = useListOrganizationNodes();
  const createMutation = useCreateOrganizationNode();
  const updateMutation = useUpdateOrganizationNode();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [preselectedType, setPreselectedType] = useState<NodeType | null>(null);
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null);

  const allNodes = nodes ?? [];
  const directorCount = allNodes.filter(
    (n) => n.nodeType === NodeType.Director,
  ).length;
  const divisionCount = allNodes.filter(
    (n) => n.nodeType === NodeType.Division,
  ).length;
  const departmentCount = allNodes.filter(
    (n) => n.nodeType === NodeType.Department,
  ).length;
  const totalCount = allNodes.length;

  const treeRoots = buildTree(allNodes);
  const flatNodes = flattenTree(treeRoots);

  const handleAddPD = () => {
    setPreselectedType(NodeType.PresidentDirector);
    setShowAddDialog(true);
  };

  const handleAddNode = () => {
    setPreselectedType(null);
    setShowAddDialog(true);
  };

  const handleCreate = async (args: {
    nodeType: string;
    nodeName: string;
    parentNodeId: string | null;
  }) => {
    try {
      await createMutation.mutateAsync(args);
      toast.success(
        `${getNodeTypeLabel(args.nodeType as NodeType)} "${args.nodeName}" added successfully`,
      );
      setShowAddDialog(false);
      setPreselectedType(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add node");
    }
  };

  const handleUpdate = async (args: { nodeId: string; nodeName: string }) => {
    try {
      await updateMutation.mutateAsync(args);
      toast.success("Node renamed successfully");
      setEditingNode(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rename node");
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
              <GitBranch
                className="w-5 h-5"
                style={{ color: "oklch(0.82 0.14 72)" }}
              />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground leading-tight">
                Organization Structure
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Define the company hierarchy: President Director, Directors,
                Divisions, and Departments.
              </p>
            </div>
          </div>
          <Button
            onClick={handleAddNode}
            disabled={createMutation.isPending}
            className="gap-2 flex-shrink-0"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add Node
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-8 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total Nodes"
            value={totalCount}
            icon={<GitBranch className="w-5 h-5" />}
            accent="default"
          />
          <StatCard
            label="Directors"
            value={directorCount}
            icon={<Users className="w-5 h-5" />}
            accent="indigo"
          />
          <StatCard
            label="Divisions"
            value={divisionCount}
            icon={<Layers className="w-5 h-5" />}
            accent="teal"
          />
          <StatCard
            label="Departments"
            value={departmentCount}
            icon={<Building2 className="w-5 h-5" />}
            accent="amber"
          />
        </div>

        {/* Tree Card */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm text-foreground">
                Hierarchy Tree
              </span>
              {!isLoading && allNodes.length > 0 && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: "oklch(0.93 0.012 252)",
                    color: "oklch(0.42 0.055 258)",
                  }}
                >
                  {allNodes.length}
                </span>
              )}
            </div>
            {/* Hierarchy info banner */}
            <div
              className="hidden md:flex items-center gap-2 rounded-lg px-3 py-1.5"
              style={{ background: "oklch(0.94 0.012 252)" }}
            >
              <Info
                className="w-3.5 h-3.5 flex-shrink-0"
                style={{ color: "oklch(0.48 0.055 258)" }}
              />
              <p
                className="text-xs font-mono"
                style={{ color: "oklch(0.48 0.042 258)" }}
              >
                PD → Director → Division → Department
              </p>
            </div>
          </div>

          {/* Mobile hierarchy hint */}
          <div
            className="md:hidden px-5 py-2.5 border-b border-border flex items-center gap-2"
            style={{ background: "oklch(0.96 0.01 252)" }}
          >
            <Info
              className="w-3.5 h-3.5 flex-shrink-0"
              style={{ color: "oklch(0.48 0.055 258)" }}
            />
            <p
              className="text-xs font-mono"
              style={{ color: "oklch(0.48 0.042 258)" }}
            >
              PD → Director → Division → Department — strict hierarchy order
            </p>
          </div>

          {/* Content */}
          {isLoading ? (
            <SkeletonRows />
          ) : allNodes.length === 0 ? (
            <EmptyState onAddPD={handleAddPD} />
          ) : (
            <div className="divide-y divide-border">
              <AnimatePresence initial={false}>
                {flatNodes.map(({ node, level }, i) => (
                  <NodeRow
                    key={node.nodeId}
                    node={node}
                    level={level}
                    animationDelay={i * 0.04}
                    onEdit={(n) => setEditingNode(n)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Add Node Dialog */}
      <AddNodeDialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setPreselectedType(null);
        }}
        nodes={allNodes}
        isPending={createMutation.isPending}
        onSubmit={handleCreate}
        preselectedType={preselectedType}
      />

      {/* Edit Node Dialog */}
      <EditNodeDialog
        node={editingNode}
        open={!!editingNode}
        onClose={() => setEditingNode(null)}
        isPending={updateMutation.isPending}
        onSubmit={handleUpdate}
      />
    </motion.div>
  );
}
