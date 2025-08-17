import type { Manifest } from "../types.js";

export function estimatePullSize(m: Manifest): number {
  return (m.layers || []).reduce((sum, l) => sum + (l.size || 0), 0);
}

export function compareManifests(a: Manifest, b: Manifest) {
  const aLayers = new Set((a.layers || []).map((l) => l.digest));
  const bLayers = new Set((b.layers || []).map((l) => l.digest));
  const onlyA = [...aLayers].filter((d) => !bLayers.has(d));
  const onlyB = [...bLayers].filter((d) => !aLayers.has(d));
  const common = [...aLayers].filter((d) => bLayers.has(d));
  return { onlyA, onlyB, common };
}