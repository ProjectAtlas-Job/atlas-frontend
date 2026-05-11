function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export function getPublicApiBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_URL;

  if (!value) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return normalizeBaseUrl(value);
}

export function getServerApiBaseUrl() {
  const value = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

  if (!value) {
    throw new Error("API_URL or NEXT_PUBLIC_API_URL must be configured.");
  }

  return normalizeBaseUrl(value);
}
