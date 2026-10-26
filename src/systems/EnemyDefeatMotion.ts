/** Opaque bounds in the 384px source cell, excluding transparent sprite padding. */
export type EnemyVisibleBounds = readonly [number, number, number, number];

/** Ground the visible body, rather than the transparent edge of its sprite cell. */
export function getEnemyDefeatPose(elapsed: number, width: number, height: number, startY: number, groundY: number, direction: number, bounds?: EnemyVisibleBounds) {
  const progress = Math.max(0, Math.min(1, elapsed / (bounds ? 520 : 420)));
  const eased = progress * progress * (3 - 2 * progress);
  const radians = eased * Math.PI / 2;
  const corners = bounds
    ? [
      [(bounds[0] / 384 - 0.5) * width, (bounds[1] / 384 - 0.5) * height],
      [(bounds[2] / 384 - 0.5) * width, (bounds[1] / 384 - 0.5) * height],
      [(bounds[0] / 384 - 0.5) * width, (bounds[3] / 384 - 0.5) * height],
      [(bounds[2] / 384 - 0.5) * width, (bounds[3] / 384 - 0.5) * height],
    ] : [[-width / 2, -height / 2], [width / 2, -height / 2], [-width / 2, height / 2], [width / 2, height / 2]];
  const rotated = corners.map(([x, y]) => ({
    x: x * Math.cos(radians) - direction * y * Math.sin(radians),
    y: direction * x * Math.sin(radians) + y * Math.cos(radians),
  }));
  const visibleBottom = Math.max(...rotated.map(point => point.y));
  return {
    angle: direction * eased * 90,
    offsetX: direction * 32 * (1 - (1 - progress) ** 2),
    y: startY + (groundY - visibleBottom - startY) * eased,
    halfWidth: Math.max(...rotated.map(point => Math.abs(point.x))),
  };
}
