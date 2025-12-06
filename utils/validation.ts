export function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== "string") {
    return false;
  }
  return /^[0-9a-fA-F]{24}$/.test(id);
}
