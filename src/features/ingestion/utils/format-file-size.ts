export const KB = 1024;
export const MB = KB * 1024;

// 512 -> "512 B"
// 1536 -> "1.5 KB"
// 2621440 -> "2.5 MB"
export function formatFileSize(bytes: number): string {
  if (bytes < KB) {
    return `${bytes} B`;
  }
  if (bytes < MB) {
    return `${(bytes / KB).toFixed(1)} KB`;
  }
  return `${(bytes / MB).toFixed(1)} MB`;
}
