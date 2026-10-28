<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { DARK_COLORS, LIGHT_COLORS, type GrassColors } from './colors';
import { localToday } from './date';
import { describeCell, UI_TEXT } from './format';
import { buildWeeks, resolveRange, type GrassCell, type GrassDay, type WeekStart } from './grid';
import { monthLabels, weekdayLabels, type Locale } from './labels';
import { defaultLevels, isValidLevels, LEVEL_COUNT, type Levels } from './levels';
import { focusDate, moveDate } from './navigation';

const CELL_PX = 11;
const GAP_PX = 3;
const PITCH_PX = CELL_PX + GAP_PX;

const props = withDefaults(
  defineProps<{
    data: readonly GrassDay[];
    start?: string;
    end?: string;
    levels?: Levels;
    colors?: GrassColors;
    weekStart?: WeekStart;
    locale?: Locale;
    tooltip?: (cell: GrassCell) => string;
    label?: string;
  }>(),
  {
    start: undefined,
    end: undefined,
    levels: undefined,
    colors: undefined,
    weekStart: 0,
    locale: 'ja',
    tooltip: undefined,
    label: undefined,
  },
);

const selected = defineModel<string | null>('selected', { default: null });
const emit = defineEmits<{ select: [cell: GrassCell | null] }>();
defineSlots<{ tooltip?: (props: { cell: GrassCell }) => unknown }>();

const range = computed(() => resolveRange(props.start, props.end, localToday()));
const activeLevels = computed<Levels>(() =>
  props.levels && isValidLevels(props.levels) ? props.levels : defaultLevels(props.data.map((d) => d.count)),
);
const weeks = computed(() => buildWeeks(props.data, range.value, props.weekStart, activeLevels.value));
const months = computed(() => monthLabels(range.value, props.weekStart, props.locale, PITCH_PX));
const weekdays = computed(() => weekdayLabels(props.locale, props.weekStart));
const text = computed(() => UI_TEXT[props.locale]);
const tabStop = computed(() => focusDate(selected.value, range.value));

const rootStyle = computed(() => {
  const style: Record<string, string> = { '--grass-cell': `${CELL_PX}px`, '--grass-gap': `${GAP_PX}px` };
  for (let i = 0; i < LEVEL_COUNT; i += 1) {
    style[`--grass-default-light-${i}`] = LIGHT_COLORS[i];
    style[`--grass-default-dark-${i}`] = DARK_COLORS[i];
    if (props.colors) style[`--grass-color-${i}`] = props.colors[i];
  }
  return style;
});

const root = ref<HTMLElement | null>(null);
const tip = ref<{ cell: GrassCell; x: number; y: number } | null>(null);

function textOf(cell: GrassCell): string {
  return props.tooltip ? props.tooltip(cell) : describeCell(cell, props.locale);
}

function showTip(event: Event, cell: GrassCell) {
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement) || !root.value) return;
  const cellRect = target.getBoundingClientRect();
  const rootRect = root.value.getBoundingClientRect();
  tip.value = { cell, x: cellRect.left - rootRect.left + cellRect.width / 2, y: cellRect.top - rootRect.top };
}

function hideTip() {
  tip.value = null;
}

function choose(cell: GrassCell) {
  const next = selected.value === cell.date ? null : cell.date;
  selected.value = next;
  emit('select', next === null ? null : cell);
}

async function onKeydown(event: KeyboardEvent, cell: GrassCell) {
  const next = moveDate(cell.date, event.key, range.value);
  if (event.key.startsWith('Arrow')) event.preventDefault();
  if (next === null) return;
  await nextTick();
  root.value?.querySelector<HTMLElement>(`[data-date="${next}"]`)?.focus();
}
</script>

<template>
  <div ref="root" class="grass-calendar" :style="rootStyle">
    <div class="grass-calendar__scroll">
      <div class="grass-calendar__body">
        <div class="grass-calendar__months" aria-hidden="true">
          <span
            v-for="m in months"
            :key="m.column"
            class="grass-calendar__month"
            :style="{ left: `${m.column * PITCH_PX}px` }"
            >{{ m.text }}</span
          >
        </div>
        <div class="grass-calendar__weekdays" aria-hidden="true">
          <span v-for="(d, i) in weekdays" :key="i">{{ d }}</span>
        </div>
        <div class="grass-calendar__grid" role="group" :aria-label="label ?? text.label">
          <template v-for="week in weeks" :key="week.key">
            <template v-for="(cell, row) in week.cells" :key="cell?.date ?? `${week.key}-${row}`">
              <span v-if="cell === null" class="grass-calendar__blank" />
              <button
                v-else
                type="button"
                class="grass-calendar__cell"
                :class="{ 'is-missing': cell.missing, 'is-selected': cell.date === selected }"
                :style="cell.missing ? undefined : { background: `var(--grass-color-${cell.level})` }"
                :data-date="cell.date"
                :data-level="cell.level"
                :aria-label="textOf(cell)"
                :aria-pressed="cell.date === selected"
                :tabindex="cell.date === tabStop ? 0 : -1"
                @click="choose(cell)"
                @keydown="onKeydown($event, cell)"
                @pointerenter="showTip($event, cell)"
                @pointerleave="hideTip"
                @focus="showTip($event, cell)"
                @blur="hideTip"
              />
            </template>
          </template>
        </div>
      </div>
    </div>
    <div class="grass-calendar__legend" aria-hidden="true">
      <span>{{ text.less }}</span>
      <i
        v-for="level in LEVEL_COUNT"
        :key="level"
        class="grass-calendar__swatch"
        :style="{ background: `var(--grass-color-${level - 1})` }"
      />
      <span>{{ text.more }}</span>
    </div>
    <div v-if="tip" class="grass-calendar__tooltip" role="tooltip" :style="{ left: `${tip.x}px`, top: `${tip.y}px` }">
      <slot name="tooltip" :cell="tip.cell">{{ textOf(tip.cell) }}</slot>
    </div>
  </div>
</template>

<style>
.grass-calendar {
  --grass-color-0: var(--grass-default-light-0);
  --grass-color-1: var(--grass-default-light-1);
  --grass-color-2: var(--grass-default-light-2);
  --grass-color-3: var(--grass-default-light-3);
  --grass-color-4: var(--grass-default-light-4);
  --grass-text: #57606a;
  --grass-cell-edge: rgb(0 0 0 / 6%);
  --grass-missing: #8c959f;
  --grass-focus: #0a69da;
  --grass-selected: #24292f;
  --grass-tooltip-bg: #24292f;
  --grass-tooltip-text: #fff;

  position: relative;
  display: inline-block;
  max-width: 100%;
  font-size: 11px;
  color: var(--grass-text);
}

@media (prefers-color-scheme: dark) {
  .grass-calendar {
    --grass-color-0: var(--grass-default-dark-0);
    --grass-color-1: var(--grass-default-dark-1);
    --grass-color-2: var(--grass-default-dark-2);
    --grass-color-3: var(--grass-default-dark-3);
    --grass-color-4: var(--grass-default-dark-4);
    --grass-text: #9198a1;
    --grass-cell-edge: rgb(255 255 255 / 6%);
    --grass-missing: #6e7681;
    --grass-focus: #4c95f7;
    --grass-selected: #e6edf3;
    --grass-tooltip-bg: #3a4049;
    --grass-tooltip-text: #fff;
  }
}

.grass-calendar__scroll {
  overflow-x: auto;
  padding: 2px 2px 4px;
}

.grass-calendar__body {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: 16px auto;
  column-gap: 6px;
  width: max-content;
}

.grass-calendar__months {
  position: relative;
  grid-column: 2;
  grid-row: 1;
}

.grass-calendar__month {
  position: absolute;
  top: 0;
  white-space: nowrap;
  line-height: 13px;
}

.grass-calendar__weekdays {
  display: grid;
  grid-column: 1;
  grid-row: 2;
  grid-template-rows: repeat(7, var(--grass-cell));
  row-gap: var(--grass-gap);
  line-height: var(--grass-cell);
  font-size: 10px;
}

.grass-calendar__grid {
  display: grid;
  grid-column: 2;
  grid-row: 2;
  grid-auto-flow: column;
  grid-template-rows: repeat(7, var(--grass-cell));
  grid-auto-columns: var(--grass-cell);
  gap: var(--grass-gap);
}

.grass-calendar__cell,
.grass-calendar__swatch {
  box-sizing: border-box;
  width: var(--grass-cell);
  height: var(--grass-cell);
  border-radius: 2px;
  outline: 1px solid var(--grass-cell-edge);
  outline-offset: -1px;
}

.grass-calendar__cell {
  padding: 0;
  margin: 0;
  border: 0;
  cursor: pointer;
}

.grass-calendar__cell.is-missing {
  background: transparent;
  border: 1px dashed var(--grass-missing);
  outline: none;
}

.grass-calendar__cell.is-selected {
  outline: 2px solid var(--grass-selected);
  outline-offset: 0;
}

.grass-calendar__cell:focus-visible {
  outline: 2px solid var(--grass-focus);
  outline-offset: 1px;
}

.grass-calendar__legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--grass-gap);
  margin-top: 6px;
}

.grass-calendar__legend span {
  margin: 0 3px;
}

.grass-calendar__swatch {
  display: inline-block;
}

.grass-calendar__tooltip {
  position: absolute;
  z-index: 1;
  padding: 5px 8px;
  border-radius: 6px;
  background: var(--grass-tooltip-bg);
  color: var(--grass-tooltip-text);
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 6px));
}
</style>
