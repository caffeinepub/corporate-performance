import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type {
  BSCAspect,
  KPI,
  KPIYear,
  MyProfile,
  OKR,
  OrgNode,
  RegistrationCodeRecord,
  RoleAssignment,
  StrategicObjective,
  User,
} from "../backend.d";
import type { Variant_Division_Director_PresidentDirector_Department } from "../backend.d";
import type {
  Variant_Approved_Draft_Rejected_Submitted_Revised,
  Variant_Approved_Draft_Submitted_Revised,
  Variant_Done_OnProgress_Backlog_CarriedForNextYear_Pending,
  Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual,
  Variant_Open_Closed,
  Variant_People_Tools_Process,
} from "../backend.d";
import {
  type KPIProgressData,
  type KPIProgressRecord,
  type KPITargetRecord,
  clearActorCache,
  fromOptText,
  getExtendedActor,
  toOptText,
} from "../utils/backendExtended";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// Re-export types so existing imports keep working
export type { KPIProgressData, KPIProgressRecord, KPITargetRecord };

// ─── Candid Variant Normalizer ────────────────────────────────────────────────
// Candid variants are returned as objects like { PresidentDirector: null }.
// This extracts the key so we can compare against the TypeScript enum string values.
function fromCandidVariant<T extends string>(v: unknown): T {
  if (typeof v === "string") return v as T;
  if (v !== null && typeof v === "object") {
    const keys = Object.keys(v as Record<string, unknown>);
    if (keys.length === 1) return keys[0] as T;
  }
  throw new Error(`Unexpected Candid variant: ${JSON.stringify(v)}`);
}

// Unwrap Opt([T] | []) → T | undefined
function fromOpt<T>(opt: [T] | []): T | undefined {
  return opt.length > 0 ? opt[0] : undefined;
}

// ─── Normalizers for raw Candid types → backend.d.ts types ───────────────────

function normalizeOrgNode(raw: {
  nodeId: string;
  companyId: string;
  nodeType: Record<string, null>;
  nodeName: string;
  parentNodeId: [string] | [];
  createdAt: bigint;
  createdBy: unknown;
  updatedAt: bigint;
  updatedBy: unknown;
}): OrgNode {
  return {
    nodeId: raw.nodeId,
    companyId: raw.companyId,
    nodeType:
      fromCandidVariant<Variant_Division_Director_PresidentDirector_Department>(
        raw.nodeType,
      ),
    nodeName: raw.nodeName,
    parentNodeId: fromOpt(raw.parentNodeId),
    createdAt: raw.createdAt,
    createdBy: raw.createdBy as OrgNode["createdBy"],
    updatedAt: raw.updatedAt,
    updatedBy: raw.updatedBy as OrgNode["updatedBy"],
  };
}

function normalizeRoleAssignment(raw: {
  assignmentId: string;
  userId: string;
  companyId: string;
  roleType: Record<string, null>;
  orgNodeId: [string] | [];
  activeStatus: boolean;
  ultimateParentId: [string] | [];
  grandParentId: [string] | [];
  parentId: [string] | [];
  assignedAt: bigint;
  assignedBy: unknown;
}): RoleAssignment {
  return {
    assignmentId: raw.assignmentId,
    userId: raw.userId,
    companyId: raw.companyId,
    roleType: fromCandidVariant(raw.roleType),
    orgNodeId: fromOpt(raw.orgNodeId),
    activeStatus: raw.activeStatus,
    ultimateParentId: fromOpt(raw.ultimateParentId),
    grandParentId: fromOpt(raw.grandParentId),
    parentId: fromOpt(raw.parentId),
    assignedAt: raw.assignedAt,
    assignedBy: raw.assignedBy as RoleAssignment["assignedBy"],
  };
}

function normalizeUser(raw: {
  userId: string;
  principalId: unknown;
  companyId: string;
  fullName: string;
  emailAddress: [string] | [];
  registrationCodeUsed: [string] | [];
  status: Record<string, null>;
  createdAt: bigint;
  createdBy: unknown;
}): User {
  return {
    userId: raw.userId,
    principalId: raw.principalId as User["principalId"],
    companyId: raw.companyId,
    fullName: raw.fullName,
    emailAddress: fromOpt(raw.emailAddress),
    registrationCodeUsed: fromOpt(raw.registrationCodeUsed),
    status: fromCandidVariant(raw.status),
    createdAt: raw.createdAt,
    createdBy: raw.createdBy as User["createdBy"],
  };
}

function normalizeKPIYear(raw: {
  kpiYearId: string;
  companyId: string;
  year: bigint;
  status: Record<string, null>;
  createdAt: bigint;
  createdBy: unknown;
}): KPIYear {
  return {
    kpiYearId: raw.kpiYearId,
    companyId: raw.companyId,
    year: raw.year,
    status: fromCandidVariant<Variant_Open_Closed>(raw.status),
    createdAt: raw.createdAt,
    createdBy: raw.createdBy as KPIYear["createdBy"],
  };
}

function normalizeBSCAspect(raw: {
  aspectId: string;
  companyId: string;
  aspectName: string;
  createdAt: bigint;
  createdBy: unknown;
}): BSCAspect {
  return {
    aspectId: raw.aspectId,
    companyId: raw.companyId,
    aspectName: raw.aspectName,
    createdAt: raw.createdAt,
    createdBy: raw.createdBy as BSCAspect["createdBy"],
  };
}

function normalizeStrategicObjective(raw: {
  objectiveId: string;
  companyId: string;
  bscAspectId: string;
  objectiveName: string;
  createdAt: bigint;
  createdBy: unknown;
}): StrategicObjective {
  return {
    objectiveId: raw.objectiveId,
    companyId: raw.companyId,
    bscAspectId: raw.bscAspectId,
    objectiveName: raw.objectiveName,
    createdAt: raw.createdAt,
    createdBy: raw.createdBy as StrategicObjective["createdBy"],
  };
}

function normalizeRegistrationCode(raw: {
  code: string;
  companyId: string;
  isActive: boolean;
  createdAt: bigint;
  createdBy: unknown;
}): RegistrationCodeRecord {
  return {
    code: raw.code,
    companyId: raw.companyId,
    isActive: raw.isActive,
    createdAt: raw.createdAt,
    createdBy: raw.createdBy as RegistrationCodeRecord["createdBy"],
  };
}

function normalizeKPI(raw: {
  kpiId: string;
  companyId: string;
  ownerRoleAssignmentId: string;
  organizationNodeId: string;
  approverUserId: [string] | [];
  kpiYearId: string;
  bscAspectId: string;
  strategicObjectiveId: string;
  kpiMeasurement: string;
  kpiPeriod: Record<string, null>;
  kpiWeight: number;
  kpiStatus: Record<string, null>;
  revisionNotes: [string] | [];
  createdAt: bigint;
  createdBy: unknown;
  updatedAt: bigint;
  updatedBy: unknown;
}): KPI {
  return {
    kpiId: raw.kpiId,
    companyId: raw.companyId,
    ownerRoleAssignmentId: raw.ownerRoleAssignmentId,
    organizationNodeId: raw.organizationNodeId,
    approverUserId: fromOpt(raw.approverUserId),
    kpiYearId: raw.kpiYearId,
    bscAspectId: raw.bscAspectId,
    strategicObjectiveId: raw.strategicObjectiveId,
    kpiMeasurement: raw.kpiMeasurement,
    kpiPeriod:
      fromCandidVariant<Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual>(
        raw.kpiPeriod,
      ),
    kpiWeight: raw.kpiWeight,
    kpiStatus: fromCandidVariant<Variant_Approved_Draft_Submitted_Revised>(
      raw.kpiStatus,
    ),
    revisionNotes: fromOpt(raw.revisionNotes),
    createdAt: raw.createdAt,
    createdBy: raw.createdBy as KPI["createdBy"],
    updatedAt: raw.updatedAt,
    updatedBy: raw.updatedBy as KPI["updatedBy"],
  };
}

function normalizeOKR(raw: {
  okrId: string;
  companyId: string;
  kpiYearId: string;
  ownerRoleAssignmentId: string;
  approver1RoleAssignmentId: [string] | [];
  approver2RoleAssignmentId: [string] | [];
  okrStatus: Record<string, null>;
  okrAspect: Record<string, null>;
  objective: string;
  keyResult: string;
  targetValue: number;
  initialTargetDate: string;
  revisedTargetDate: [string] | [];
  realization: Record<string, null>;
  notes: [string] | [];
  createdAt: bigint;
  createdBy: unknown;
}): OKR {
  return {
    okrId: raw.okrId,
    companyId: raw.companyId,
    kpiYearId: raw.kpiYearId,
    ownerRoleAssignmentId: raw.ownerRoleAssignmentId,
    approver1RoleAssignmentId: fromOpt(raw.approver1RoleAssignmentId),
    approver2RoleAssignmentId: fromOpt(raw.approver2RoleAssignmentId),
    okrStatus:
      fromCandidVariant<Variant_Approved_Draft_Rejected_Submitted_Revised>(
        raw.okrStatus,
      ),
    okrAspect: fromCandidVariant<Variant_People_Tools_Process>(raw.okrAspect),
    objective: raw.objective,
    keyResult: raw.keyResult,
    targetValue: raw.targetValue,
    initialTargetDate: raw.initialTargetDate,
    revisedTargetDate: fromOpt(raw.revisedTargetDate),
    realization:
      fromCandidVariant<Variant_Done_OnProgress_Backlog_CarriedForNextYear_Pending>(
        raw.realization,
      ),
    notes: fromOpt(raw.notes),
    createdAt: raw.createdAt,
    createdBy: raw.createdBy as OKR["createdBy"],
  };
}

function normalizeMyProfile(raw: {
  userId: string;
  principalId: unknown;
  companyId: string;
  fullName: string;
  status: Record<string, null>;
  roles: Array<{
    assignmentId: string;
    userId: string;
    companyId: string;
    roleType: Record<string, null>;
    orgNodeId: [string] | [];
    activeStatus: boolean;
    ultimateParentId: [string] | [];
    grandParentId: [string] | [];
    parentId: [string] | [];
    assignedAt: bigint;
    assignedBy: unknown;
  }>;
}): MyProfile {
  return {
    userId: raw.userId,
    principalId: raw.principalId as MyProfile["principalId"],
    companyId: raw.companyId,
    fullName: raw.fullName,
    status: fromCandidVariant(raw.status),
    roles: raw.roles.map(normalizeRoleAssignment),
  };
}

// ─── Auth / Profile ───────────────────────────────────────────────────────────

export function useMyProfile() {
  const { identity } = useInternetIdentity();
  const { isFetching } = useActor();
  return useQuery<MyProfile | null>({
    queryKey: ["myProfile"],
    queryFn: async () => {
      const actor = await getExtendedActor(identity);
      const result = await actor.getMyProfile();
      if (result.length === 0) return null;
      return normalizeMyProfile(result[0]);
    },
    enabled: !!identity && !isFetching,
    // No staleTime — always refetch when actor changes so role-based redirects
    // pick up the correct profile immediately after Internet Identity login.
    staleTime: 0,
  });
}

export function useCreateCompany() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      companyName,
      adminFullName,
      email,
    }: {
      companyName: string;
      adminFullName: string;
      email: string | null;
    }) => {
      const actor = await getExtendedActor(identity);
      return actor.createCompany(companyName, adminFullName, toOptText(email));
    },
    onSuccess: () => {
      // Use refetchQueries so the profile is eagerly re-fetched and RootGate
      // immediately redirects to /admin. invalidateQueries alone may not
      // trigger a refetch if the component is not actively subscribed.
      void queryClient.refetchQueries({ queryKey: ["myProfile"] });
    },
  });
}

export function useJoinCompany() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      code,
      fullName,
      email,
    }: {
      code: string;
      fullName: string;
      email: string | null;
    }) => {
      const actor = await getExtendedActor(identity);
      return actor.joinCompany(code, fullName, toOptText(email));
    },
    onSuccess: () => {
      // Eagerly refetch so RootGate picks up the new profile and redirects
      // to /pending without a manual navigate() call in the component.
      void queryClient.refetchQueries({ queryKey: ["myProfile"] });
    },
  });
}

// ─── Registration Codes ───────────────────────────────────────────────────────

export function useListRegistrationCodes() {
  const { identity } = useInternetIdentity();
  const { isFetching } = useActor();
  return useQuery<RegistrationCodeRecord[]>({
    queryKey: ["registrationCodes"],
    queryFn: async () => {
      const actor = await getExtendedActor(identity);
      const raw = await actor.listRegistrationCodes();
      return raw.map(normalizeRegistrationCode);
    },
    enabled: !!identity && !isFetching,
  });
}

export function useGenerateRegistrationCode() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const actor = await getExtendedActor(identity);
      return actor.generateRegistrationCode();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["registrationCodes"] });
    },
  });
}

export function useDeactivateRegistrationCode() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const actor = await getExtendedActor(identity);
      return actor.deactivateRegistrationCode(code);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["registrationCodes"] });
    },
  });
}

// ─── Organization Nodes ───────────────────────────────────────────────────────

export function useListOrganizationNodes() {
  const { identity } = useInternetIdentity();
  const { isFetching } = useActor();
  return useQuery<OrgNode[]>({
    queryKey: ["orgNodes"],
    queryFn: async () => {
      const actor = await getExtendedActor(identity);
      const raw = await actor.listOrganizationNodes();
      return raw.map(normalizeOrgNode);
    },
    enabled: !!identity && !isFetching,
  });
}

// Maps frontend enum values (PascalCase) to backend-expected strings (SCREAMING_SNAKE_CASE)
function toBackendNodeType(nodeType: string): string {
  switch (nodeType) {
    case "PresidentDirector":
      return "PRESIDENT_DIRECTOR";
    case "Director":
      return "DIRECTOR";
    case "Division":
      return "DIVISION";
    case "Department":
      return "DEPARTMENT";
    default:
      return nodeType;
  }
}

export function useCreateOrganizationNode() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      nodeType,
      nodeName,
      parentNodeId,
    }: {
      nodeType: string;
      nodeName: string;
      parentNodeId: string | null;
    }) => {
      const actor = await getExtendedActor(identity);
      return actor.createOrganizationNode(
        toBackendNodeType(nodeType),
        nodeName,
        toOptText(parentNodeId),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orgNodes"] });
    },
  });
}

export function useUpdateOrganizationNode() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      nodeId,
      nodeName,
    }: {
      nodeId: string;
      nodeName: string;
    }) => {
      const actor = await getExtendedActor(identity);
      return actor.updateOrganizationNode(nodeId, nodeName);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orgNodes"] });
    },
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function useListUsers() {
  const { identity } = useInternetIdentity();
  const { isFetching } = useActor();
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const actor = await getExtendedActor(identity);
      const raw = await actor.listUsers();
      return raw.map(normalizeUser);
    },
    enabled: !!identity && !isFetching,
  });
}

export function useUpdateUserStatus() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      newStatus,
    }: {
      userId: string;
      newStatus: "ACTIVE" | "INACTIVE";
    }) => {
      const actor = await getExtendedActor(identity);
      return actor.updateUserStatus(userId, newStatus);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["roleAssignments"] });
      void queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

// ─── Role Assignments ─────────────────────────────────────────────────────────

// Maps frontend enum values (PascalCase) to backend-expected strings (SCREAMING_SNAKE_CASE)
function toBackendRoleType(roleType: string): string {
  switch (roleType) {
    case "CompanyAdmin":
      return "COMPANY_ADMIN";
    case "PresidentDirector":
      return "PRESIDENT_DIRECTOR";
    case "Director":
      return "DIRECTOR";
    case "DivisionHead":
      return "DIVISION_HEAD";
    case "DepartmentHead":
      return "DEPARTMENT_HEAD";
    default:
      return roleType;
  }
}

export function useListRoleAssignments(userId?: string) {
  const { identity } = useInternetIdentity();
  const { isFetching } = useActor();
  return useQuery<RoleAssignment[]>({
    queryKey: ["roleAssignments", userId ?? "all"],
    queryFn: async () => {
      const actor = await getExtendedActor(identity);
      const raw = await actor.listRoleAssignments(userId ? [userId] : []);
      return raw.map(normalizeRoleAssignment);
    },
    enabled: !!identity && !isFetching,
  });
}

export function useAssignRole() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      roleType,
      orgNodeId,
    }: {
      userId: string;
      roleType: string;
      orgNodeId: string | null;
    }) => {
      const actor = await getExtendedActor(identity);
      return actor.assignRole(
        userId,
        toBackendRoleType(roleType),
        toOptText(orgNodeId),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roleAssignments"] });
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeactivateRoleAssignment() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const actor = await getExtendedActor(identity);
      return actor.deactivateRoleAssignment(assignmentId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roleAssignments"] });
    },
  });
}

// ─── KPI Years ────────────────────────────────────────────────────────────────

export function useListKPIYears() {
  const { identity } = useInternetIdentity();
  const { isFetching } = useActor();
  return useQuery<KPIYear[]>({
    queryKey: ["kpiYears"],
    queryFn: async () => {
      const actor = await getExtendedActor(identity);
      const raw = await actor.listKPIYears();
      return raw.map(normalizeKPIYear);
    },
    enabled: !!identity && !isFetching,
  });
}

export function useCreateKPIYear() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (year: bigint) => {
      const actor = await getExtendedActor(identity);
      return actor.createKPIYear(year);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kpiYears"] });
    },
  });
}

export function useSetKPIYearStatus() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kpiYearId,
      newStatus,
    }: {
      kpiYearId: string;
      newStatus: "OPEN" | "CLOSED";
    }) => {
      const actor = await getExtendedActor(identity);
      return actor.setKPIYearStatus(kpiYearId, newStatus);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kpiYears"] });
    },
  });
}

// ─── BSC Aspects ──────────────────────────────────────────────────────────────

export function useListBSCAspects() {
  const { identity } = useInternetIdentity();
  const { isFetching } = useActor();
  return useQuery<BSCAspect[]>({
    queryKey: ["bscAspects"],
    queryFn: async () => {
      const actor = await getExtendedActor(identity);
      const raw = await actor.listBSCAspects();
      return raw.map(normalizeBSCAspect);
    },
    enabled: !!identity && !isFetching,
  });
}

export function useCreateBSCAspect() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (aspectName: string) => {
      const actor = await getExtendedActor(identity);
      return actor.createBSCAspect(aspectName);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bscAspects"] });
    },
  });
}

export function useUpdateBSCAspect() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      aspectId,
      aspectName,
    }: {
      aspectId: string;
      aspectName: string;
    }) => {
      const actor = await getExtendedActor(identity);
      return actor.updateBSCAspect(aspectId, aspectName);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bscAspects"] });
    },
  });
}

// ─── Strategic Objectives ─────────────────────────────────────────────────────

export function useListStrategicObjectives(_bscAspectId?: string) {
  const { identity } = useInternetIdentity();
  const { isFetching } = useActor();
  return useQuery<StrategicObjective[]>({
    queryKey: ["strategicObjectives"],
    queryFn: async () => {
      const actor = await getExtendedActor(identity);
      const raw = await actor.listStrategicObjectives([]);
      return raw.map(normalizeStrategicObjective);
    },
    enabled: !!identity && !isFetching,
  });
}

export function useCreateStrategicObjective() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bscAspectId,
      objectiveName,
    }: {
      bscAspectId: string;
      objectiveName: string;
    }) => {
      const actor = await getExtendedActor(identity);
      return actor.createStrategicObjective(bscAspectId, objectiveName);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["strategicObjectives"] });
    },
  });
}

export function useUpdateStrategicObjective() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      objectiveId,
      objectiveName,
    }: {
      objectiveId: string;
      objectiveName: string;
    }) => {
      const actor = await getExtendedActor(identity);
      return actor.updateStrategicObjective(objectiveId, objectiveName);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["strategicObjectives"] });
    },
  });
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

// Maps frontend period values to backend-expected strings
function toBackendPeriod(period: string): string {
  switch (period) {
    case "OneTime":
      return "ONETIME";
    case "Annual":
      return "ANNUAL";
    case "Monthly":
      return "MONTHLY";
    case "Quarterly":
      return "QUARTERLY";
    case "SemiAnnual":
      return "SEMI_ANNUAL";
    default:
      return period;
  }
}

export function useListKPIs(
  kpiYearId?: string,
  orgNodeId?: string,
  statusFilter?: string,
) {
  const { identity } = useInternetIdentity();
  const { isFetching } = useActor();
  return useQuery<KPI[]>({
    queryKey: [
      "kpis",
      kpiYearId ?? null,
      orgNodeId ?? null,
      statusFilter ?? null,
    ],
    queryFn: async () => {
      const actor = await getExtendedActor(identity);
      const raw = await actor.listKPIs(
        kpiYearId ? [kpiYearId] : [],
        orgNodeId ? [orgNodeId] : [],
        statusFilter ? [statusFilter] : [],
      );
      return raw.map(normalizeKPI);
    },
    enabled: !!identity && !isFetching,
  });
}

export function useCreateKPI() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kpiYearId,
      bscAspectId,
      strategicObjectiveId,
      organizationNodeId,
      kpiMeasurement,
      kpiPeriod,
      kpiWeight,
      kpiScoreParameter,
    }: {
      kpiYearId: string;
      bscAspectId: string;
      strategicObjectiveId: string;
      organizationNodeId: string;
      kpiMeasurement: string;
      kpiPeriod: string;
      kpiWeight: number;
      kpiScoreParameter?: string;
    }) => {
      const actor = await getExtendedActor(identity);
      return actor.createKPI(
        kpiYearId,
        bscAspectId,
        strategicObjectiveId,
        organizationNodeId,
        kpiMeasurement,
        toOptText(kpiScoreParameter),
        toBackendPeriod(kpiPeriod),
        kpiWeight,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kpis"] });
    },
  });
}

export function useUpdateKPI() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kpiId,
      bscAspectId,
      strategicObjectiveId,
      kpiMeasurement,
      kpiPeriod,
      kpiWeight,
      kpiScoreParameter,
    }: {
      kpiId: string;
      bscAspectId: string;
      strategicObjectiveId: string;
      kpiMeasurement: string;
      kpiPeriod: string;
      kpiWeight: number;
      kpiScoreParameter?: string;
    }) => {
      const actor = await getExtendedActor(identity);
      await actor.updateKPI(
        kpiId,
        bscAspectId,
        strategicObjectiveId,
        kpiMeasurement,
        toOptText(kpiScoreParameter),
        toBackendPeriod(kpiPeriod),
        kpiWeight,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kpis"] });
    },
  });
}

export function useDeleteKPI() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (kpiId: string) => {
      const actor = await getExtendedActor(identity);
      await actor.deleteKPI(kpiId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kpis"] });
    },
  });
}

export function useSubmitKPI() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (kpiId: string) => {
      const actor = await getExtendedActor(identity);
      return actor.submitKPI(kpiId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kpis"] });
    },
  });
}

export function useApproveKPI() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (kpiId: string) => {
      const actor = await getExtendedActor(identity);
      return actor.approveKPI(kpiId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kpis"] });
    },
  });
}

export function useRejectKPI() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kpiId,
      revisionNotes,
    }: {
      kpiId: string;
      revisionNotes: string;
    }) => {
      const actor = await getExtendedActor(identity);
      return actor.rejectKPI(kpiId, revisionNotes);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kpis"] });
    },
  });
}

// ─── KPI Score Parameter (stored separately in backend) ───────────────────────

export function useGetKPIScoreParameter(kpiId: string) {
  const { identity } = useInternetIdentity();
  return useQuery<string>({
    queryKey: ["kpiScoreParameter", kpiId],
    queryFn: async () => {
      if (!kpiId) return "";
      const actor = await getExtendedActor(identity);
      const result = await actor.getKPIScoreParameter(kpiId);
      return result[0] ?? "";
    },
    enabled: !!kpiId && !!identity,
    staleTime: 60_000,
  });
}

// ─── KPI Targets (backend-stored) ─────────────────────────────────────────────

export function useSaveKPITargets() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kpiId,
      targets,
    }: {
      kpiId: string;
      targets: number[];
    }) => {
      const actor = await getExtendedActor(identity);
      // targets is an array of values ordered by periodIndex (1-based)
      const tuples: Array<[bigint, number]> = targets.map(
        (v, i) => [BigInt(i + 1), v] as [bigint, number],
      );
      await actor.saveKPITargets(kpiId, tuples);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["kpiTargets", variables.kpiId],
      });
    },
  });
}

export function useGetKPITargets(kpiId: string) {
  const { identity } = useInternetIdentity();
  return useQuery<KPITargetRecord[]>({
    queryKey: ["kpiTargets", kpiId],
    queryFn: async () => {
      if (!kpiId) return [];
      const actor = await getExtendedActor(identity);
      const raw = await actor.getKPITargets(kpiId);
      // Normalize periodIndex to always be bigint regardless of how
      // the Candid decoder returns it (bigint or number).
      return raw.map((t) => ({
        ...t,
        periodIndex: BigInt(
          typeof t.periodIndex === "bigint"
            ? t.periodIndex
            : Number(t.periodIndex),
        ),
      }));
    },
    enabled: !!kpiId && !!identity,
    // No staleTime — always serve fresh target data so progress page
    // never shows stale "—" for periods that already have targets saved.
    staleTime: 0,
    refetchOnMount: true,
  });
}

// ─── KPI Progress (backend-stored) ────────────────────────────────────────────

export function useUpdateKPIProgress() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kpiId,
      periodIndex,
      achievement,
      score,
    }: {
      kpiId: string;
      periodIndex: number;
      achievement: number;
      score: number;
    }) => {
      const actor = await getExtendedActor(identity);
      await actor.updateKPIProgress(
        kpiId,
        BigInt(periodIndex),
        achievement,
        score,
      );
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["kpis"] });
      void queryClient.invalidateQueries({
        queryKey: ["kpiProgressList", variables.kpiId],
      });
    },
  });
}

export function useGetKPIProgressList(kpiId: string) {
  const { identity } = useInternetIdentity();
  return useQuery<KPIProgressRecord[]>({
    queryKey: ["kpiProgressList", kpiId],
    queryFn: async () => {
      if (!kpiId) return [];
      const actor = await getExtendedActor(identity);
      const raw = await actor.getKPIProgressList(kpiId);
      // Normalize periodIndex to bigint for consistent comparisons
      return raw.map((r) => ({
        ...r,
        periodIndex: BigInt(
          typeof r.periodIndex === "bigint"
            ? r.periodIndex
            : Number(r.periodIndex),
        ),
      }));
    },
    enabled: !!kpiId && !!identity,
    staleTime: 0,
    refetchOnMount: true,
  });
}

// ─── Combined KPI Progress Data (targets + progress) ─────────────────────────

/**
 * Returns live-combined targets + progress data for a KPI.
 * Uses useMemo instead of a derived useQuery so the result updates
 * reactively whenever either sub-query's data changes, avoiding stale
 * queryFn-closure issues.
 */
export function useGetKPIProgressData(kpiId: string) {
  const targetsQuery = useGetKPITargets(kpiId);
  const progressQuery = useGetKPIProgressList(kpiId);

  const data = useMemo<KPIProgressData>(
    () => ({
      targets: targetsQuery.data ?? [],
      progress: progressQuery.data ?? [],
    }),
    [targetsQuery.data, progressQuery.data],
  );

  return {
    data,
    isLoading: targetsQuery.isLoading || progressQuery.isLoading,
    isFetching: targetsQuery.isFetching || progressQuery.isFetching,
  };
}

// ─── OKRs ─────────────────────────────────────────────────────────────────────

export function useListOKRs(kpiYearId?: string, statusFilter?: string) {
  const { identity } = useInternetIdentity();
  const { isFetching } = useActor();
  return useQuery<OKR[]>({
    queryKey: ["okrs", kpiYearId ?? null, statusFilter ?? null],
    queryFn: async () => {
      const actor = await getExtendedActor(identity);
      const raw = await actor.listOKRs(
        kpiYearId ? [kpiYearId] : [],
        statusFilter ? [statusFilter] : [],
      );
      return raw.map(normalizeOKR);
    },
    enabled: !!identity && !isFetching,
  });
}

export function useCreateOKR() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kpiYearId,
      okrAspect,
      objective,
      keyResult,
      targetValue,
      initialTargetDate,
    }: {
      kpiYearId: string;
      okrAspect: string;
      objective: string;
      keyResult: string;
      targetValue: number;
      initialTargetDate: string;
    }) => {
      const actor = await getExtendedActor(identity);
      return actor.createOKR(
        kpiYearId,
        okrAspect,
        objective,
        keyResult,
        targetValue,
        initialTargetDate,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["okrs"] });
    },
  });
}

export function useUpdateOKR() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      okrId,
      okrAspect,
      objective,
      keyResult,
      targetValue,
      initialTargetDate,
      revisedTargetDate,
    }: {
      okrId: string;
      okrAspect: string;
      objective: string;
      keyResult: string;
      targetValue: number;
      initialTargetDate: string;
      revisedTargetDate: string | null;
    }) => {
      const actor = await getExtendedActor(identity);
      return actor.updateOKR(
        okrId,
        okrAspect,
        objective,
        keyResult,
        targetValue,
        initialTargetDate,
        toOptText(revisedTargetDate),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["okrs"] });
    },
  });
}

export function useSubmitOKR() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (okrId: string) => {
      const actor = await getExtendedActor(identity);
      return actor.submitOKR(okrId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["okrs"] });
    },
  });
}

export function useDeleteOKR() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (okrId: string) => {
      const actor = await getExtendedActor(identity);
      return actor.deleteOKR(okrId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["okrs"] });
    },
  });
}

export function useUpdateOKRProgress() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      okrId,
      realization,
      notes,
    }: {
      okrId: string;
      realization: string;
      notes: string | null;
    }) => {
      const actor = await getExtendedActor(identity);
      return actor.updateOKRProgress(okrId, realization, toOptText(notes));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["okrs"] });
    },
  });
}

export function useApproveOKR() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (okrId: string) => {
      const actor = await getExtendedActor(identity);
      return actor.approveOKR(okrId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["okrs"] });
    },
  });
}

export function useRejectOKR() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      okrId,
      revisionNotes,
    }: {
      okrId: string;
      revisionNotes: string;
    }) => {
      const actor = await getExtendedActor(identity);
      return actor.rejectOKR(okrId, revisionNotes);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["okrs"] });
    },
  });
}

// ─── Company Info ─────────────────────────────────────────────────────────────

export function useGetCompanyInfo() {
  const { identity } = useInternetIdentity();
  const { isFetching } = useActor();
  return useQuery({
    queryKey: ["companyInfo"],
    queryFn: async () => {
      const actor = await getExtendedActor(identity);
      const result = await actor.getCompanyInfo();
      return result.length > 0 ? result[0] : null;
    },
    enabled: !!identity && !isFetching,
    staleTime: 0,
  });
}

export function useUpdateCompanyName() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newName: string) => {
      const actor = await getExtendedActor(identity);
      return actor.updateCompanyName(newName);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["companyInfo"] });
      void queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

export function useDeactivateCompany() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const actor = await getExtendedActor(identity);
      return actor.deactivateCompany();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["companyInfo"] });
      void queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

export function useResetYearProgressData() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (kpiYearId: string) => {
      const actor = await getExtendedActor(identity);
      return actor.resetYearProgressData(kpiYearId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kpis"] });
      void queryClient.invalidateQueries({ queryKey: ["okrs"] });
    },
  });
}

// ─── Clear actor cache on identity change ─────────────────────────────────────
export { clearActorCache, fromOptText };
