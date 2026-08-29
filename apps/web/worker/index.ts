/**
 * Cloudflare Worker in front of the static site.
 *
 * - `/og.png` renders an Open Graph card with takumi (WebAssembly, no browser).
 * - Every HTML response gets per-URL <title>/description/og:* tags so shared
 *   links unfurl with the right haystack size and, for results, the time.
 * - Everything else is passed straight through to the static assets.
 */
import { ImageResponse } from "takumi-js/response";

import { OgCard, formatDuration, type OgParams } from "./og";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const SITE_NAME = "hardtab";

function parseParams(url: URL): OgParams {
  const int = (key: string, min: number, max: number): number | undefined => {
    const raw = url.searchParams.get(key);
    if (raw === null) return undefined;
    const n = Number(raw);
    return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
  };
  return {
    lines: int("lines", 50, 1_000_000) ?? 100_000,
    seed: int("seed", 0, 2 ** 31),
    t: int("t", 1, 1000 * 60 * 60 * 24),
    w: int("w", 0, 10_000),
  };
}

function describe(p: OgParams, isPlay: boolean) {
  const linesLabel = p.lines.toLocaleString("en-US");
  if (p.t !== undefined) {
    const wrong = p.w ?? 0;
    return {
      title: `Found the tab in ${formatDuration(p.t)}${wrong > 0 ? ` (+${wrong} wrong)` : ""} — ${SITE_NAME}`,
      description: `Someone found the one tab in ${linesLabel} lines of Java in ${formatDuration(p.t)}. Same codebase, your turn.`,
    };
  }
  if (isPlay) {
    return {
      title: `One tab in ${linesLabel} lines of Java — ${SITE_NAME}`,
      description: `A specific haystack: ${linesLabel} lines of enterprise Java, one hard tab. Find it.`,
    };
  }
  return {
    title: `${SITE_NAME} — one tab in 100,000 lines of Java`,
    description: "Somewhere in 100,000 lines of enterprise Java, someone used a hard tab. Find it.",
  };
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const fontCache = new Map<string, Promise<ArrayBuffer>>();
function loadFont(env: Env, origin: string, path: string) {
  let p = fontCache.get(path);
  if (!p) {
    p = env.ASSETS.fetch(new Request(new URL(path, origin))).then((r) => {
      if (!r.ok) throw new Error(`font ${path}: ${r.status}`);
      return r.arrayBuffer();
    });
    fontCache.set(path, p);
    p.catch(() => fontCache.delete(path));
  }
  return p;
}

async function renderOg(url: URL, env: Env) {
  const params = parseParams(url);
  const [geist, mono] = await Promise.all([
    loadFont(env, url.origin, "/fonts/Geist.ttf"),
    loadFont(env, url.origin, "/fonts/GeistMono.ttf"),
  ]);
  return new ImageResponse(OgCard(params), {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Geist", data: geist },
      { name: "Geist Mono", data: mono },
    ],
    headers: {
      "cache-control": "public, max-age=86400, s-maxage=2592000",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // The old hostname is kept as an alias for DNS/TLS; redirect it here
    // (zone-level redirect rules need permissions the deploy token lacks).
    if (url.hostname === "find-space.amanv.dev") {
      url.hostname = "hardtab.amanv.dev";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/og.png") {
      return renderOg(url, env);
    }

    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return response;

    const params = parseParams(url);
    const isPlay = url.pathname.startsWith("/play");
    const meta = describe(params, isPlay);
    const og = new URL("/og.png", url.origin);
    if (isPlay) {
      for (const key of ["lines", "seed", "t", "w"] as const) {
        const v = params[key];
        if (v !== undefined) og.searchParams.set(key, String(v));
      }
    }
    const canonical = `${url.origin}${url.pathname}${isPlay ? url.search : ""}`;
    const tags = [
      `<meta property="og:type" content="website">`,
      `<meta property="og:site_name" content="${SITE_NAME}">`,
      `<meta property="og:title" content="${esc(meta.title)}">`,
      `<meta property="og:description" content="${esc(meta.description)}">`,
      `<meta property="og:url" content="${esc(canonical)}">`,
      `<meta property="og:image" content="${esc(og.toString())}">`,
      `<meta property="og:image:width" content="1200">`,
      `<meta property="og:image:height" content="630">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${esc(meta.title)}">`,
      `<meta name="twitter:description" content="${esc(meta.description)}">`,
      `<meta name="twitter:image" content="${esc(og.toString())}">`,
    ].join("\n    ");

    return new HTMLRewriter()
      .on("title", {
        element(el) {
          el.setInnerContent(meta.title);
        },
      })
      .on('meta[name="description"]', {
        element(el) {
          el.setAttribute("content", meta.description);
        },
      })
      .on("head", {
        element(el) {
          el.append(`\n    ${tags}\n`, { html: true });
        },
      })
      .transform(response);
  },
};
