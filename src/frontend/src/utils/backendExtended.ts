/**
 * backendExtended.ts
 *
 * Provides actor calls for backend methods that were added to main.mo
 * after the initial code generation, and are therefore missing from
 * the locked backend.ts / backend.did.js / backend.d.ts.
 *
 * Uses @dfinity/agent + @dfinity/candid to create a minimal supplementary
 * actor that communicates directly with the deployed canister.
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

// ─── Minimal IDL for missing methods ─────────────────────────────────────────

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
  });
}

// ─── Actor types ──────────────────────────────────────────────────────────────

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
}

// ─── Actor factory ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _actorCache: { actor: ExtendedActor; identityKey: string } | null = null;

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
