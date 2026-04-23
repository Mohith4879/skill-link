// Lightweight slug helpers for subject pages.
export function subjectToSlug(subject: string): string {
  return subject
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugMatchesSubject(slug: string, subject: string): boolean {
  return subjectToSlug(subject) === slug;
}