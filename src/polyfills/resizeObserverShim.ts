// Lightweight ResizeObserver shim that uses getBoundingClientRect + requestAnimationFrame
// Replaces window.ResizeObserver to avoid native ResizeObserver loop issues in some browsers.
// This is intentionally simple and only implements observe/unobserve/disconnect used by libs.

type ROCallback = (entries: Array<{ target: Element; contentRect: DOMRect }>, observer: any) => void;

class ResizeObserverShim {
  private cb: ROCallback;
  private targets: Map<Element, DOMRect>;
  private running: boolean;
  private rafId: number | null;

  constructor(callback: ROCallback) {
    this.cb = callback;
    this.targets = new Map();
    this.running = false;
    this.rafId = null;
  }

  observe(target: Element) {
    if (!target || typeof target.getBoundingClientRect !== 'function') return;
    try {
      const rect = target.getBoundingClientRect();
      this.targets.set(target, rect);
    } catch (e) {
      // ignore
    }
    if (!this.running) this.start();
  }

  unobserve(target: Element) {
    this.targets.delete(target);
    if (this.targets.size === 0) this.stop();
  }

  disconnect() {
    this.targets.clear();
    this.stop();
  }

  private start() {
    if (this.running) return;
    this.running = true;
    const step = () => {
      this.check();
      this.rafId = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame(step) : null;
    };
    this.rafId = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame(step) : null;
  }

  private stop() {
    this.running = false;
    if (this.rafId != null) {
      try { cancelAnimationFrame(this.rafId); } catch (e) {}
      this.rafId = null;
    }
  }

  private check() {
    if (!this.running) return;
    const entries: Array<{ target: Element; contentRect: DOMRect }> = [];
    for (const [el, oldRect] of Array.from(this.targets.entries())) {
      try {
        const r = el.getBoundingClientRect();
        if (
          !oldRect ||
          r.width !== oldRect.width ||
          r.height !== oldRect.height ||
          r.top !== oldRect.top ||
          r.left !== oldRect.left
        ) {
          this.targets.set(el, r);
          entries.push({ target: el, contentRect: r });
        }
      } catch (e) {
        // if element is detached or cross-origin, ignore
      }
    }

    if (entries.length > 0) {
      try {
        this.cb(entries, this);
      } catch (e) {
        // swallow errors from callbacks
      }
    }
  }
}

try {
  const w: any = window as any;
  if (!w.__resizeObserverShimInstalled) {
    w.__originalResizeObserver = w.ResizeObserver;
    // override unconditionally to avoid native RO loop problems
    w.ResizeObserver = ResizeObserverShim as any;
    w.__resizeObserverShimInstalled = true;
  }
} catch (e) {
  // ignore if environment doesn't allow
}

export {};
