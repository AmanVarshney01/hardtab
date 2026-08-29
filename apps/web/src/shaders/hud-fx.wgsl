// Screen overlay for the play screen: scanlines, phosphor sweep, vignette,
// a red shockwave on a strike and an amber bloom on a win.
// Output is premultiplied alpha, drawn over the DOM.

struct Params {
  accent: vec4f,
  squiggle: vec4f,
  size: vec2f,     // device pixels
  strike: vec2f,   // strike origin, device pixels
  win: vec2f,      // win origin, device pixels
  caret: vec2f,    // caret position, device pixels; y < 0 when none
  time: f32,
  strikeAt: f32,   // time of last strike; < 0 when none
  winAt: f32,      // time of win; < 0 when none
  dpr: f32,
  motion: f32,     // 0 = reduced motion
  dark: f32,       // 1 for dark themes, 0 for light
}
@group(0) @binding(0) var<uniform> p: Params;

fn hash21(v: vec2f) -> f32 {
  var q = fract(vec3f(v.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let px = uv * p.size;
  let dpr = p.dpr;
  var rgb = vec3f(0.0);
  var a = 0.0;

  // Scanlines: darken every other device row a touch.
  let sl = 0.5 + 0.5 * sin(px.y * 3.14159265 / (1.6 * dpr));
  let scan = (1.0 - sl) * mix(0.05, 0.11, p.dark);
  a += scan;

  // Vignette toward the corners.
  let v = length((uv - 0.5) * vec2f(1.25, 1.0));
  let vig = smoothstep(0.55, 1.1, v) * mix(0.18, 0.32, p.dark);
  a += vig * (1.0 - a);

  // Slow phosphor sweep drifting down the screen.
  if (p.motion > 0.5) {
    let y = fract(p.time * 0.045) * (p.size.y + 200.0 * dpr) - 100.0 * dpr;
    let band = exp(-abs(px.y - y) / (60.0 * dpr)) * 0.045;
    rgb += p.accent.rgb * band;
    a += band * 0.3;
    // Grain.
    let g = (hash21(px + fract(p.time) * 311.0) - 0.5) * 0.05;
    rgb += vec3f(max(g, 0.0));
    a += abs(g) * 0.5;
  }

  // Caret row: a faint accent band, like a scanner beam resting on the line.
  if (p.caret.y >= 0.0) {
    let band = exp(-abs(px.y - p.caret.y) / (10.0 * dpr));
    let falloff = exp(-abs(px.x - p.caret.x) / (600.0 * dpr));
    let c = band * (0.03 + 0.05 * falloff);
    rgb += p.accent.rgb * c;
    a += c * 0.35;
  }

  // Strike: red wash + expanding shockwave ring from the caret.
  if (p.strikeAt >= 0.0) {
    let t = p.time - p.strikeAt;
    if (t >= 0.0 && t < 1.0) {
      let k = 1.0 - t;
      let r = t * 1400.0 * dpr;
      let d = abs(length(px - p.strike) - r);
      let ring = exp(-d / (22.0 * dpr)) * k * 0.9;
      let wash = k * k * 0.16;
      rgb += p.squiggle.rgb * (ring + wash);
      a += (ring * 0.6 + wash) * (1.0 - a);
    }
  }

  // Win: amber bloom that swells from the tab and a slow ring.
  if (p.winAt >= 0.0) {
    let t = p.time - p.winAt;
    if (t >= 0.0 && t < 2.2) {
      let k = 1.0 - t / 2.2;
      let dist = length(px - p.win);
      let bloom = exp(-dist / ((160.0 + 500.0 * t) * dpr)) * k * 0.85;
      let r = t * 900.0 * dpr;
      let ring = exp(-abs(dist - r) / (30.0 * dpr)) * k * 0.6;
      rgb += p.accent.rgb * (bloom + ring);
      a += (bloom * 0.45 + ring * 0.4) * (1.0 - a);
    }
  }

  return vec4f(rgb, clamp(a, 0.0, 1.0));
}
