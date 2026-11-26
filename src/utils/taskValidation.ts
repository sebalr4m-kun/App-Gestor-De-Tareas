export function isValidTaskTitle(title: string): boolean {
  const trimmed = title.trim();
  if (trimmed.length === 0) return false;
  return new TextEncoder().encode(trimmed).length <= 200;
}
