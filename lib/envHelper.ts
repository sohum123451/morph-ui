/**
 * Retrieves an environment variable and optionally throws if it is missing.
 * This centralises guard logic so that missing secrets surface early and with
 * a clear message.
 */
export function getEnv(name: string, required: boolean = true): string | undefined {
  const value = process.env[name];
  if (required && (!value || !value.trim())) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export default getEnv;
