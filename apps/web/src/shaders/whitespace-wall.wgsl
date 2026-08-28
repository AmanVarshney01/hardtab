// The whitespace wall: an editor with "render whitespace" switched on,
// scrolling past. Indent markers, faint code, and one tab arrow.

struct Params {
  ink: vec4f,
  paper: vec4f,
  accent: vec4f,
  size: vec2f,    // canvas size in device pixels
  cell: vec2f,    // cell size in device pixels
  mouse: vec2f,   // pointer in device pixels; x < 0 when absent
  tab: vec2f,     // (column, row within period) of the tab
  time: f32,
  motion: f32,    // 0 = reduced motion
  hover: f32,     // 1 when the pointer is over the tab
  found: f32,     // 1 once the tab has been clicked
  period: f32,    // rows before the pattern repeats
  dpr: f32,
}
@group(0) @binding(0) var<uniform> params: Params;

fn hash21(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

fn seg(p: vec2f, a: vec2f, b: vec2f) -> f32 {
  let pa = p - a;
  let ba = b - a;
  let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

fn line_alpha(d: f32, thickness: f32, dpr: f32) -> f32 {
  return 1.0 - smoothstep(thickness - 0.7 * dpr, thickness + 0.7 * dpr, d);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let dpr = params.dpr;
  let px = uv * params.size;
  let scroll = params.time * params.motion * 14.0 * dpr;
  let gp = vec2f(px.x, px.y + scroll);
  let cellIdx = floor(gp / params.cell);
  let local = (gp - cellIdx * params.cell) / params.cell;
  let col = cellIdx.x;
  let row = cellIdx.y;
  let prow = row - floor(row / params.period) * params.period;

  // Shape of this line of "code".
  let rh = hash21(vec2f(prow, 7.0));
  let rh2 = hash21(vec2f(prow, 13.0));
  let rh3 = hash21(vec2f(prow, 29.0));
  var indent = floor(rh * rh * 11.0) * 4.0;
  let len = 10.0 + floor(rh2 * rh2 * 110.0);
  let blank = hash21(vec2f(prow, 3.0)) < 0.14;
  let tabRow = prow == params.tab.y;
  if (tabRow) {
    indent = max(indent, params.tab.x + 4.0);
  }

  var color = params.ink.rgb;

  if (!blank) {
    let inTab = tabRow && col >= params.tab.x && col < params.tab.x + 4.0;
    if (inTab) {
      // One tab, rendered the way editors do: a long arrow across its width.
      let x0 = params.tab.x * params.cell.x;
      let w = 4.0 * params.cell.x;
      let p = vec2f((gp.x - x0) / w, local.y);
      let aspect = w / params.cell.y;
      let q = vec2f(p.x * aspect, p.y) * params.cell.y; // to pixels
      let y = 0.5 * params.cell.y;
      let shaft = seg(q, vec2f(0.14 * w, y), vec2f(0.84 * w, y));
      let head1 = seg(q, vec2f(0.84 * w, y), vec2f(0.84 * w - 0.32 * params.cell.y, y - 0.3 * params.cell.y));
      let head2 = seg(q, vec2f(0.84 * w, y), vec2f(0.84 * w - 0.32 * params.cell.y, y + 0.3 * params.cell.y));
      let d = min(shaft, min(head1, head2));
      let lit = max(params.hover, params.found);
      let a = line_alpha(d, 0.9 * dpr, dpr);
      let base = mix(params.paper.rgb, params.accent.rgb, lit);
      let strength = mix(0.42, 1.0, lit);
      color = mix(color, base, a * strength);
      // Glow when lit.
      let glow = exp(-d / (4.0 * dpr)) * 0.45 * lit;
      color = mix(color, params.accent.rgb, glow);
    } else if (col < indent) {
      // Leading whitespace: the dot editors draw for a space.
      let d = length((local - 0.5) * params.cell);
      let r = 1.05 * dpr;
      let a = 1.0 - smoothstep(r - 0.8 * dpr, r + 0.8 * dpr, d);
      color = mix(color, params.paper.rgb, a * 0.3);
    } else if (col < indent + len) {
      // Code: token bars broken by gaps, a few tinted like keywords.
      let tokenLen = 3.0 + floor(rh3 * 6.0);
      let ti = floor((col - indent) / tokenLen);
      let tpos = (col - indent) - ti * tokenLen;
      let th = hash21(vec2f(ti, prow));
      let gap = tpos == 0.0 && th < 0.55;
      if (!gap) {
        let by = abs(local.y - 0.5) * params.cell.y;
        let a = 1.0 - smoothstep(0.16 * params.cell.y, 0.22 * params.cell.y, by);
        let keyword = th > 0.86;
        let tint = mix(params.paper.rgb, params.accent.rgb, select(0.0, 0.7, keyword));
        color = mix(color, tint, a * select(0.075, 0.13, keyword));
      }
    }
  }

  // The pointer is a drag-selection: one row, a handful of columns.
  if (params.mouse.x >= 0.0) {
    let mrow = floor((params.mouse.y + scroll) / params.cell.y);
    let mcol = floor(params.mouse.x / params.cell.x);
    if (row == mrow && col >= mcol - 5.0 && col <= mcol) {
      color = mix(color, params.accent.rgb, 0.22);
    }
    // Caret at the pointer's cell edge.
    let caretX = (mcol + 1.0) * params.cell.x;
    let caret = step(abs(gp.x - caretX), 1.0 * dpr) * step(abs(row - mrow), 0.5);
    color = mix(color, params.accent.rgb, caret * 0.9);
  }

  // Fade toward the page background at the edges, plus a breath of grain.
  let v = length((uv - 0.5) * vec2f(0.9, 1.25));
  color = mix(color, params.ink.rgb, smoothstep(0.45, 0.95, v) * 0.6);
  color += (hash21(px + fract(params.time) * 100.0) - 0.5) * 0.02;

  return vec4f(color, 1.0);
}
