// Gap the tooltip keeps from the edges of the viewport, and from its cell (px; matches the CSS).
const EDGE_MARGIN_PX = 8;
const CELL_GAP_PX = 6;

/**
 * Whether the tooltip goes above or below its cell: above when it fits there,
 * below when it fits there instead, and otherwise on the side with more room.
 */
export function chooseVertical(
  cell: { top: number; bottom: number },
  tipHeight: number,
  viewportHeight: number,
): 'above' | 'below' {
  const roomAbove = cell.top - CELL_GAP_PX - EDGE_MARGIN_PX;
  const roomBelow = viewportHeight - EDGE_MARGIN_PX - CELL_GAP_PX - cell.bottom;
  if (tipHeight <= roomAbove) return 'above';
  if (tipHeight <= roomBelow) return 'below';
  return roomAbove >= roomBelow ? 'above' : 'below';
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
