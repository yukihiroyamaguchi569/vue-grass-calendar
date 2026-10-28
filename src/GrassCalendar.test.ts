// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GrassCalendar from './GrassCalendar.vue';
import source from './GrassCalendar.vue?raw';
import type { GrassDay } from './grid';

const RANGE = { start: '2026-10-01', end: '2026-10-31' };
const DATA: GrassDay[] = [
  { date: '2026-10-05', count: 2 },
  { date: '2026-10-06', count: 50 },
  { date: '2026-10-07', count: 3, missing: true },
];

function mountCalendar(props: Record<string, unknown> = {}, options: Record<string, unknown> = {}) {
  return mount(GrassCalendar, { props: { data: DATA, ...RANGE, ...props }, attachTo: document.body, ...options });
}

/** Declarations of the CSS rule with exactly this selector, as `property: value` pairs. */
function cssRule(selector: string): Record<string, string> {
  const start = source.indexOf(`\n${selector} {`);
  if (start < 0) return {};
  const body = source
    .slice(source.indexOf('{', start) + 1, source.indexOf('}', start))
    .replaceAll(/\/\*[\s\S]*?\*\//g, '');
  return Object.fromEntries(
    body
      .split(';')
      .map((d) => d.split(':').map((part) => part.trim()))
      .filter(([property, value]) => property && value),
  );
}

const cellOf = (wrapper: ReturnType<typeof mountCalendar>, date: string) => wrapper.get(`[data-date="${date}"]`);

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('GrassCalendar', () => {
  it('draws one button per day in the range', () => {
    const wrapper = mountCalendar();
    expect(wrapper.findAll('button.grass-calendar__cell')).toHaveLength(31);
  });

  it('colors cells by level, with the last level as a cap', () => {
    const wrapper = mountCalendar({ levels: [1, 3, 6, 10] });
    expect(cellOf(wrapper, '2026-10-05').attributes('data-level')).toBe('1');
    expect(cellOf(wrapper, '2026-10-06').attributes('data-level')).toBe('4');
    expect(cellOf(wrapper, '2026-10-06').attributes('style')).toContain('var(--grass-color-4)');
  });

  it('falls back to levels from the data when the levels prop is invalid', () => {
    const wrapper = mountCalendar({ levels: [5, 4, 3, 2] });
    expect(cellOf(wrapper, '2026-10-05').attributes('data-level')).toBe('1');
  });

  it('derives default levels from the shown days only', () => {
    const wrapper = mountCalendar({
      data: [
        { date: '2026-10-05', count: 4 },
        { date: '2026-09-01', count: 1000 },
        { date: '2026-10-06', count: 1000, missing: true },
      ],
    });
    expect(cellOf(wrapper, '2026-10-05').attributes('data-level')).toBe('4');
  });

  it('marks missing days and leaves them uncolored', () => {
    const cell = cellOf(mountCalendar(), '2026-10-07');
    expect(cell.classes()).toContain('is-missing');
    expect(cell.attributes('style')).toBeUndefined();
    expect(cell.attributes('aria-label')).toBe('2026年10月7日: 記録なし');
  });

  it('gives every cell an accessible name in the chosen locale', () => {
    expect(cellOf(mountCalendar(), '2026-10-05').attributes('aria-label')).toBe('2026年10月5日: 2 件');
    expect(cellOf(mountCalendar({ locale: 'en' }), '2026-10-05').attributes('aria-label')).toBe(
      'Oct 5, 2026: 2 contributions',
    );
  });

  it('selects a day on click and clears it on a second click', async () => {
    const wrapper = mountCalendar();
    await cellOf(wrapper, '2026-10-05').trigger('click');
    expect(wrapper.emitted('update:selected')?.[0]).toEqual(['2026-10-05']);
    expect(wrapper.emitted('select')?.[0]).toEqual([{ date: '2026-10-05', count: 2, missing: false, level: 1 }]);

    await wrapper.setProps({ selected: '2026-10-05' });
    expect(cellOf(wrapper, '2026-10-05').attributes('aria-pressed')).toBe('true');
    await cellOf(wrapper, '2026-10-05').trigger('click');
    expect(wrapper.emitted('update:selected')?.[1]).toEqual([null]);
    expect(wrapper.emitted('select')?.[1]).toEqual([null]);
  });

  it('keeps a single tab stop on the selected day, or on the last day', async () => {
    const wrapper = mountCalendar();
    const tabStops = () => wrapper.findAll('[tabindex="0"]').map((c) => c.attributes('data-date'));
    expect(tabStops()).toEqual(['2026-10-31']);
    await wrapper.setProps({ selected: '2026-10-10' });
    expect(tabStops()).toEqual(['2026-10-10']);
  });

  it('moves the tab stop with focus, so tabbing back in returns to the same cell', async () => {
    const wrapper = mountCalendar({ selected: '2026-10-10' });
    const first = cellOf(wrapper, '2026-10-10').element;
    if (first instanceof HTMLElement) first.focus();
    await cellOf(wrapper, '2026-10-10').trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement?.getAttribute('data-date')).toBe('2026-10-11');
    expect(wrapper.findAll('[tabindex="0"]').map((c) => c.attributes('data-date'))).toEqual(['2026-10-11']);
  });

  it('moves focus with the arrow keys and stays put at the edge', async () => {
    const wrapper = mountCalendar();
    const start = cellOf(wrapper, '2026-10-15');
    await start.trigger('keydown', { key: 'ArrowRight' });
    expect(document.activeElement?.getAttribute('data-date')).toBe('2026-10-22');
    await cellOf(wrapper, '2026-10-22').trigger('keydown', { key: 'ArrowUp' });
    expect(document.activeElement?.getAttribute('data-date')).toBe('2026-10-21');

    const last = cellOf(wrapper, '2026-10-31').element;
    if (last instanceof HTMLElement) last.focus();
    await cellOf(wrapper, '2026-10-31').trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement?.getAttribute('data-date')).toBe('2026-10-31');
    expect(wrapper.emitted('update:selected')).toBeUndefined();
  });

  it('uses native buttons, so Enter and Space select the focused day', () => {
    const wrapper = mountCalendar();
    expect(cellOf(wrapper, '2026-10-05').element.tagName).toBe('BUTTON');
    expect(cellOf(wrapper, '2026-10-05').attributes('type')).toBe('button');
  });

  it('shows the default tooltip on hover and hides it on leave', async () => {
    const wrapper = mountCalendar();
    await cellOf(wrapper, '2026-10-06').trigger('pointerenter');
    expect(wrapper.get('[role="tooltip"]').text()).toBe('2026年10月6日: 50 件');
    await cellOf(wrapper, '2026-10-06').trigger('pointerleave');
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
  });

  it('flips the tooltip below the cell when it would stick out of the top', async () => {
    const wrapper = mountCalendar();
    const cell = cellOf(wrapper, '2026-10-06');
    vi.spyOn(cell.element, 'getBoundingClientRect').mockReturnValue(new DOMRect(500, 50, 11, 11));
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      // A tall tooltip (80px) drawn above the cell would start at y = -36.
      return this.getAttribute('role') === 'tooltip' ? new DOMRect(400, -36, 200, 80) : new DOMRect(0, 0, 0, 0);
    });
    vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(800);
    await cell.trigger('pointerenter');
    await flushPromises();
    const tooltip = wrapper.get('[role="tooltip"]');
    expect(tooltip.classes()).toContain('is-below');
    expect(tooltip.attributes('style')).toContain('top: 61px');
  });

  it('keeps the tooltip above the cell when it fits', async () => {
    const wrapper = mountCalendar();
    const cell = cellOf(wrapper, '2026-10-06');
    vi.spyOn(cell.element, 'getBoundingClientRect').mockReturnValue(new DOMRect(500, 50, 11, 11));
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return this.getAttribute('role') === 'tooltip' ? new DOMRect(400, 14, 200, 30) : new DOMRect(0, 0, 0, 0);
    });
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1000);
    await cell.trigger('pointerenter');
    await flushPromises();
    const tooltip = wrapper.get('[role="tooltip"]');
    expect(tooltip.classes()).toContain('is-above');
    expect(tooltip.attributes('style')).toContain('top: 50px');
    expect(tooltip.attributes('style')).toContain('left: 505.5px');
  });

  it('keeps a tall tooltip above when there is no room below either', async () => {
    const wrapper = mountCalendar();
    const cell = cellOf(wrapper, '2026-10-06');
    vi.spyOn(cell.element, 'getBoundingClientRect').mockReturnValue(new DOMRect(500, 200, 11, 11));
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      // 300px tall: room above is 186px, room below 75px in a 300px viewport.
      return this.getAttribute('role') === 'tooltip' ? new DOMRect(400, -106, 200, 300) : new DOMRect(0, 0, 0, 0);
    });
    vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(300);
    await cell.trigger('pointerenter');
    await flushPromises();
    expect(wrapper.get('[role="tooltip"]').classes()).toContain('is-above');
  });

  it('moves a tooltip that would stick out of the viewport back inside', async () => {
    const wrapper = mountCalendar();
    const cell = cellOf(wrapper, '2026-10-06');
    vi.spyOn(cell.element, 'getBoundingClientRect').mockReturnValue(new DOMRect(10, 300, 11, 11));
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      // The rendered tooltip is 200px wide and centered on the cell (x = 15.5).
      return this.getAttribute('role') === 'tooltip' ? new DOMRect(-84.5, 260, 200, 30) : new DOMRect(0, 0, 0, 0);
    });
    await cell.trigger('pointerenter');
    await flushPromises();
    expect(wrapper.get('[role="tooltip"]').attributes('style')).toContain('left: 108px');
  });

  it('uses the formatCount function for the count in the tooltip and the accessible name', async () => {
    const wrapper = mountCalendar({ formatCount: (count: number) => `${count} 回` });
    expect(cellOf(wrapper, '2026-10-06').attributes('aria-label')).toBe('2026年10月6日: 50 回');
    expect(cellOf(wrapper, '2026-10-07').attributes('aria-label')).toBe('2026年10月7日: 記録なし');
    await cellOf(wrapper, '2026-10-06').trigger('focus');
    expect(wrapper.get('[role="tooltip"]').text()).toBe('2026年10月6日: 50 回');
  });

  it('lets the tooltip function win over formatCount', () => {
    const wrapper = mountCalendar({ tooltip: () => 'custom', formatCount: () => 'unused' });
    expect(cellOf(wrapper, '2026-10-06').attributes('aria-label')).toBe('custom');
  });

  it('uses the tooltip function for the tooltip and the accessible name', async () => {
    const wrapper = mountCalendar({ tooltip: (cell: { count: number }) => `${cell.count} commits` });
    expect(cellOf(wrapper, '2026-10-06').attributes('aria-label')).toBe('50 commits');
    await cellOf(wrapper, '2026-10-06').trigger('focus');
    expect(wrapper.get('[role="tooltip"]').text()).toBe('50 commits');
  });

  it('renders the tooltip slot', async () => {
    const wrapper = mountCalendar(
      {},
      { slots: { tooltip: `<template #tooltip="{ cell }"><b>{{ cell.date }}</b></template>` } },
    );
    await cellOf(wrapper, '2026-10-05').trigger('pointerenter');
    expect(wrapper.get('[role="tooltip"] b').text()).toBe('2026-10-05');
  });

  it('links custom slot content to the cell as its description', async () => {
    const wrapper = mountCalendar(
      {},
      { slots: { tooltip: `<template #tooltip="{ cell }">note for {{ cell.date }}</template>` } },
    );
    const cell = cellOf(wrapper, '2026-10-05');
    expect(cell.attributes('aria-describedby')).toBeUndefined();
    await cell.trigger('focus');
    const tooltip = wrapper.get('[role="tooltip"]');
    expect(tooltip.attributes('id')).toBeTruthy();
    expect(cell.attributes('aria-describedby')).toBe(tooltip.attributes('id'));
    expect(cellOf(wrapper, '2026-10-06').attributes('aria-describedby')).toBeUndefined();
    await cell.trigger('blur');
    expect(cell.attributes('aria-describedby')).toBeUndefined();
  });

  it('does not repeat the default text as a description', async () => {
    const wrapper = mountCalendar();
    await cellOf(wrapper, '2026-10-05').trigger('focus');
    expect(cellOf(wrapper, '2026-10-05').attributes('aria-describedby')).toBeUndefined();
  });

  it('keeps a tab stop when the selected value is not a real date', () => {
    const wrapper = mountCalendar({ selected: '2026-10-15x' });
    expect(wrapper.findAll('[tabindex="0"]').map((c) => c.attributes('data-date'))).toEqual(['2026-10-31']);
  });

  it('overrides the colors with the colors prop', () => {
    const colors = ['#000', '#111', '#222', '#333', '#444'];
    const style = mountCalendar({ colors }).get('.grass-calendar').attributes('style');
    expect(style).toContain('--grass-color-0: #000');
    expect(style).toContain('--grass-color-4: #444');
  });

  it('provides light and dark default colors as variables', () => {
    const style = mountCalendar().get('.grass-calendar').attributes('style');
    expect(style).toContain('--grass-default-light-0: #ebedf0');
    expect(style).toContain('--grass-default-dark-4: #39d353');
    expect(style).not.toContain('--grass-color-0');
  });

  it('labels months, weekdays and the legend in the chosen locale', () => {
    const ja = mountCalendar();
    expect(ja.findAll('.grass-calendar__month').map((m) => m.text())).toEqual(['10月']);
    expect(ja.get('.grass-calendar__weekdays').text()).toBe('月水金');
    expect(ja.get('.grass-calendar__legend').text()).toBe('少ない多い');
    const en = mountCalendar({ locale: 'en', weekStart: 1 });
    expect(en.get('.grass-calendar__weekdays').text()).toBe('MonWedFri');
    expect(en.get('.grass-calendar__legend').text()).toBe('LessMore');
  });

  it('defaults to the year ending today', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 28, 12));
    const wrapper = mount(GrassCalendar, { props: { data: [] } });
    const dates = wrapper.findAll('button.grass-calendar__cell').map((c) => c.attributes('data-date'));
    expect(dates[0]).toBe('2025-10-29');
    expect(dates.at(-1)).toBe('2026-10-28');
    expect(dates).toHaveLength(365);
  });

  it('names the grid, with a default per locale', () => {
    expect(mountCalendar().get('[role="group"]').attributes('aria-label')).toBe('日ごとの記録');
    expect(mountCalendar({ locale: 'en' }).get('[role="group"]').attributes('aria-label')).toBe('Daily activity');
    expect(mountCalendar({ label: 'Commits' }).get('[role="group"]').attributes('aria-label')).toBe('Commits');
  });

  it('draws nothing when start is after end', () => {
    const wrapper = mountCalendar({ start: '2026-11-01', end: '2026-10-01' });
    expect(wrapper.findAll('button')).toHaveLength(0);
  });

  it('draws the selection ring inside the focus ring when a selected day has focus', () => {
    const focus = cssRule('.grass-calendar__cell:focus-visible');
    expect(focus.outline).toBe('2px solid var(--grass-focus)');
    const both = cssRule('.grass-calendar__cell.is-selected:focus-visible');
    expect(both['box-shadow']).toBe('0 0 0 2px var(--grass-selected)');
    // The focus outline starts outside the 2px selection ring, so neither hides the other.
    expect(Number.parseFloat(both['outline-offset'])).toBeGreaterThan(2);
    // Lifted above the neighbors, which sit only a gap away.
    expect(both['z-index']).toBe('1');
  });

  it('leaves room in the scroll area for the widest focus ring, so it is not clipped', () => {
    const both = cssRule('.grass-calendar__cell.is-selected:focus-visible');
    const ring = Number.parseFloat(both['outline-offset']) + 2;
    const scroll = cssRule('.grass-calendar__scroll');
    const [, right, bottom] = scroll.padding.split(' ').map((v) => Number.parseFloat(v));
    expect(right).toBeGreaterThanOrEqual(ring);
    expect(bottom).toBeGreaterThanOrEqual(ring);
    expect(Number.parseFloat(scroll['scroll-padding-inline'])).toBeGreaterThanOrEqual(ring);
  });
});
