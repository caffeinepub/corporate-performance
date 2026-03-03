/**
 * backendExtended.ts
 *
 * Provides actor calls for backend methods that were added to main.mo
 * after the initial code generation, and are therefore missing from
 * the locked backend.ts / backend.did.js / backend.d.ts.
 *
 * Uses @dfinity/agent + @dfinity/candid to create a minimal supplementary
 * actor that communicates directly with the deployed canister.
 *
 * Also provides localStorage-based utilities for data that is managed
 * client-side (kpiScoreParameter, kpiTargets, kpiProgress+score).
 */

import { Actor, HttpAgent } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";

// ─── Config loader (mirrors config.ts without being locked) ──────────────────

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

// ─── Minimal IDL for missing/updated methods ──────────────────────────────────

function extendedIdlFactory({
  IDL: IdlParam,
}: {
  IDL: typeof IDL;
}): IDL.ServiceClass {
  const KPIId = IdlParam.Text;

  return IdlParam.Service({
    deleteKPI: IdlParam.Func([KPIId], [], []),
    updateKPI: IdlParam.Func(
      [
        KPIId,
        IdlParam.Text, // bscAspectId
        IdlParam.Text, // strategicObjectiveId
        IdlParam.Text, // kpiMeasurement
        IdlParam.Text, // kpiPeriod
        IdlParam.Float64, // kpiWeight
      ],
      [],
      [],
    ),
    // updateKPIProgress: 3 params as backend defines — (kpiId, periodIndex, achievement)
    updateKPIProgress: IdlParam.Func(
      [KPIId, IdlParam.Nat, IdlParam.Float64],
      [],
      [],
    ),
  });
}

// ─── Extended Actor Types ─────────────────────────────────────────────────────

export interface ExtendedActor {
  deleteKPI: (kpiId: string) => Promise<void>;
  updateKPI: (
    kpiId: string,
    bscAspectId: string,
    strategicObjectiveId: string,
    kpiMeasurement: string,
    kpiPeriod: string,
    kpiWeight: number,
  ) => Promise<void>;
  updateKPIProgress: (
    kpiId: string,
    periodIndex: bigint,
    achievement: number,
  ) => Promise<void>;
}

// ─── KPI Progress Data Types (localStorage-backed) ───────────────────────────

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

// ─── localStorage: KPI Score Parameter ───────────────────────────────────────

export function saveKPIScoreParameter(kpiId: string, value: string): void {
  try {
    localStorage.setItem(`kpi_score_param_${kpiId}`, value);
  } catch {
    // localStorage may be unavailable in some contexts
  }
}

export function getKPIScoreParameter(kpiId: string): string {
  try {
    return localStorage.getItem(`kpi_score_param_${kpiId}`) ?? "";
  } catch {
    return "";
  }
}

export function deleteKPIScoreParameter(kpiId: string): void {
  try {
    localStorage.removeItem(`kpi_score_param_${kpiId}`);
  } catch {
    // noop
  }
}

// ─── localStorage: KPI Targets ────────────────────────────────────────────────

export interface LocalKPITarget {
  periodIndex: number;
  targetValue: number;
}

export function saveKPITargetsLocal(
  kpiId: string,
  targets: LocalKPITarget[],
): void {
  try {
    localStorage.setItem(`kpi_targets_${kpiId}`, JSON.stringify(targets));
  } catch {
    // noop
  }
}

export function getKPITargetsLocal(kpiId: string): LocalKPITarget[] {
  try {
    const raw = localStorage.getItem(`kpi_targets_${kpiId}`);
    if (!raw) return [];
    return JSON.parse(raw) as LocalKPITarget[];
  } catch {
    return [];
  }
}

export function deleteKPITargetsLocal(kpiId: string): void {
  try {
    localStorage.removeItem(`kpi_targets_${kpiId}`);
  } catch {
    // noop
  }
}

// ─── localStorage: KPI Progress (with score) ─────────────────────────────────

export interface LocalKPIProgress {
  periodIndex: number;
  achievement: number;
  score: number;
  updatedAt: number; // Date.now() timestamp
}

export function saveKPIProgressLocal(
  kpiId: string,
  periodIndex: number,
  achievement: number,
  score: number,
): void {
  try {
    const existing = getKPIProgressLocalRaw(kpiId);
    const filtered = existing.filter((p) => p.periodIndex !== periodIndex);
    filtered.push({ periodIndex, achievement, score, updatedAt: Date.now() });
    localStorage.setItem(`kpi_progress_${kpiId}`, JSON.stringify(filtered));
  } catch {
    // noop
  }
}

function getKPIProgressLocalRaw(kpiId: string): LocalKPIProgress[] {
  try {
    const raw = localStorage.getItem(`kpi_progress_${kpiId}`);
    if (!raw) return [];
    return JSON.parse(raw) as LocalKPIProgress[];
  } catch {
    return [];
  }
}

export function getKPIProgressLocal(kpiId: string): LocalKPIProgress[] {
  return getKPIProgressLocalRaw(kpiId);
}

export function deleteKPIProgressLocal(kpiId: string): void {
  try {
    localStorage.removeItem(`kpi_progress_${kpiId}`);
  } catch {
    // noop
  }
}

// ─── Actor factory ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
