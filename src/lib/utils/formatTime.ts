/**
 * Formats a timestamp into a human-readable relative string according to specific rules:
 * - < 1 hour: "X min ago" (e.g., "5 min ago", "35 min ago")
 * - 1-24 hours: "X hr ago" / "X hrs ago" (e.g., "1 hr ago", "5 hrs ago")
 * - 1-10 days: "X day ago" / "X days ago"
 * - > 10 days (current year): "23 March", "26 July"
 * - > 10 days (previous years): "23 July 2025"
 */
export function formatPostTime(dateString: string): string {
    const postDate = new Date(dateString);
    const now = new Date();

    // Invalid date fallback
    if (isNaN(postDate.getTime())) return dateString;

    const diffMs = now.getTime() - postDate.getTime();

    // Handle future dates or exact match (just in case)
    if (diffMs <= 0) return "just now";

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Under 1 hour
    if (diffMins < 60) {
        if (diffMins === 0) return "just now";
        return `${diffMins} min ago`;
    }

    // Under 24 hours
    if (diffHours < 24) {
        return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    }

    // Up to 10 days
    if (diffDays <= 10) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }

    // Beyond 10 days
    const isSameYear = now.getFullYear() === postDate.getFullYear();
    const formattedDate = postDate.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        ...(isSameYear ? {} : { year: 'numeric' })
    });

    return formattedDate;
}
