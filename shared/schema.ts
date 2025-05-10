import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json, primaryKey, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User role enum
export const roleEnum = pgEnum('role', ['user', 'admin']);

// Define the totalAmount field alias for totalPrice in bookings
// This helps with compatibility in components that expect totalAmount
export const totalAmount = (booking: { totalPrice: number }) => booking.totalPrice;

// Users table
export const users = pgTable('users', {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phoneNumber: text("phone_number"),
  role: roleEnum("role").default('user').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

// Destinations table
export const destinations = pgTable('destinations', {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description").notNull(),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Destination relations
export const destinationsRelations = relations(destinations, ({ many }) => ({
  packages: many(packages),
  hotels: many(hotels),
  events: many(events),
}));

// Packages table
export const packages = pgTable('packages', {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  destinationId: integer("destination_id").references(() => destinations.id, { onDelete: 'cascade' }),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // In days
  price: doublePrecision("price").notNull(),
  imageUrl: text("image_url").notNull(),
  imageGallery: text("image_gallery"), // JSON string of additional images
  included: text("included").notNull(), // JSON string of included items
  excluded: text("excluded"), // JSON string of excluded items
  rating: doublePrecision("rating"),
  reviewCount: integer("review_count").default(0),
  trending: boolean("trending").default(false),
  featured: boolean("featured").default(false),
  itinerary: text("itinerary"), // JSON string of day-by-day activities
  hotels: text("hotels"), // JSON string of included hotels
  flightIncluded: boolean("flight_included").default(false),
  visaRequired: boolean("visa_required").default(false),
  visaAssistance: boolean("visa_assistance").default(false),
  typeOfTour: text("type_of_tour"), // Group, Private, Customizable
  citiesCovered: text("cities_covered"), // JSON array of cities included
  meals: text("meals"), // JSON object indicating which meals are included
  startingDates: text("starting_dates"), // JSON array of available start dates
  travelMode: text("travel_mode"), // Flight/Train/Bus
  minTravelers: integer("min_travelers").default(1),
  customizable: boolean("customizable").default(false),
  highlights: text("highlights"), // JSON array of tour highlights
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Package relations
export const packagesRelations = relations(packages, ({ one, many }) => ({
  destination: one(destinations, {
    fields: [packages.destinationId],
    references: [destinations.id],
  }),
  bookings: many(bookings),
}));

// Define hotel type enum
export const hotelTypeEnum = pgEnum('hotel_type', ['hotel', 'resort', 'villa', 'independent_house']);

// Hotels table
export const hotels = pgTable('hotels', {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  destinationId: integer("destination_id").references(() => destinations.id, { onDelete: 'cascade' }),
  description: text("description").notNull(),
  address: text("address").notNull(),
  imageUrl: text("image_url").notNull(),
  imageGallery: text("image_gallery"), // JSON string of additional images
  rating: integer("rating").notNull(), // 1-5 stars
  price: doublePrecision("price").notNull(), // per night
  amenities: text("amenities").notNull(), // JSON string of amenities
  reviewCount: integer("review_count").default(0),
  userRating: doublePrecision("user_rating"), // Average out of 10 from user reviews
  checkIn: text("check_in"), // Check-in time
  checkOut: text("check_out"), // Check-out time
  policies: text("policies"), // Hotel policies JSON
  languagesSpoken: text("languages_spoken"), // JSON array of languages
  nearbyAttractions: text("nearby_attractions"), // JSON array of nearby places
  featured: boolean("featured").default(false),
  freeCancellation: boolean("free_cancellation").default(false),
  roomTypes: text("room_types"), // JSON string of available room types with details
  hotelType: hotelTypeEnum("hotel_type").default('hotel'), // Type of accommodation
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Hotel room types table (separate from JSON for better management)
export const hotelRoomTypes = pgTable('hotel_room_types', {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").notNull().references(() => hotels.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  capacity: integer("capacity").notNull(), // Number of guests
  amenities: text("amenities").notNull(), // JSON string of room amenities
  cancellationPolicy: text("cancellation_policy"),
  featured: boolean("featured").default(false),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Hotel room images table (separate from room types for better management)
export const hotelRoomImages = pgTable('hotel_room_images', {
  id: serial("id").primaryKey(),
  roomTypeId: integer("room_type_id").notNull().references(() => hotelRoomTypes.id, { onDelete: 'cascade' }),
  imageUrl: text("image_url").notNull(),
  displayOrder: integer("display_order").default(0), // For ordering images
  caption: text("caption"),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Hotel relations
export const hotelsRelations = relations(hotels, ({ one, many }) => ({
  destination: one(destinations, {
    fields: [hotels.destinationId],
    references: [destinations.id],
  }),
  bookings: many(bookings),
  roomTypes: many(hotelRoomTypes)
}));

// Hotel room types relations
export const hotelRoomTypesRelations = relations(hotelRoomTypes, ({ one, many }) => ({
  hotel: one(hotels, {
    fields: [hotelRoomTypes.hotelId],
    references: [hotels.id],
  }),
  images: many(hotelRoomImages)
}));

// Hotel room images relations
export const hotelRoomImagesRelations = relations(hotelRoomImages, ({ one }) => ({
  roomType: one(hotelRoomTypes, {
    fields: [hotelRoomImages.roomTypeId],
    references: [hotelRoomTypes.id],
  })
}));

// Drivers for cab bookings
export const drivers = pgTable('drivers', {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  destinationId: integer("destination_id").references(() => destinations.id, { onDelete: 'cascade' }),
  imageUrl: text("image_url").notNull(),
  carModel: text("car_model").notNull(),
  languages: text("languages").notNull(),
  dailyRate: doublePrecision("daily_rate").notNull(),
  profileImageUrl: text("profile_image_url").notNull(),
  rating: doublePrecision("rating"),
  reviewCount: integer("review_count").default(0),
  available: boolean("available").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Driver relations
export const driversRelations = relations(drivers, ({ one, many }) => ({
  destination: one(destinations, {
    fields: [drivers.destinationId],
    references: [destinations.id],
  }),
  bookings: many(bookings),
}));

// Cabs table
export const cabs = pgTable('cabs', {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  destinationId: integer("destination_id").references(() => destinations.id, { onDelete: 'cascade' }),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  imageGallery: text("image_gallery"), // JSON string of additional images
  type: text("type").notNull(), // sedan, suv, luxury, etc.
  pricePerDay: doublePrecision("price_per_day").notNull(),
  seats: integer("seats").notNull(),
  bags: integer("bags").default(2),
  features: text("features").notNull(), // JSON string of features
  addons: text("addons"), // JSON array of available add-ons (child seat, wifi, etc.)
  acAvailable: boolean("ac_available").default(true),
  freeCancellation: boolean("free_cancellation").default(false),
  cancellationTimeframe: text("cancellation_timeframe"), // e.g. "24h before pickup"
  driverVerified: boolean("driver_verified").default(true),
  available: boolean("available").default(true),
  rating: doublePrecision("rating"),
  fareBreakdown: text("fare_breakdown"), // JSON for fare details (base, taxes, etc.)
  tollsIncluded: boolean("tolls_included").default(false),
  multipleStops: boolean("multiple_stops").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cab relations
export const cabsRelations = relations(cabs, ({ one, many }) => ({
  destination: one(destinations, {
    fields: [cabs.destinationId],
    references: [destinations.id],
  }),
  bookings: many(bookings),
}));

// Cruises table
export const cruises = pgTable('cruises', {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company").notNull(),
  shipName: text("ship_name"), // Name of the cruise ship
  imageUrl: text("image_url").notNull(),
  imageGallery: text("image_gallery"), // JSON string of additional images
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // In days
  price: doublePrecision("price").notNull(), // per person
  departure: text("departure").notNull(), // City of departure
  returnPort: text("return_port"), // Return destination (might be different)
  departureDate: timestamp("departure_date"), // Scheduled departure date
  boardingTime: text("boarding_time"), // Boarding time
  itinerary: text("itinerary").notNull(), // JSON string of itinerary with ports and dates
  portsOfCall: text("ports_of_call"), // JSON array of visited ports
  daysAtSea: integer("days_at_sea").default(0),
  cabinTypes: text("cabin_types"), // JSON of different cabin options
  amenities: text("amenities"), // JSON of onboard amenities
  dining: text("dining"), // JSON of dining options 
  entertainment: text("entertainment"), // JSON of entertainment options
  shipDetails: text("ship_details"), // JSON of ship specs (year built, size, etc.)
  includedServices: text("included_services"), // JSON of what's included
  excludedServices: text("excluded_services"), // JSON of what's not included
  rating: doublePrecision("rating"),
  reviewCount: integer("review_count").default(0),
  featured: boolean("featured").default(false),
  familyFriendly: boolean("family_friendly").default(true),
  adultOnly: boolean("adult_only").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cruise cabin types table
export const cruiseCabinTypes = pgTable('cruise_cabin_types', {
  id: serial("id").primaryKey(),
  cruiseId: integer("cruise_id").notNull().references(() => cruises.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  image: text("image").notNull(),
  features: text("features").notNull(), // JSON string of features
  availability: integer("availability").default(10),
  capacity: integer("capacity").default(2),
  featured: boolean("featured").default(false),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cruise relations
export const cruisesRelations = relations(cruises, ({ many }) => ({
  bookings: many(bookings),
  cabinTypes: many(cruiseCabinTypes)
}));

// Cruise cabin types relations
export const cruiseCabinTypesRelations = relations(cruiseCabinTypes, ({ one }) => ({
  cruise: one(cruises, {
    fields: [cruiseCabinTypes.cruiseId],
    references: [cruises.id],
  })
}));

// Events table
export const events = pgTable('events', {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  destinationId: integer("destination_id").references(() => destinations.id, { onDelete: 'cascade' }),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  endDate: timestamp("end_date"), // For multi-day events
  startTime: text("start_time"),
  endTime: text("end_time"),
  location: text("location").notNull(),
  venueName: text("venue_name"),
  address: text("address"),
  imageUrl: text("image_url").notNull(),
  imageGallery: text("image_gallery"), // JSON string of additional images
  price: doublePrecision("price").notNull(),
  ticketTypes: text("ticket_types"), // JSON of different ticket options
  eventType: text("event_type"), // Concert, Festival, Workshop, etc.
  categories: text("categories"), // JSON array of event categories
  performers: text("performers"), // JSON array of artists, speakers, etc.
  schedule: text("schedule"), // JSON of detailed schedule for multi-day events
  amenities: text("amenities"), // JSON of venue amenities
  restrictions: text("restrictions"), // Age restrictions, dress code, etc.
  organizer: text("organizer"),
  available: boolean("available").default(true),
  capacity: integer("capacity").notNull(),
  seatedEvent: boolean("seated_event").default(false),
  virtualEvent: boolean("virtual_event").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Event relations
export const eventsRelations = relations(events, ({ one, many }) => ({
  destination: one(destinations, {
    fields: [events.destinationId],
    references: [destinations.id],
  }),
  bookings: many(bookings),
}));

// Booking type enum
export const bookingTypeEnum = pgEnum('booking_type', ['package', 'hotel', 'driver', 'cruise', 'event']);

// Bookings table
export const bookings = pgTable('bookings', {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  bookingType: bookingTypeEnum("booking_type").notNull(),
  itemId: integer("item_id").notNull(), // References the ID of the booked item (package, hotel, etc.)
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalPrice: doublePrecision("total_price").notNull(),
  status: text("status").notNull(), // pending, confirmed, cancelled, completed
  guestCount: integer("guest_count").notNull(),
  paymentStatus: text("payment_status").notNull(), // paid, unpaid
  confirmationCode: text("confirmation_code"), // Unique booking reference number
  specialRequests: text("special_requests"), // Any customer requests
  roomType: text("room_type"), // For hotel bookings
  cabinType: text("cabin_type"), // For cruise bookings
  packageType: text("package_type"), // For package bookings
  ticketType: text("ticket_type"), // For event bookings
  vehicleType: text("vehicle_type"), // For cab bookings
  contactPhone: text("contact_phone"), // Emergency contact
  contactEmail: text("contact_email"), // Confirmation email
  // Billing/shipping address details
  address: text("address"), // Street address
  city: text("city"), // City
  state: text("state"), // State/province
  zipCode: text("zip_code"), // Postal/zip code
  country: text("country").default('USA'), // Country
  // Additional booking details
  adultCount: integer("adult_count"), // Number of adults
  childCount: integer("child_count"), // Number of children
  infantCount: integer("infant_count"), // Number of infants
  paymentMethod: text("payment_method"), // Credit card, PayPal, etc.
  transactionId: text("transaction_id"), // Payment processor transaction reference
  cancellable: boolean("cancellable").default(true), 
  cancellationPolicy: text("cancellation_policy"), // Free until X hours before
  additionalServices: text("additional_services"), // JSON of add-on services
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payment details table for securely storing payment information
export const paymentDetails = pgTable('payment_details', {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id, { onDelete: 'cascade' }).notNull(),
  cardName: text("card_name").notNull(),
  cardNumber: text("card_number").notNull(), // Last 4 digits only for security
  cardExpiry: text("card_expiry").notNull(),
  cardCVC: text("card_cvc"), // This should be removed after processing and not stored
  // Billing address information
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country").default('USA'),
  // Additional payment metadata
  paymentProcessor: text("payment_processor"), // e.g., "stripe", "paypal"
  transactionId: text("transaction_id"), // Reference ID from payment processor
  paymentStatus: text("payment_status").default('pending'), // pending, success, failed
  errorMessage: text("error_message"), // Store any payment processing errors
  amount: doublePrecision("amount").notNull(), // Total amount charged
  currency: text("currency").default('USD'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payment details relations
export const paymentDetailsRelations = relations(paymentDetails, ({ one }) => ({
  booking: one(bookings, {
    fields: [paymentDetails.bookingId],
    references: [bookings.id],
  }),
}));

// Booking relations
export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  package: one(packages, {
    fields: [bookings.itemId],
    references: [packages.id],
  }),
  hotel: one(hotels, {
    fields: [bookings.itemId],
    references: [hotels.id],
  }),
  driver: one(drivers, {
    fields: [bookings.itemId],
    references: [drivers.id],
  }),
  cruise: one(cruises, {
    fields: [bookings.itemId],
    references: [cruises.id],
  }),
  event: one(events, {
    fields: [bookings.itemId],
    references: [events.id],
  }),
  paymentDetails: many(paymentDetails),
}));

// Reviews table
export const reviews = pgTable('reviews', {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  itemType: text("item_type").notNull(), // hotel, package, cruise, driver, event
  itemId: integer("item_id").notNull(), // The ID of the item being reviewed
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title").notNull(),
  comment: text("comment").notNull(),
  dateOfStay: timestamp("date_of_stay"), // For hotel reviews
  images: text("images"), // Optional JSON array of image URLs uploaded by reviewer
  helpfulVotes: integer("helpful_votes").default(0),
  verified: boolean("verified").default(false), // Indicates if this is from a verified stay
  response: text("response"), // Response from the property/provider
  responseDate: timestamp("response_date"),
  status: text("status").default("approved"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Review relations
export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  hotel: one(hotels, {
    fields: [reviews.itemId],
    references: [hotels.id],
  }),
  package: one(packages, {
    fields: [reviews.itemId],
    references: [packages.id],
  }),
  cruise: one(cruises, {
    fields: [reviews.itemId],
    references: [cruises.id],
  }),
  driver: one(drivers, {
    fields: [reviews.itemId],
    references: [drivers.id],
  }),
  event: one(events, {
    fields: [reviews.itemId],
    references: [events.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,
  role: true,
});

export const insertDestinationSchema = createInsertSchema(destinations).pick({
  name: true,
  country: true,
  imageUrl: true,
  description: true,
  featured: true,
});

export const insertPackageSchema = createInsertSchema(packages).pick({
  name: true,
  destinationId: true,
  description: true,
  duration: true,
  price: true,
  imageUrl: true,
  imageGallery: true,
  included: true,
  excluded: true,
  trending: true,
  featured: true,
  itinerary: true,
  hotels: true,
  flightIncluded: true,
  visaRequired: true,
  visaAssistance: true,
  typeOfTour: true,
  citiesCovered: true,
  meals: true,
  startingDates: true,
  travelMode: true,
  minTravelers: true,
  customizable: true,
  highlights: true,
});

export const insertHotelSchema = createInsertSchema(hotels).pick({
  name: true,
  destinationId: true,
  description: true,
  address: true,
  imageUrl: true,
  imageGallery: true,
  rating: true,
  price: true,
  amenities: true,
  userRating: true,
  checkIn: true,
  checkOut: true,
  policies: true,
  languagesSpoken: true,
  nearbyAttractions: true,
  featured: true,
  freeCancellation: true,
  roomTypes: true,
  hotelType: true,
});

export const insertDriverSchema = createInsertSchema(drivers).pick({
  name: true,
  destinationId: true,
  imageUrl: true,
  carModel: true,
  languages: true,
  dailyRate: true,
  profileImageUrl: true,
  available: true,
});

export const insertCruiseSchema = createInsertSchema(cruises).pick({
  name: true,
  company: true,
  shipName: true,
  imageUrl: true,
  imageGallery: true,
  description: true,
  duration: true,
  price: true,
  departure: true,
  returnPort: true,
  departureDate: true,
  boardingTime: true,
  itinerary: true,
  portsOfCall: true,
  daysAtSea: true,
  cabinTypes: true,
  amenities: true,
  dining: true,
  entertainment: true,
  shipDetails: true,
  includedServices: true,
  excludedServices: true,
  rating: true,
  featured: true,
  familyFriendly: true,
  adultOnly: true,
});

export const insertEventSchema = createInsertSchema(events).pick({
  name: true,
  destinationId: true,
  description: true,
  date: true,
  location: true,
  imageUrl: true,
  price: true,
  available: true,
  capacity: true,
});

export const insertCabSchema = createInsertSchema(cabs).pick({
  name: true,
  destinationId: true,
  description: true,
  imageUrl: true,
  type: true,
  pricePerDay: true,
  seats: true,
  features: true,
  available: true,
});

export const insertBookingSchema = createInsertSchema(bookings).pick({
  userId: true,
  bookingType: true,
  itemId: true,
  startDate: true,
  endDate: true,
  totalPrice: true,
  status: true,
  guestCount: true,
  paymentStatus: true,
  // Include address fields
  address: true,
  city: true,
  state: true,
  zipCode: true,
  country: true,
  // Contact information
  contactPhone: true,
  contactEmail: true,
  // Payment information
  paymentMethod: true,
  transactionId: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Extend User with computed fullName property
export interface UserWithFullName extends User {
  fullName: string;
  phone: string | null;
}

// Helper function to get full name from user
export function getUserWithFullName(user: User): UserWithFullName {
  return {
    ...user,
    fullName: user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.username,
    phone: user.phoneNumber
  };
}

// Extend Booking with computed properties
export interface BookingWithExtras extends Booking {
  totalAmount: number;
}

// Helper function to transform Booking to BookingWithExtras
export function getBookingWithExtras(booking: Booking): BookingWithExtras {
  return {
    ...booking,
    totalAmount: booking.totalPrice,
    // These fields are now directly in the booking table
    // But we'll generate them if they're not present for backward compatibility
    transactionId: booking.transactionId || `TR-${booking.id}-${Date.now().toString().slice(-6)}`,
    confirmationCode: booking.confirmationCode || `BK-${booking.id}-${Date.now().toString().slice(-6)}`,
  };
}

export type Destination = typeof destinations.$inferSelect;
export type InsertDestination = z.infer<typeof insertDestinationSchema>;

export type Package = typeof packages.$inferSelect;
export type InsertPackage = z.infer<typeof insertPackageSchema>;

export type Hotel = typeof hotels.$inferSelect;
export type InsertHotel = z.infer<typeof insertHotelSchema>;

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;

export type Cab = typeof cabs.$inferSelect;
export type InsertCab = z.infer<typeof insertCabSchema>;

export type Cruise = typeof cruises.$inferSelect;
export type InsertCruise = z.infer<typeof insertCruiseSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

// Payment Details schema
export const insertPaymentDetailsSchema = createInsertSchema(paymentDetails).pick({
  bookingId: true,
  cardName: true,
  cardNumber: true,
  cardExpiry: true,
  cardCVC: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  country: true,
  paymentProcessor: true,
  transactionId: true,
  paymentStatus: true,
  errorMessage: true,
  amount: true,
  currency: true,
});

export type PaymentDetail = typeof paymentDetails.$inferSelect;
export type InsertPaymentDetail = z.infer<typeof insertPaymentDetailsSchema>;

export const insertReviewSchema = createInsertSchema(reviews).pick({
  userId: true,
  itemType: true,
  itemId: true,
  rating: true,
  title: true,
  comment: true,
  dateOfStay: true,
  images: true,
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

// Hotel Room Types and Room Images schemas
export const insertHotelRoomTypeSchema = createInsertSchema(hotelRoomTypes).pick({
  hotelId: true,
  name: true,
  description: true,
  price: true,
  capacity: true,
  amenities: true,
  cancellationPolicy: true,
  featured: true,
  active: true,
});

export const insertHotelRoomImageSchema = createInsertSchema(hotelRoomImages).pick({
  roomTypeId: true,
  imageUrl: true,
  displayOrder: true,
  caption: true,
  featured: true,
});

export type HotelRoomType = typeof hotelRoomTypes.$inferSelect;
export type InsertHotelRoomType = z.infer<typeof insertHotelRoomTypeSchema>;

export type HotelRoomImage = typeof hotelRoomImages.$inferSelect;
export type InsertHotelRoomImage = z.infer<typeof insertHotelRoomImageSchema>;

// Guest Users table (for chat and guest checkout)
export const guestUsers = pgTable('guest_users', {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  sessionId: text("session_id").notNull().unique(), // To identify guest users during their session
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Guest user relations
export const guestUsersRelations = relations(guestUsers, ({ many }) => ({
  conversations: many(conversations),
}));

// Conversation status enum
export const conversationStatusEnum = pgEnum('conversation_status', ['open', 'closed', 'pending']);

// Conversations table (for live chat)
export const conversations = pgTable('conversations', {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }),
  guestUserId: integer("guest_user_id").references(() => guestUsers.id, { onDelete: 'cascade' }),
  itemType: text("item_type"), // hotel, package, cruise, driver, event (optional - if the chat is about a specific item)
  itemId: integer("item_id"), // The ID of the item being inquired about (optional)
  subject: text("subject"), // Subject or topic of the conversation
  status: conversationStatusEnum("status").default('open').notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  readByUser: boolean("read_by_user").default(true), // Whether the latest message has been read by the user
  readByAdmin: boolean("read_by_admin").default(false), // Whether the latest message has been read by the admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Conversation relations
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  guestUser: one(guestUsers, {
    fields: [conversations.guestUserId],
    references: [guestUsers.id],
  }),
  messages: many(messages),
}));

// Message type enum
export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'file']);

// Messages table (for live chat)
export const messages = pgTable('messages', {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  senderId: integer("sender_id").notNull(), // ID of the user or admin who sent the message
  senderType: text("sender_type").notNull(), // "user", "guest", or "admin"
  content: text("content").notNull(),
  messageType: messageTypeEnum("message_type").default('text').notNull(),
  fileUrl: text("file_url"), // URL to attached file if any
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Message relations
export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

// Insert schemas for chat functionality
export const insertGuestUserSchema = createInsertSchema(guestUsers).pick({
  firstName: true,
  lastName: true,
  email: true,
  phoneNumber: true,
  sessionId: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  userId: true,
  guestUserId: true,
  itemType: true,
  itemId: true,
  subject: true,
  status: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  senderId: true,
  senderType: true,
  content: true,
  messageType: true,
  fileUrl: true,
});

// Types for chat functionality
export type GuestUser = typeof guestUsers.$inferSelect;
export type InsertGuestUser = z.infer<typeof insertGuestUserSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
