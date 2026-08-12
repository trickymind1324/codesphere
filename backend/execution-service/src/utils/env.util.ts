/**
 * Environment variables always arrive as strings, so a naive truthiness
 * check turns "false" into true. Coerce explicitly.
 */
export function parseBoolEnv(
  value: string | boolean | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  return ['true', '1', 'yes'].includes(value.trim().toLowerCase());
}
