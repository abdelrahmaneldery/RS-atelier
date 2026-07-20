/**
 * Short display name for a branch.
 *
 * "RS Atelier — Zamalek" reads as "Zamalek" in a compact chip. Kept in its own
 * module (no `server-only`) so the client switcher can use it too.
 */
export function branchDisplayName(branch: { name: string }): string {
  const parts = branch.name.split(/\s+[—–-]\s+/);
  return (parts.length > 1 ? parts[parts.length - 1] : branch.name).trim();
}
