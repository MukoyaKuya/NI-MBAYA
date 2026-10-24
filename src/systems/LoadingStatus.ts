/** File completion is measurable; byte download progress is not supplied by Phaser. */
export function loadingStatus(completed: number, total: number) {
  if (total <= 0 || completed <= 0) return 'Preparing fighters...';
  if (completed >= total) return 'Preparing the next screen...';
  return `Preparing fighters: ${completed} of ${total} ready`;
}
