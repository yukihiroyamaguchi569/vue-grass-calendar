# vue-grass-calendar

日ごとの件数を「草」（contribution カレンダー風のマス目）で描く Vue 3 コンポーネント。依存は `vue`（peerDependency）だけで、Tailwind などの CSS フレームワークは使わない。

Inspired by the contribution graph on GitHub. Not affiliated with, endorsed by, or sponsored by GitHub, Inc.

## 使い方

npm にはまだ公開していない。リポジトリから入れる。

```sh
npm install yukihiroyamaguchi569/vue-grass-calendar
```

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { GrassCalendar, type GrassCell } from 'vue-grass-calendar';
import 'vue-grass-calendar/style.css';

const data = [
  { date: '2026-10-27', count: 3 },
  { date: '2026-10-28', count: 12 },
  { date: '2026-10-29', count: 0, missing: true },
];
const selected = ref<string | null>(null);
function onSelect(cell: GrassCell | null) {
  console.log(cell);
}
</script>

<template>
  <GrassCalendar v-model:selected="selected" :data="data" @select="onSelect" />
</template>
```

## props

| 名前                  | 型                                                           | 既定             | 説明                                                                                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`                | `{ date: 'YYYY-MM-DD'; count: number; missing?: boolean }[]` | （必須）         | 同じ日が複数あれば件数を足す。範囲の外、不正な日付は無視する                                                                                                                                                                      |
| `start` / `end`       | `'YYYY-MM-DD'`                                               | 直近 1 年        | `end` の既定は今日（端末の時刻）。`start` の既定は `end` の 1 年前の翌日                                                                                                                                                          |
| `levels`              | `[number, number, number, number]`                           | データから自動   | 段階 1〜4 が始まる件数。最後の値が上限になり、それ以上は最も濃い色にする（外れ値に色を取られない）。自動のときは、表示する日の記録ありの件数の 90 パーセンタイルまでを均等に割る（上限が 4 未満のときは 1 件ごとに 1 段階上がる） |
| `colors`              | `[string, string, string, string, string]`                   | 下の既定の色     | 段階 0〜4 の色。ライト・ダークの両方をこの色にする                                                                                                                                                                                |
| `weekStart`           | `0 \| 1`                                                     | `0`              | 週の始まり（0: 日曜、1: 月曜）                                                                                                                                                                                                    |
| `locale`              | `'ja' \| 'en'`                                               | `'ja'`           | 月・曜日・凡例のラベル。1 月だけ年を付け、ほかのラベルと重なるときは間引く                                                                                                                                                        |
| `tooltip`             | `(cell) => string`                                           | 日付と件数       | ツールチップと、マスの読み上げ（aria-label）の文                                                                                                                                                                                  |
| `label`               | `string`                                                     | 「日ごとの記録」 | マス目全体の読み上げ名                                                                                                                                                                                                            |
| `selected`（v-model） | `string \| null`                                             | `null`           | 選んだ日。同じマスをもう一度押すと外れる                                                                                                                                                                                          |

## イベントと slot

- `select`: マスを押したときに、そのマスの `{ date, count, missing, level }` を渡す。選択が外れたときは `null`
- `update:selected`: `v-model:selected` 用
- slot `tooltip`: `{ cell }` を受け取り、ツールチップの中身を差し替える

## 見た目とキーボード

- `missing: true` の日は点線のマスで描く
- 各マスは `<button>` で、読み上げ名が付く。Tab で入り、矢印キーで動かす（上下で 1 日、左右で 1 週）。Enter・Space で選ぶ
- ダークは `prefers-color-scheme` に従う

## 色を変える

既定の色は `src/colors.ts` の 1 か所にまとめてある。使う側では `colors` prop で渡すか、CSS 変数を上書きする。

```css
.my-page .grass-calendar {
  --grass-color-0: #eeeeee;
  --grass-color-4: #0b5d1e;
  /* ほかに --grass-text, --grass-missing, --grass-focus, --grass-selected, --grass-tooltip-bg, --grass-tooltip-text */
}
```

## 開発

```sh
npm install
npm run dev      # 見本のページ（demo/）
npm run verify   # 整形・lint・型・テスト・build
```

## ライセンス

MIT（[LICENSE](LICENSE)）。

既定の色の値は [primer/primitives](https://github.com/primer/primitives) から取った。

```text
The MIT License (MIT)

Copyright (c) 2018 GitHub Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
