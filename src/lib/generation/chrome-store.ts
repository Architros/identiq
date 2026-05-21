type Listener = () => void;

let compact = false;
const listeners = new Set<Listener>();

export function setGenerationChromeCompact(value: boolean): void {
  if (compact === value) return;
  compact = value;
  if (typeof document !== "undefined") {
    document.documentElement.dataset.generationChrome = value
      ? "compact"
      : "";
    document.documentElement.style.setProperty(
      "--dashboard-topbar-height",
      value ? "2rem" : "3.5rem",
    );
  }
  listeners.forEach((l) => l());
}

export function getGenerationChromeCompact(): boolean {
  return compact;
}

export function subscribeGenerationChrome(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
