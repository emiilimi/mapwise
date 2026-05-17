// Splitter en slide-body på `---step---`-markører til ordnede segmenter.
// Linjen må stå alene (mulig leading/trailing whitespace).
// Eksempel:
//   "intro\n\n---step---\n\ndetalj"  →  ["intro\n", "\ndetalj"]
const STEP_RE = /^\s*---step---\s*$/m;

export function splitSteps(body: string): string[] {
  const parts = body.split(STEP_RE);
  // Behold også segmenter som er bare whitespace — de er fortsatt et "klikk".
  if (parts.length === 0) return [""];
  return parts;
}
