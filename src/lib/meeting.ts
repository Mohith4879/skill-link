/**
 * Deterministic, secret-free meeting links for bookings.
 * Uses Jitsi Meet's public instance — no account or API key needed.
 * Both participants land in the same room because the URL is derived from the booking id.
 */
export function meetingUrlForBooking(bookingId: string): string {
  // Jitsi room names: alphanumeric + dashes, room is namespaced to avoid collisions
  const room = `skilllink-${bookingId}`;
  return `https://meet.jit.si/${room}`;
}

/**
 * A session is "joinable" from 10 minutes before its start time
 * until 30 minutes after its end time.
 */
export function isJoinable(startTime?: string | null, endTime?: string | null): boolean {
  if (!startTime || !endTime) return false;
  const now = Date.now();
  const start = new Date(startTime).getTime() - 10 * 60 * 1000;
  const end = new Date(endTime).getTime() + 30 * 60 * 1000;
  return now >= start && now <= end;
}