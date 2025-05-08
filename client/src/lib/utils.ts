import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Format date
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

// Calculate number of nights between two dates
export function calculateNights(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Generate random string ID (for keys in lists)
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Parse included items from JSON string
export function parseIncludedItems(includedJson: string): string[] {
  try {
    return JSON.parse(includedJson);
  } catch (e) {
    return [];
  }
}

// Parse amenities from JSON string
export function parseAmenities(amenitiesJson: string): string[] {
  try {
    return JSON.parse(amenitiesJson);
  } catch (e) {
    return [];
  }
}

// Parse itinerary from JSON string
export function parseItinerary(itineraryJson: string): Record<string, string> {
  try {
    return JSON.parse(itineraryJson);
  } catch (e) {
    return {};
  }
}
