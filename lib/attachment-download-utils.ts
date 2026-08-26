export function hasSaveableAttachmentUri(uri: string | null | undefined): boolean {
  return Boolean(uri?.trim());
}

export function sanitizeAttachmentFileName(fileName: string): string {
  const safeName = fileName.trim().replace(/[^a-zA-Z0-9._-]/g, "_");
  return safeName || "attachment";
}
