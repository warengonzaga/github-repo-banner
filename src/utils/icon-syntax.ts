export const ICON_SYNTAX_SOURCE =
  '!\\[([a-z0-9_-]+)\\](?:\\((light|dark|auto)\\))?';

export const ICON_SLUG_SANITIZE_RE = /[^a-z0-9_-]/g;

export function createIconSyntaxRegExp(flags: string = 'g'): RegExp {
  return new RegExp(ICON_SYNTAX_SOURCE, flags);
}

export function createIconSyntaxStartRegExp(flags: string = 'i'): RegExp {
  return new RegExp(`^${ICON_SYNTAX_SOURCE}`, flags);
}
