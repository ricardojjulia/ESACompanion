export interface RelativeDateResult {
  text: string;
  color: string;
  isOverdue: boolean;
}

// Returns actionable relative date text with urgency color-coding
// Pattern used by Linear, Asana, ClickUp: overdue→red, due soon→amber, future→muted
export function relativeDate(dateStr: string | undefined, isComplete?: boolean): RelativeDateResult {
  if (!dateStr) return { text: 'No date', color: 'var(--dt-colors-text-secondary)', isOverdue: false };
  if (isComplete) {
    return { text: new Date(dateStr).toLocaleDateString(), color: 'var(--dt-colors-text-secondary)', isOverdue: false };
  }
  const diffMs = new Date(dateStr).getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, color: '#ef4444', isOverdue: true };
  if (diffDays === 0) return { text: 'Due today', color: '#f59e0b', isOverdue: false };
  if (diffDays === 1) return { text: 'Due tomorrow', color: '#f59e0b', isOverdue: false };
  if (diffDays <= 7) return { text: `Due in ${diffDays}d`, color: '#f59e0b', isOverdue: false };
  return { text: new Date(dateStr).toLocaleDateString(), color: 'var(--dt-colors-text-secondary)', isOverdue: false };
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString();
}
