/**
 * Utility formatters for Dayflow HRMS
 */

// Format Currency to Indian Rupee format (e.g. ₹25,000.00)
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format Date string to clean readable date (e.g. 22 Oct 2026 or 22/10/2026)
export function formatDate(dateString: string | null | undefined, format: 'short' | 'long' = 'short'): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  if (format === 'long') {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Format Decimal Hours to HH:MM (e.g. 9.00 -> 09:00, 1.50 -> 01:30)
export function formatHours(decimalHours: number | null | undefined): string {
  if (decimalHours === null || decimalHours === undefined || isNaN(decimalHours)) return '00:00';
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Format Timestamp to Time String (e.g. 10:00)
export function formatTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
