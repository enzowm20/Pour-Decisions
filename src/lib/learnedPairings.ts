import type { Experiment } from "../types"

// A pairing graph built from your own archive: any two ingredients that
// appeared together in an experiment logged as "worked" are treated as a
// known-good combination, independent of style tags. This is what lets the
// lab get smarter the more you actually log — a combo doesn't need a shared
// style tag if you've already proven in practice that it works.
export type PairingGraph = Map<string, Set<string>>

export function buildPairingGraph(experiments: Experiment[]): PairingGraph {
  const graph: PairingGraph = new Map()

  function link(a: string, b: string) {
    if (!graph.has(a)) graph.set(a, new Set())
    graph.get(a)!.add(b)
  }

  for (const exp of experiments) {
    if (exp.outcome !== "worked") continue
    const ids = exp.ingredientIds
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        link(ids[i], ids[j])
        link(ids[j], ids[i])
      }
    }
  }

  return graph
}

export function isLearnedPair(graph: PairingGraph, idA: string, idB: string): boolean {
  return graph.get(idA)?.has(idB) ?? false
}
