<script setup lang="ts">
import { ref } from 'vue';
import GrassCalendar from '../src/GrassCalendar.vue';
import type { GrassCell } from '../src/grid';
import { createSampleData } from '../src/sample';

const data = createSampleData();
const selected = ref<string | null>(null);
const lastSelected = ref<GrassCell | null>(null);
const total = data.reduce((sum, d) => sum + d.count, 0);
</script>

<template>
  <main class="demo">
    <h1>vue-grass-calendar</h1>
    <section class="demo__card">
      <h2>{{ total.toLocaleString('ja') }} 件（直近 1 年）</h2>
      <GrassCalendar v-model:selected="selected" :data="data" label="日別の件数" @select="lastSelected = $event" />
      <p class="demo__note">
        選択中: {{ selected ?? 'なし' }}<template v-if="lastSelected">（{{ lastSelected.count }} 件）</template>
      </p>
    </section>
    <section class="demo__card">
      <h2>English, weeks start on Monday, custom levels</h2>
      <GrassCalendar :data="data" locale="en" :week-start="1" :levels="[1, 5, 10, 20]" label="Daily count">
        <template #tooltip="{ cell }">
          <strong>{{ cell.count }}</strong> on {{ cell.date }}
        </template>
      </GrassCalendar>
    </section>
  </main>
</template>

<style>
:root {
  color-scheme: light dark;
  --demo-bg: #fff;
  --demo-text: #1f2328;
  --demo-border: #d1d9e0;
}
@media (prefers-color-scheme: dark) {
  :root {
    --demo-bg: #0d1117;
    --demo-text: #e6edf3;
    --demo-border: #30363d;
  }
}
body {
  margin: 0;
  background: var(--demo-bg);
  color: var(--demo-text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', 'Noto Sans JP', sans-serif;
}
.demo {
  max-width: 920px;
  padding: 24px 16px;
  margin: 0 auto;
}
.demo h1 {
  font-size: 20px;
}
.demo h2 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
}
.demo__card {
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid var(--demo-border);
  border-radius: 6px;
}
.demo__note {
  margin: 8px 0 0;
  font-size: 12px;
}
</style>
