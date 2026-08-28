// Minimal ambient types for the Cloudflare Worker entry. The app's tsconfig
// uses the DOM lib, which conflicts with @cloudflare/workers-types, so only
// the handful of runtime globals the worker touches are declared here.

interface HTMLRewriterElement {
  setAttribute(name: string, value: string): this;
  setInnerContent(content: string, options?: { html?: boolean }): this;
  append(content: string, options?: { html?: boolean }): this;
}

interface HTMLRewriterHandlers {
  element?(element: HTMLRewriterElement): void | Promise<void>;
}

declare class HTMLRewriter {
  on(selector: string, handlers: HTMLRewriterHandlers): this;
  transform(response: Response): Response;
}
