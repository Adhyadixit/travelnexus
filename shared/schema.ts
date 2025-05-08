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
  included: text("included").notNull(), // JSON string of included items
  rating: doublePrecision("rating"),
  reviewCount: integer("review_count").default(0),
  trending: boolean("trending").default(false),
  featured: boolean("featured").default(false),
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

// Hotels table
export const hotels = pgTable('hotels', {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  destinationId: integer("destination_id").references(() => destinations.id, { onDelete: 'cascade' }),
  description: text("description").notNull(),
  address: text("address").notNull(),
  imageUrl: text("image_url").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  price: doublePrecision("price").notNull(), // per night
  amenities: text("amenities").notNull(), // JSON string of amenities
  reviewCount: integer("review_count").default(0),
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
  type: text("type").notNull(), // sedan, suv, luxury, etc.
  pricePerDay: doublePrecision("price_per_day").notNull(),
  seats: integer("seats").notNull(),
  features: text("features").notNull(), // JSON string of features
  available: boolean("available").default(true),
  rating: doublePrecision("rating"),
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
  imageUrl: text("image_url").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // In days
  price: doublePrecision("price").notNull(), // per person
  departure: text("departure").notNull(), // City of departure
  itinerary: text("itinerary").notNull(), // JSON string of itinerary
  rating: doublePrecision("rating"),
  reviewCount: integer("review_count").default(0),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cruise relations
export const cruisesRelations = relations(cruises, ({ many }) => ({
  bookings: many(bookings),
}));

// Events table
export const events = pgTable('events', {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  destinationId: integer("destination_id").references(() => destinations.id, { onDelete: 'cascade' }),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  imageUrl: text("image_url").notNull(),
  price: doublePrecision("price").notNull(),
  available: boolean("available").default(true),
  capacity: integer("capacity").notNull(),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Booking relations
export const bookingsRelations = relations(bookings, ({ one }) => ({
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
  included: true,
  trending: true,
  featured: true,
});

export const insertHotelSchema = createInsertSchema(hotels).pick({
  name: true,
  destinationId: true,
  description: true,
  address: true,
  imageUrl: true,
  rating: true,
  price: true,
  amenities: true,
  featured: true,
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
  imageUrl: true,
  description: true,
  duration: true,
  price: true,
  departure: true,
  itinerary: true,
  featured: true,
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
  transactionId?: string;
  specialRequests?: string;
}

// Helper function to transform Booking to BookingWithExtras
export function getBookingWithExtras(booking: Booking): BookingWithExtras {
  return {
    ...booking,
    totalAmount: booking.totalPrice,
    transactionId: `TR-${booking.id}-${Date.now().toString().slice(-6)}`,
    specialRequests: ''
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
