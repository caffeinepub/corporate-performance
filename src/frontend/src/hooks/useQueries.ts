import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MyProfile, OrgNode, RegistrationCodeRecord } from "../backend.d";
import type { Variant_Division_Director_PresidentDirector_Department } from "../backend.d";
import { useActor } from "./useActor";

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
    staleTime: 30_000,
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
