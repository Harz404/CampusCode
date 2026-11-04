import dotenv from "dotenv";

// Resolve configuration consistently for both source and compiled entrypoints.
dotenv.config({ path: new URL("../../.env", import.meta.url) });

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret?.trim()) throw new Error("JWT_SECRET must be configured before starting the server");
  return secret;
}
