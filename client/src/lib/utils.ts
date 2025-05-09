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
export function parseIncludedItems(includedJson: string | null | undefined): string[] {
  if (!includedJson) return [];
  
  try {
    const parsed = JSON.parse(includedJson);
    
    // Handle case when it's an object but should be an array
    if (!Array.isArray(parsed)) {
      if (typeof parsed === 'object' && parsed !== null) {
        // If it's an empty object, return empty array
        if (Object.keys(parsed).length === 0) {
          return [];
        }
        // Otherwise try to convert object values to array
        return Object.values(parsed);
      }
      // If it's not an object or array, return empty array
      return [];
    }
    
    return parsed;
  } catch (e) {
    console.error("Error parsing included items:", e);
    return [];
  }
}

// Parse amenities from JSON string
export function parseAmenities(amenitiesJson: string | null | undefined): string[] {
  if (!amenitiesJson) return [];
  
  try {
    const parsed = JSON.parse(amenitiesJson);
    
    // Handle case when it's an object but should be an array
    if (!Array.isArray(parsed)) {
      if (typeof parsed === 'object' && parsed !== null) {
        // If it's an empty object, return empty array
        if (Object.keys(parsed).length === 0) {
          return [];
        }
        // Otherwise try to convert object values to array
        return Object.values(parsed);
      }
      // If it's not an object or array, return empty array
      return [];
    }
    
    return parsed;
  } catch (e) {
    console.error("Error parsing amenities:", e);
    return [];
  }
}

// Parse itinerary from JSON string
export function parseItinerary(itineraryJson: string | null | undefined): Record<string, string> {
  if (!itineraryJson) return {};
  
  try {
    const parsed = JSON.parse(itineraryJson);
    
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    
    return parsed;
  } catch (e) {
    console.error("Error parsing itinerary:", e);
    return {};
  }
}
