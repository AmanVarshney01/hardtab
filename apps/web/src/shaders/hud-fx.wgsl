// Screen overlay for the play screen: a faint vignette, a red shockwave on
// a strike and an amber bloom on a win.
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

  // A faint vignette so the corners sit back; nothing else at rest.
  let v = length((uv - 0.5) * vec2f(1.25, 1.0));
  a += smoothstep(0.7, 1.15, v) * mix(0.1, 0.18, p.dark);

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
