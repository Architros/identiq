/** Shared hover/focus styles for wizard text fields */
const wizardFieldInteractive =
  "cursor-text border border-border bg-surface text-sm text-foreground placeholder:text-muted transition-[border-color,background-color,box-shadow] duration-200 ease-out hover:border-accent/40 hover:bg-sidebar-active/50 hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus-visible:border-accent/50 focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:shadow-none";

export const wizardInputClass = `h-11 w-full rounded-xl px-4 ${wizardFieldInteractive}`;

export const wizardTextareaClass = `w-full resize-none rounded-xl px-4 py-3 ${wizardFieldInteractive}`;
