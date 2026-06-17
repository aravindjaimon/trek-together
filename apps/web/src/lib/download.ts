/** Trigger a browser download of in-memory text content (export payloads, T7.7). */
export function downloadText(filename: string, contentType: string, content: string): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
