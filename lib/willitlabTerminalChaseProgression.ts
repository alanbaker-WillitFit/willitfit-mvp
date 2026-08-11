export const TERMINAL_CHASE_LEVEL_COUNT = 10;

export type TerminalChaseLevel = {
  level: number;
  name: string;
  zone: string;
  enemyCount: number;
  enemySpeed: number;
  playerSpeed: number;
  powerDurationMs: number;
  movingBarrier: boolean;
  tunnelOpen: boolean;
  theme: "terminal" | "security" | "concourse" | "final";
};

const LEVELS: readonly TerminalChaseLevel[] = [
  { level: 1, name: "Gate Change", zone: "Concourse A", enemyCount: 2, enemySpeed: 1.65, playerSpeed: 2.35, powerDurationMs: 6500, movingBarrier: false, tunnelOpen: false, theme: "terminal" },
  { level: 2, name: "Busy Terminal", zone: "Concourse B", enemyCount: 2, enemySpeed: 1.75, playerSpeed: 2.4, powerDurationMs: 6200, movingBarrier: false, tunnelOpen: true, theme: "terminal" },
  { level: 3, name: "Security Split", zone: "Security Hall", enemyCount: 3, enemySpeed: 1.82, playerSpeed: 2.45, powerDurationMs: 5900, movingBarrier: false, tunnelOpen: true, theme: "security" },
  { level: 4, name: "Moving Walkway", zone: "Central Concourse", enemyCount: 3, enemySpeed: 1.9, playerSpeed: 2.5, powerDurationMs: 5600, movingBarrier: true, tunnelOpen: true, theme: "concourse" },
  { level: 5, name: "Gate Rush", zone: "Pier 5", enemyCount: 3, enemySpeed: 2.0, playerSpeed: 2.55, powerDurationMs: 5300, movingBarrier: true, tunnelOpen: true, theme: "concourse" },
  { level: 6, name: "Cross Terminal", zone: "Connections", enemyCount: 4, enemySpeed: 2.08, playerSpeed: 2.6, powerDurationMs: 5000, movingBarrier: true, tunnelOpen: true, theme: "concourse" },
  { level: 7, name: "Priority Route", zone: "Gate 27", enemyCount: 4, enemySpeed: 2.18, playerSpeed: 2.65, powerDurationMs: 4700, movingBarrier: true, tunnelOpen: true, theme: "security" },
  { level: 8, name: "Last Transfer", zone: "Satellite Terminal", enemyCount: 4, enemySpeed: 2.28, playerSpeed: 2.7, powerDurationMs: 4400, movingBarrier: true, tunnelOpen: true, theme: "concourse" },
  { level: 9, name: "Final Call", zone: "Departure Pier", enemyCount: 5, enemySpeed: 2.38, playerSpeed: 2.75, powerDurationMs: 4100, movingBarrier: true, tunnelOpen: true, theme: "final" },
  { level: 10, name: "Terminal Chase", zone: "New Gate", enemyCount: 5, enemySpeed: 2.5, playerSpeed: 2.8, powerDurationMs: 3800, movingBarrier: true, tunnelOpen: true, theme: "final" },
] as const;

export function buildTerminalChaseProgression(): TerminalChaseLevel[] {
  return LEVELS.map((level) => ({ ...level }));
}

export function getTerminalChaseLevel(level: number): TerminalChaseLevel {
  const safeLevel = Math.min(TERMINAL_CHASE_LEVEL_COUNT, Math.max(1, Math.floor(level)));
  return { ...LEVELS[safeLevel - 1]! };
}
