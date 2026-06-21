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

// The pairwise graph alone can't tell a true 3+ ingredient win from three
// ingredients that each happened to pair with the anchor separately. A proven
// group is the full, exact ingredient set from a single "worked" experiment —
// used to badge a whole multi-ingredient combination as proven together,
// not just pairwise-linked.
export type ProvenGroup = string[] // sorted, de-duplicated ingredient ids, length >= 2

export function buildProvenGroups(experiments: Experiment[]): ProvenGroup[] {
  return experiments
    .filter((e) => e.outcome === "worked")
    .map((e) => [...new Set(e.ingredientIds)].sort())
    .filter((ids) => ids.length >= 2)
}

// Returns the union of every proven group that is fully contained within
// `candidateIds` — i.e. every ingredient in that group is present in the
// combo being considered — so a combo can be badged "proven" as a whole
// group of 3+ ingredients, not just ingredient-by-ingredient.
export function provenMembersWithin(
  groups: ProvenGroup[],
  candidateIds: Set<string>,
): Set<string> {
  const result = new Set<string>()
  for (const group of groups) {
    if (group.every((id) => candidateIds.has(id))) {
      group.forEach((id) => result.add(id))
    }
  }
  return result
}
