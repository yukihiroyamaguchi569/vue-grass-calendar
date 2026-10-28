// Room the tooltip needs above a cell before it flips below, and the gap it
// keeps from the left and right edges of the viewport (px).
const ROOM_ABOVE_PX = 40;
const EDGE_MARGIN_PX = 8;

/** Whether the tooltip of a cell goes above or below it, given the cell's top in the viewport. */
export function tooltipVertical(cellTop: number): 'above' | 'below' {
  return cellTop < ROOM_ABOVE_PX ? 'below' : 'above';
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
