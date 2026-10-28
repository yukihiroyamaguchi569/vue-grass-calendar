export interface Box {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface Placement {
  vertical: 'above' | 'below';
  horizontal: 'center' | 'start' | 'end';
}

// Room the tooltip needs above a cell, and on each side of its center, before
// it flips below or shifts sideways to stay inside the viewport (px).
const ROOM_ABOVE_PX = 40;
const ROOM_SIDE_PX = 120;

/** Where to show the tooltip of a cell, given the cell's box in viewport coordinates. */
export function tooltipPlacement(cell: Box, viewportWidth: number): Placement {
  const center = (cell.left + cell.right) / 2;
  let horizontal: Placement['horizontal'] = 'center';
  if (center < ROOM_SIDE_PX) horizontal = 'start';
  else if (center > viewportWidth - ROOM_SIDE_PX) horizontal = 'end';
  return { vertical: cell.top < ROOM_ABOVE_PX ? 'below' : 'above', horizontal };
}
