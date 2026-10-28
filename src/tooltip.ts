// Gap the tooltip keeps from the edges of the viewport (px).
const EDGE_MARGIN_PX = 8;

/** Whether a tooltip drawn above its cell, with its top edge measured at `top`, sticks out of the viewport. */
export function overflowsTop(top: number): boolean {
  return top < EDGE_MARGIN_PX;
}

/**
 * How far to move a tooltip sideways so that it stays inside the viewport,
 * given its measured left and right edges. A tooltip wider than the viewport
 * is aligned to the left edge.
 */
export function shiftIntoView(left: number, right: number, viewportWidth: number): number {
  if (left < EDGE_MARGIN_PX) return EDGE_MARGIN_PX - left;
  const overflow = right - (viewportWidth - EDGE_MARGIN_PX);
  if (overflow <= 0) return 0;
  return -Math.min(overflow, left - EDGE_MARGIN_PX);
}
