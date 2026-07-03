/** Deterministic initials avatars, restricted to the greyscale + accent brief. */

const TONES = ['#1c4746', '#2e6b69', '#3f3f46', '#52525b', '#71717a'];

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function avatarColor(seed: string): string {
  return TONES[hash(seed) % TONES.length];
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
