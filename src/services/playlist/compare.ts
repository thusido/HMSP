/** Single shared filename comparator (natural, case-insensitive). */
export function compareFileName(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}
