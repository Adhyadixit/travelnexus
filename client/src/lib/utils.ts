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

// Safely parse JSON with a fallback value
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    return fallback;
  }
}

// Parse included items from string (could be JSON string or plain array)
export function parseIncludedItems(includedData: string | null | undefined): string[] {
  if (!includedData) {
    console.log("parseIncludedItems: No data provided");
    return [];
  }
  
  console.log("parseIncludedItems: Parsing data:", includedData);
  
  // First check if it looks like a JSON string
  if (includedData.startsWith('[') && includedData.endsWith(']')) {
    try {
      const parsed = JSON.parse(includedData);
      console.log("parseIncludedItems: Successfully parsed JSON:", parsed);
      
      // Handle case when it's an object but should be an array
      if (!Array.isArray(parsed)) {
        if (typeof parsed === 'object' && parsed !== null) {
          // If it's an empty object, return empty array
          if (Object.keys(parsed).length === 0) {
            console.log("parseIncludedItems: Empty object, returning empty array");
            return [];
          }
          // Otherwise try to convert object values to array
          const result = Object.values(parsed).map(item => String(item));
          console.log("parseIncludedItems: Converted object to array:", result);
          return result;
        }
        // If it's not an object or array, return empty array
        console.log("parseIncludedItems: Not an object or array, returning empty array");
        return [];
      }
      
      console.log("parseIncludedItems: Returning parsed array:", parsed);
      return parsed;
    } catch (e) {
      console.error("Error parsing included items as JSON:", e);
      // If JSON parsing fails, try treating as a comma-separated list
      const result = includedData.split(',').map(item => item.trim()).filter(Boolean);
      console.log("parseIncludedItems: Parsed as comma-separated:", result);
      return result;
    }
  } else {
    console.log("parseIncludedItems: Not a JSON string, trying other formats");
    // If it doesn't look like JSON, it might be a comma-separated or newline-separated list
    // First try newlines
    if (includedData.includes('\n')) {
      const result = includedData.split('\n').map(item => item.trim()).filter(Boolean);
      console.log("parseIncludedItems: Parsed as newline-separated:", result);
      return result;
    }
    // Otherwise try commas
    const result = includedData.split(',').map(item => item.trim()).filter(Boolean);
    console.log("parseIncludedItems: Parsed as comma-separated:", result);
    return result;
  }
}

// Parse amenities from string (using same logic as parseIncludedItems)
export function parseAmenities(amenitiesData: string | null | undefined): string[] {
  if (!amenitiesData) return [];
  
  // First check if it looks like a JSON string
  if (amenitiesData.startsWith('[') && amenitiesData.endsWith(']') || 
      amenitiesData.startsWith('{') && amenitiesData.endsWith('}')) {
    try {
      const parsed = JSON.parse(amenitiesData);
      
      // Handle case when it's an object but should be an array
      if (!Array.isArray(parsed)) {
        if (typeof parsed === 'object' && parsed !== null) {
          // If it's an empty object, return empty array
          if (Object.keys(parsed).length === 0) {
            return [];
          }
          // Otherwise try to convert object values to array
          return Object.values(parsed).map(item => String(item));
        }
        // If it's not an object or array, return empty array
        return [];
      }
      
      return parsed;
    } catch (e) {
      console.error("Error parsing amenities:", e);
      // If JSON parsing fails, try treating as a comma-separated list
      return amenitiesData.split(',').map(item => item.trim()).filter(Boolean);
    }
  } else {
    // If it doesn't look like JSON, it might be a comma-separated or newline-separated list
    // First try newlines
    if (amenitiesData.includes('\n')) {
      return amenitiesData.split('\n').map(item => item.trim()).filter(Boolean);
    }
    // Otherwise try commas
    return amenitiesData.split(',').map(item => item.trim()).filter(Boolean);
  }
}

// Parse nearby attractions from string
export function parseNearbyAttractions(attractionsData: string | null | undefined): string[] {
  if (!attractionsData) {
    console.log("parseNearbyAttractions: No attractions data provided");
    return [];
  }
  
  console.log("parseNearbyAttractions: Raw data:", attractionsData);
  
  // First check if it looks like a JSON string
  if ((attractionsData.startsWith('[') && attractionsData.endsWith(']')) || 
      (attractionsData.startsWith('{') && attractionsData.endsWith('}'))) {
    try {
      const parsed = JSON.parse(attractionsData);
      console.log("parseNearbyAttractions: Successfully parsed JSON:", parsed);
      
      // Handle case when it's an object but should be an array
      if (!Array.isArray(parsed)) {
        if (typeof parsed === 'object' && parsed !== null) {
          // If it's an empty object, return empty array
          if (Object.keys(parsed).length === 0) {
            console.log("parseNearbyAttractions: Empty object, returning empty array");
            return [];
          }
          // Otherwise try to convert object values to array
          const result = Object.values(parsed).map(item => String(item));
          console.log("parseNearbyAttractions: Converted object to array:", result);
          return result;
        }
        // If it's a simple value, return it as a single-item array
        if (parsed) {
          console.log("parseNearbyAttractions: Single value, returning as array:", [String(parsed)]);
          return [String(parsed)];
        }
        // If it's not an object or array, return empty array
        console.log("parseNearbyAttractions: Not an object or array, returning empty array");
        return [];
      }
      
      console.log("parseNearbyAttractions: Returning parsed array:", parsed);
      return parsed;
    } catch (e) {
      console.error("Error parsing attractions as JSON:", e);
      // If it doesn't look like valid JSON, try treating as a comma/newline separated list
    }
  }
  
  console.log("parseNearbyAttractions: Not a JSON string, trying other formats");
  // If it doesn't look like JSON or JSON parsing failed, try other formats
  
  // First check for newlines
  if (attractionsData.includes('\n')) {
    const result = attractionsData.split('\n').map(item => item.trim()).filter(Boolean);
    console.log("parseNearbyAttractions: Parsed as newline-separated:", result);
    return result;
  }
  
  // Otherwise try commas
  const result = attractionsData.split(',').map(item => item.trim()).filter(Boolean);
  console.log("parseNearbyAttractions: Parsed as comma-separated:", result);
  return result;
}

// Type definitions for itinerary data
export interface ItineraryDayActivity {
  id: string;
  name: string;
  description?: string;
  isOptional?: boolean;
  price?: number;
}

export interface ItineraryDayContent {
  title: string;
  description?: string;
  hotel?: string;
  location?: string;
  meals?: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  activities?: ItineraryDayActivity[];
}

export interface ItineraryData {
  [key: string]: ItineraryDayContent;
}

// Parse itinerary from JSON string
export function parseItinerary(itineraryJson: string | null | undefined): ItineraryData {
  if (!itineraryJson) return {};
  
  try {
    const parsed = JSON.parse(itineraryJson);
    
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      console.warn("Itinerary is not a proper object:", parsed);
      return {};
    }
    
    // Validate and transform the structure if needed
    const result: ItineraryData = {};
    
    // Loop through each day and ensure it has the required structure
    Object.entries(parsed).forEach(([dayKey, dayContent]) => {
      if (typeof dayContent === 'object' && dayContent !== null) {
        // It's already an object with our expected structure
        result[dayKey] = dayContent as ItineraryDayContent;
      } else if (typeof dayContent === 'string') {
        // It's a simple string, convert it to our new format
        result[dayKey] = {
          title: dayContent,
          description: '',
          activities: []
        };
      }
    });
    
    return result;
  } catch (e) {
    console.error("Error parsing itinerary:", e);
    return {};
  }
}
