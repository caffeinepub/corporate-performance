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

function normalizeOrgNode(raw: OrgNode): OrgNode {
  return {
    ...raw,
    nodeType:
      fromCandidVariant<Variant_Division_Director_PresidentDirector_Department>(
        raw.nodeType,
      ),
  };
}

export function useMyProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<MyProfile | null>({
    queryKey: ["myProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyProfile();
    },
    enabled: !!actor && !isFetching,
    // No staleTime — always refetch when actor changes so role-based redirects
    // pick up the correct profile immediately after Internet Identity login.
    staleTime: 0,
  });
}

export function useCreateCompany() {
  const { actor } = useActor();
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
      if (!actor) throw new Error("Not authenticated");
      return actor.createCompany(companyName, adminFullName, email);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

export function useJoinCompany() {
  const { actor } = useActor();
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
      if (!actor) throw new Error("Not authenticated");
      return actor.joinCompany(code, fullName, email);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

// ─── Registration Codes ───────────────────────────────────────────────────────

export function useListRegistrationCodes() {
  const { actor, isFetching } = useActor();
  return useQuery<RegistrationCodeRecord[]>({
    queryKey: ["registrationCodes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listRegistrationCodes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGenerateRegistrationCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not authenticated");
      return actor.generateRegistrationCode();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["registrationCodes"] });
    },
  });
}

export function useDeactivateRegistrationCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deactivateRegistrationCode(code);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["registrationCodes"] });
    },
  });
}

// ─── Organization Nodes ───────────────────────────────────────────────────────

export function useListOrganizationNodes() {
  const { actor, isFetching } = useActor();
  return useQuery<OrgNode[]>({
    queryKey: ["orgNodes"],
    queryFn: async () => {
      if (!actor) return [];
      const raw = await actor.listOrganizationNodes();
      return raw.map(normalizeOrgNode);
    },
    enabled: !!actor && !isFetching,
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
  const { actor } = useActor();
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
      if (!actor) throw new Error("Not authenticated");
      return actor.createOrganizationNode(
        toBackendNodeType(nodeType),
        nodeName,
        parentNodeId,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orgNodes"] });
    },
  });
}

export function useUpdateOrganizationNode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      nodeId,
      nodeName,
    }: {
      nodeId: string;
      nodeName: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateOrganizationNode(nodeId, nodeName);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orgNodes"] });
    },
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function useListUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateUserStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      newStatus,
    }: {
      userId: string;
      newStatus: "ACTIVE" | "INACTIVE";
    }) => {
      if (!actor) throw new Error("Not authenticated");
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

function normalizeRoleAssignment(raw: RoleAssignment): RoleAssignment {
  return { ...raw, roleType: fromCandidVariant(raw.roleType) };
}

export function useListRoleAssignments(userId?: string) {
  const { actor, isFetching } = useActor();
  return useQuery<RoleAssignment[]>({
    queryKey: ["roleAssignments", userId ?? "all"],
    queryFn: async () => {
      if (!actor) return [];
      const raw = await actor.listRoleAssignments(userId ?? null);
      return raw.map(normalizeRoleAssignment);
    },
    enabled: !!actor && !isFetching,
  });
}

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

export function useAssignRole() {
  const { actor } = useActor();
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
      if (!actor) throw new Error("Not authenticated");
      return actor.assignRole(userId, toBackendRoleType(roleType), orgNodeId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roleAssignments"] });
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeactivateRoleAssignment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deactivateRoleAssignment(assignmentId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roleAssignments"] });
    },
  });
}

// ─── KPI Years ────────────────────────────────────────────────────────────────

function normalizeKPIYear(raw: KPIYear): KPIYear {
  return {
    ...raw,
    status: fromCandidVariant<Variant_Open_Closed>(raw.status),
  };
}

export function useListKPIYears() {
  const { actor, isFetching } = useActor();
  return useQuery<KPIYear[]>({
    queryKey: ["kpiYears"],
    queryFn: async () => {
      if (!actor) return [];
      const raw = await actor.listKPIYears();
      return raw.map(normalizeKPIYear);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateKPIYear() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (year: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createKPIYear(year);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kpiYears"] });
    },
  });
}

export function useSetKPIYearStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kpiYearId,
      newStatus,
    }: {
      kpiYearId: string;
      newStatus: "OPEN" | "CLOSED";
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.setKPIYearStatus(kpiYearId, newStatus);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kpiYears"] });
    },
  });
}

// ─── BSC Aspects ──────────────────────────────────────────────────────────────

export function useListBSCAspects() {
  const { actor, isFetching } = useActor();
  return useQuery<BSCAspect[]>({
    queryKey: ["bscAspects"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listBSCAspects();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateBSCAspect() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (aspectName: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createBSCAspect(aspectName);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bscAspects"] });
    },
  });
}

export function useUpdateBSCAspect() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      aspectId,
      aspectName,
    }: {
      aspectId: string;
      aspectName: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateBSCAspect(aspectId, aspectName);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bscAspects"] });
    },
  });
}

// ─── Strategic Objectives ─────────────────────────────────────────────────────

export function useListStrategicObjectives(_bscAspectId?: string) {
  const { actor, isFetching } = useActor();
  return useQuery<StrategicObjective[]>({
    queryKey: ["strategicObjectives"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listStrategicObjectives(null);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateStrategicObjective() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bscAspectId,
      objectiveName,
    }: {
      bscAspectId: string;
      objectiveName: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createStrategicObjective(bscAspectId, objectiveName);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["strategicObjectives"] });
    },
  });
}

export function useUpdateStrategicObjective() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      objectiveId,
      objectiveName,
    }: {
      objectiveId: string;
      objectiveName: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateStrategicObjective(objectiveId, objectiveName);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["strategicObjectives"] });
    },
  });
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

function normalizeKPI(raw: KPI): KPI {
  return {
    ...raw,
    kpiStatus: fromCandidVariant<Variant_Approved_Draft_Submitted_Revised>(
      raw.kpiStatus,
    ),
    kpiPeriod:
      fromCandidVariant<Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual>(
        raw.kpiPeriod,
      ),
  };
}

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
  const { actor, isFetching } = useActor();
  return useQuery<KPI[]>({
    queryKey: [
      "kpis",
      kpiYearId ?? null,
      orgNodeId ?? null,
      statusFilter ?? null,
    ],
    queryFn: async () => {
      if (!actor) return [];
      const raw = await actor.listKPIs(
        kpiYearId ?? null,
        orgNodeId ?? null,
        statusFilter ?? null,
      );
      return raw.map(normalizeKPI);
    },
    enabled: !!actor && !isFetching,
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
      const extActor = await getExtendedActor(identity);
      return extActor.createKPI(
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
      const extActor = await getExtendedActor(identity);
      await extActor.updateKPI(
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
      const extActor = await getExtendedActor(identity);
      await extActor.deleteKPI(kpiId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kpis"] });
    },
  });
}

export function useSubmitKPI() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (kpiId: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.submitKPI(kpiId);
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
      const extActor = await getExtendedActor(identity);
      const result = await extActor.getKPIScoreParameter(kpiId);
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
      const extActor = await getExtendedActor(identity);
      // targets is an array of values ordered by periodIndex (1-based)
      const tuples: Array<[bigint, number]> = targets.map(
        (v, i) => [BigInt(i + 1), v] as [bigint, number],
      );
      await extActor.saveKPITargets(kpiId, tuples);
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
      const extActor = await getExtendedActor(identity);
      return extActor.getKPITargets(kpiId);
    },
    enabled: !!kpiId && !!identity,
    staleTime: 30_000,
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
      const extActor = await getExtendedActor(identity);
      await extActor.updateKPIProgress(
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
      const extActor = await getExtendedActor(identity);
      return extActor.getKPIProgressList(kpiId);
    },
    enabled: !!kpiId && !!identity,
    staleTime: 0,
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

function normalizeOKR(raw: OKR): OKR {
  return {
    ...raw,
    okrStatus:
      fromCandidVariant<Variant_Approved_Draft_Rejected_Submitted_Revised>(
        raw.okrStatus,
      ),
    okrAspect: fromCandidVariant<Variant_People_Tools_Process>(raw.okrAspect),
    realization:
      fromCandidVariant<Variant_Done_OnProgress_Backlog_CarriedForNextYear_Pending>(
        raw.realization,
      ),
  };
}

export function useListOKRs(kpiYearId?: string, statusFilter?: string) {
  const { actor, isFetching } = useActor();
  return useQuery<OKR[]>({
    queryKey: ["okrs", kpiYearId ?? null, statusFilter ?? null],
    queryFn: async () => {
      if (!actor) return [];
      const raw = await actor.listOKRs(kpiYearId ?? null, statusFilter ?? null);
      return raw.map(normalizeOKR);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateOKR() {
  const { actor } = useActor();
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
      if (!actor) throw new Error("Not authenticated");
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
  const { actor } = useActor();
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
      if (!actor) throw new Error("Not authenticated");
      return actor.updateOKR(
        okrId,
        okrAspect,
        objective,
        keyResult,
        targetValue,
        initialTargetDate,
        revisedTargetDate,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["okrs"] });
    },
  });
}

export function useSubmitOKR() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (okrId: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.submitOKR(okrId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["okrs"] });
    },
  });
}

export function useDeleteOKR() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (okrId: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteOKR(okrId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["okrs"] });
    },
  });
}

export function useUpdateOKRProgress() {
  const { actor } = useActor();
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
      if (!actor) throw new Error("Not authenticated");
      return actor.updateOKRProgress(okrId, realization, notes);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["okrs"] });
    },
  });
}

// ─── Approval Actions ─────────────────────────────────────────────────────────

export function useApproveKPI() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (kpiId: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.approveKPI(kpiId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kpis"] });
    },
  });
}

export function useApproveOKR() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (okrId: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.approveOKR(okrId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["okrs"] });
    },
  });
}

export function useRejectOKR() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      okrId,
      revisionNotes,
    }: {
      okrId: string;
      revisionNotes: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.rejectOKR(okrId, revisionNotes);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["okrs"] });
    },
  });
}

export function useRejectKPI() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kpiId,
      revisionNotes,
    }: {
      kpiId: string;
      revisionNotes: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.rejectKPI(kpiId, revisionNotes);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kpis"] });
    },
  });
}

// ─── Clear actor cache on identity change ─────────────────────────────────────
export { clearActorCache, fromOptText };
