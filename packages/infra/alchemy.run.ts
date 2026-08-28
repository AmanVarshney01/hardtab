import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

export default Alchemy.Stack(
  "find-space",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const webWorker = yield* Cloudflare.Website.Vite("web", {
      rootDir: "../../apps/web",
      main: "worker/index.ts",
      domain: { name: "hardtab.amanv.dev", aliases: ["find-space.amanv.dev"] },
      assets: {
        htmlHandling: "auto-trailing-slash",
        notFoundHandling: "single-page-application",
        runWorkerFirst: true,
      },
      dev: {
        port: 3001,
      },
    });

    return {
      web: webWorker.url,
    };
  }),
);
