const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;
const MAX_CLIENTS = 10_000;

const requests = new Map<string, { count: number; resetAt: number }>();

function clientKey(headers: Headers) {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwardedIp = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedIp || "unknown";
}

export function isActivitySummaryAllowed(headers: Headers, now = Date.now()) {
  for (const [key, entry] of requests) {
    if (entry.resetAt <= now) requests.delete(key);
  }

  const key = clientKey(headers);
  const current = requests.get(key);

  if (!current || current.resetAt <= now) {
    if (!current && requests.size >= MAX_CLIENTS) return false;
    requests.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (current.count >= MAX_REQUESTS) return false;
  current.count += 1;
  return true;
}
