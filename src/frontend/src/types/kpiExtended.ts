/**
 * kpiExtended.ts
 *
 * Helpers for KPI score parameter which is stored in a separate
 * backend map (kpiScoreParameters) rather than on the KPI record itself.
 * This avoids stable variable compatibility issues when upgrading the canister.
 *
 * Use the `useGetKPIScoreParameter` hook (from useQueries.ts) to fetch the
 * score parameter for a specific KPI.
 *
 * The `getScoreParameter` function below is a convenience helper that reads
 * from a pre-fetched map of kpiId → scoreParam string.
 */

/**
 * Read a score parameter from a pre-fetched map.
 * Pass `scoreParamMap` which is a Map<kpiId, scoreParam> built from
 * individual `useGetKPIScoreParameter` calls or a batch fetch.
 */
export function getScoreParameterFromMap(
  kpiId: string,
  scoreParamMap: Map<string, string>,
): string {
  return scoreParamMap.get(kpiId) ?? "";
}

/**
 * Parse a Candid opt text result ([string] | []) to a plain string.
 */
export function parseOptText(value: [string] | [] | null | undefined): string {
  if (!value) return "";
  if (Array.isArray(value) && value.length > 0) return value[0] ?? "";
  return "";
}
