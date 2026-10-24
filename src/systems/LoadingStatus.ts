/** File completion is measurable; byte download progress is not supplied by Phaser. */
export function loadingStatus(completed: number, total: number) {
  if (total <= 0 || completed <= 0) return 'Downloading artwork...';
  if (completed >= total) return 'Preparing the next screen...';
  return `Preparing artwork: ${completed} of ${total} ready`;
}
