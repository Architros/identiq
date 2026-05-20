export function chatTitleFromPrompt(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) return "New chat";
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}…` : trimmed;
}
