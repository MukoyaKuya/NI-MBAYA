/** A grounded fall for enemies without an authored knockdown animation. */
export function getEnemyDefeatPose(elapsed: number, width: number, height: number, startY: number, groundY: number, direction: number) {
  const progress = Math.max(0, Math.min(1, elapsed / 420));
  const eased = progress * progress * (3 - 2 * progress);
  const radians = eased * Math.PI / 2;
  // Keep the rotated sprite's lower edge on the road at the end of the fall.
  const halfHeight = (Math.abs(Math.sin(radians)) * width + Math.abs(Math.cos(radians)) * height) / 2;
  return {
    angle: direction * eased * 90,
    offsetX: direction * 32 * (1 - (1 - progress) ** 2),
    y: startY + (groundY - halfHeight - startY) * eased,
    halfWidth: (Math.abs(Math.cos(radians)) * width + Math.abs(Math.sin(radians)) * height) / 2,
  };
}
