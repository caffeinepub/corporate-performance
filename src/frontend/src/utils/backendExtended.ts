/**
 * backendExtended.ts
 *
 * Provides actor calls for backend methods that were added to main.mo
 * after the initial code generation, and are therefore missing from
 * the locked backend.ts / backend.did.js / backend.d.ts.
 *
 * Uses @dfinity/agent + @dfinity/candid to create a supplementary actor
 * that communicates directly with the deployed canister.
 *
 * All KPI data (targets, score parameters, progress+score) is stored
 * in the backend canister -- no localStorage.
 */

import { Actor, HttpAgent } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";

// ─── Config loader ────────────────────────────────────────────────────────────

let _cachedConfig: { host: string; canisterId: string } | null = null;

async function loadBackendConfig(): Promise<{
  host: string;
  canisterId: string;
}> {
  if (_cachedConfig) return _cachedConfig;

  const base =
    typeof window !== "undefined"
      ? `${window.location.origin}/`
      : "http://localhost:5173/";

  const res = await fetch(`${base}env.json`);
  const cfg = await res.json();

  const canisterId: string =
    cfg.backend_canister_id !== "undefined" && cfg.backend_canister_id
      ? (cfg.backend_canister_id as string)
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((
          (import.meta as unknown as Record<string, unknown>).env as Record<
            string,
            string
          >
        )?.CANISTER_ID_BACKEND ?? "");

  const host: string =
    cfg.backend_host !== "undefined" && cfg.backend_host
      ? (cfg.backend_host as string)
      : "https://ic0.app";

  _cachedConfig = { host, canisterId };
  return _cachedConfig;
}

// ─── Full Candid IDL for extended backend methods ─────────────────────────────

function extendedIdlFactory({
  IDL: IdlParam,
}: {
  IDL: typeof IDL;
}): IDL.ServiceClass {
  const KPIId = IdlParam.Text;
  const KPITargetType = IdlParam.Record({
    targetId: IdlParam.Text,
    kpiId: IdlParam.Text,
    periodIndex: IdlParam.Nat,
    targetValue: IdlParam.Float64,
  });
  const KPIProgressType = IdlParam.Record({
    progressId: IdlParam.Text,
    kpiId: IdlParam.Text,
    periodIndex: IdlParam.Nat,
    achievement: IdlParam.Float64,
    score: IdlParam.Float64,
    updatedAt: IdlParam.Int,
    updatedBy: IdlParam.Opt(IdlParam.Principal),
  });

  return IdlParam.Service({
    // ── KPI CRUD ───────────────────────────────────────────────────────────────
    createKPI: IdlParam.Func(
      [
        IdlParam.Text, // kpiYearId
        IdlParam.Text, // bscAspectId
        IdlParam.Text, // strategicObjectiveId
        IdlParam.Text, // organizationNodeId
        IdlParam.Text, // kpiMeasurement
        IdlParam.Opt(IdlParam.Text), // kpiScoreParameter
        IdlParam.Text, // kpiPeriod
        IdlParam.Float64, // kpiWeight
      ],
      [IdlParam.Text],
      [],
    ),
    updateKPI: IdlParam.Func(
      [
        KPIId,
        IdlParam.Text, // bscAspectId
        IdlParam.Text, // strategicObjectiveId
        IdlParam.Text, // kpiMeasurement
        IdlParam.Opt(IdlParam.Text), // kpiScoreParameter
        IdlParam.Text, // kpiPeriod
        IdlParam.Float64, // kpiWeight
      ],
      [],
      [],
    ),
    deleteKPI: IdlParam.Func([KPIId], [], []),

    // ── KPI Targets ────────────────────────────────────────────────────────────
    saveKPITargets: IdlParam.Func(
      [KPIId, IdlParam.Vec(IdlParam.Tuple(IdlParam.Nat, IdlParam.Float64))],
      [],
      [],
    ),
    getKPITargets: IdlParam.Func(
      [KPIId],
      [IdlParam.Vec(KPITargetType)],
      ["query"],
    ),

    // ── KPI Score Parameter ────────────────────────────────────────────────────
    getKPIScoreParameter: IdlParam.Func(
      [KPIId],
      [IdlParam.Opt(IdlParam.Text)],
      ["query"],
    ),

    // ── KPI Progress ───────────────────────────────────────────────────────────
    updateKPIProgress: IdlParam.Func(
      [
        KPIId,
        IdlParam.Nat, // periodIndex
        IdlParam.Float64, // achievement
        IdlParam.Float64, // score
      ],
      [],
      [],
    ),
    getKPIProgressList: IdlParam.Func(
      [KPIId],
      [IdlParam.Vec(KPIProgressType)],
      ["query"],
    ),
  });
}

// ─── Extended Actor Types ─────────────────────────────────────────────────────

export interface KPITargetRecord {
  targetId: string;
  kpiId: string;
  periodIndex: bigint;
  targetValue: number;
}

export interface KPIProgressRecord {
  progressId: string;
  kpiId: string;
  periodIndex: bigint;
  achievement: number;
  score: number;
  updatedAt: bigint;
  updatedBy: unknown;
}

export interface KPIProgressData {
  targets: KPITargetRecord[];
  progress: KPIProgressRecord[];
}

export interface ExtendedActor {
  createKPI: (
    kpiYearId: string,
    bscAspectId: string,
    strategicObjectiveId: string,
    organizationNodeId: string,
    kpiMeasurement: string,
    kpiScoreParameter: [string] | [],
    kpiPeriod: string,
    kpiWeight: number,
  ) => Promise<string>;
  updateKPI: (
    kpiId: string,
    bscAspectId: string,
    strategicObjectiveId: string,
    kpiMeasurement: string,
    kpiScoreParameter: [string] | [],
    kpiPeriod: string,
    kpiWeight: number,
  ) => Promise<void>;
  deleteKPI: (kpiId: string) => Promise<void>;
  getKPIScoreParameter: (kpiId: string) => Promise<[string] | []>;
  saveKPITargets: (
    kpiId: string,
    targets: Array<[bigint, number]>,
  ) => Promise<void>;
  getKPITargets: (kpiId: string) => Promise<KPITargetRecord[]>;
  updateKPIProgress: (
    kpiId: string,
    periodIndex: bigint,
    achievement: number,
    score: number,
  ) => Promise<void>;
  getKPIProgressList: (kpiId: string) => Promise<KPIProgressRecord[]>;
}

// ─── Actor factory ────────────────────────────────────────────────────────────

let _actorCache: { actor: ExtendedActor; identityKey: string } | null = null;

export function clearActorCache(): void {
  _actorCache = null;
}

export async function getExtendedActor(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  identity?: any,
): Promise<ExtendedActor> {
  const { host, canisterId } = await loadBackendConfig();

  const identityKey = identity
    ? (identity.getPrincipal?.()?.toText?.() ?? "anon")
    : "anon";

  if (_actorCache && _actorCache.identityKey === identityKey) {
    return _actorCache.actor;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agentOptions: Record<string, any> = { host };
  if (identity) {
    agentOptions.identity = identity;
  }

  const agent = await HttpAgent.create(agentOptions);

  if (
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    host.includes("4943")
  ) {
    await agent.fetchRootKey();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actor = Actor.createActor<ExtendedActor>(extendedIdlFactory as any, {
    agent,
    canisterId,
  }) as ExtendedActor;

  _actorCache = { actor, identityKey };
  return actor;
}

// ─── Candid optional helper ───────────────────────────────────────────────────
// Motoko `?Text` maps to Candid `opt text` which the JS agent represents as
// `[value]` for Some and `[]` for None.

export function toOptText(value: string | null | undefined): [string] | [] {
  if (value && value.trim() !== "") return [value.trim()];
  return [];
}

export function fromOptText(
  value: [string] | [] | string | null | undefined,
): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return (value as string) ?? "";
}
