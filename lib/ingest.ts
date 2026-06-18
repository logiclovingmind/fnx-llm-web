// Tiny DOM -> WebGL bridge. The hero's chat bubbles live in the DOM (they're
// text); when one dissolves it pushes an emit request here in *screen pixels*,
// and the in-scene <Ingest> points system drains the queue each frame, unprojects
// to world space, and spawns real particles that fly into the cosmos. This is how
// a dissolving message merges into the same WebGL field rather than a 2D overlay.
export type EmitReq = { x: number; y: number; w: number; h: number; n: number };

const queue: EmitReq[] = [];

export function emitFlood(r: EmitReq) {
  queue.push(r);
}

export function drainFlood(): EmitReq[] {
  if (queue.length === 0) return [];
  const out = queue.slice();
  queue.length = 0;
  return out;
}
