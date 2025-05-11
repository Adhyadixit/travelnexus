import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json, primaryKey, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";

// Enums
export const conversationStatusEnum = pgEnum("conversation_status", ["open", "closed", "pending"]);
export const messageTypeEnum = pgEnum("message_type", ["customer", "admin"]);

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Guest Users
export const guestUsers = pgTable("guest_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Conversations
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  guestUserId: integer("guest_user_id").references(() => guestUsers.id).notNull(),
  status: conversationStatusEnum("status").default("open").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  guestUser: one(guestUsers, {
    fields: [conversations.guestUserId],
    references: [guestUsers.id]
  }),
  messages: many(messages)
}));

// Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  content: text("content").notNull(),
  type: messageTypeEnum("type").default("customer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id]
  })
}));

// Destinations
export const destinations = pgTable("destinations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  image: text("image"),
  location: text("location").notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  averageRating: doublePrecision("average_rating").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const destinationsRelations = relations(destinations, ({ many }) => ({
  packages: many(packages),
  reviews: many(reviews)
}));

// Packages
export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  destinationId: integer("destination_id").references(() => destinations.id).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  image: text("image"),
  price: doublePrecision("price").notNull(),
  duration: integer("duration").notNull(),
  inclusions: text("inclusions").notNull(),
  exclusions: text("exclusions"),
  itinerary: json("itinerary").notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  averageRating: doublePrecision("average_rating").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const packagesRelations = relations(packages, ({ one, many }) => ({
  destination: one(destinations, {
    fields: [packages.destinationId],
    references: [destinations.id]
  }),
  reviews: many(reviews)
}));

// Hotels
export const hotels = pgTable("hotels", {
  id: serial("id").primaryKey(),
  destinationId: integer("destination_id").references(() => destinations.id).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  image: text("image"),
  address: text("address").notNull(),
  amenities: json("amenities").notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  averageRating: doublePrecision("average_rating").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const hotelsRelations = relations(hotels, ({ one, many }) => ({
  destination: one(destinations, {
    fields: [hotels.destinationId],
    references: [destinations.id]
  }),
  roomTypes: many(hotelRoomTypes),
  reviews: many(reviews)
}));

// Hotel Room Types
export const hotelRoomTypes = pgTable("hotel_room_types", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").references(() => hotels.id).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  capacity: integer("capacity").notNull(),
  amenities: json("amenities").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const hotelRoomTypesRelations = relations(hotelRoomTypes, ({ one, many }) => ({
  hotel: one(hotels, {
    fields: [hotelRoomTypes.hotelId],
    references: [hotels.id]
  }),
  images: many(hotelRoomImages)
}));

// Hotel Room Images
export const hotelRoomImages = pgTable("hotel_room_images", {
  id: serial("id").primaryKey(),
  roomTypeId: integer("room_type_id").references(() => hotelRoomTypes.id).notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const hotelRoomImagesRelations = relations(hotelRoomImages, ({ one }) => ({
  roomType: one(hotelRoomTypes, {
    fields: [hotelRoomImages.roomTypeId],
    references: [hotelRoomTypes.id]
  })
}));

// Cruises
export const cruises = pgTable("cruises", {
  id: serial("id").primaryKey(),
  destinationId: integer("destination_id").references(() => destinations.id).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  image: text("image"),
  price: doublePrecision("price").notNull(),
  duration: integer("duration").notNull(),
  itinerary: json("itinerary").notNull(),
  amenities: json("amenities").notNull(),
  departureDate: timestamp("departure_date").notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  averageRating: doublePrecision("average_rating").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const cruisesRelations = relations(cruises, ({ one, many }) => ({
  destination: one(destinations, {
    fields: [cruises.destinationId],
    references: [destinations.id]
  }),
  reviews: many(reviews)
}));

// Drivers
export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  destinationId: integer("destination_id").references(() => destinations.id).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  image: text("image"),
  rate: doublePrecision("rate").notNull(),
  languages: json("languages").notNull(),
  vehicleType: text("vehicle_type").notNull(),
  vehicleImage: text("vehicle_image"),
  reviewCount: integer("review_count").default(0).notNull(),
  averageRating: doublePrecision("average_rating").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const driversRelations = relations(drivers, ({ one, many }) => ({
  destination: one(destinations, {
    fields: [drivers.destinationId],
    references: [destinations.id]
  }),
  reviews: many(reviews)
}));

// Events
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  destinationId: integer("destination_id").references(() => destinations.id).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  image: text("image"),
  price: doublePrecision("price").notNull(),
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull(),
  venue: text("venue").notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  averageRating: doublePrecision("average_rating").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const eventsRelations = relations(events, ({ one, many }) => ({
  destination: one(destinations, {
    fields: [events.destinationId],
    references: [destinations.id]
  }),
  reviews: many(reviews)
}));

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  entityId: integer("entity_id").notNull(),
  entityType: text("entity_type").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id]
  })
}));

// Bookings
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  entityId: integer("entity_id").notNull(),
  entityType: text("entity_type").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").default("pending").notNull(),
  totalPrice: doublePrecision("total_price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id]
  }),
  paymentDetails: many(paymentDetails)
}));

// Payment Details
export const paymentDetails = pgTable("payment_details", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  cardName: text("card_name").notNull(),
  cardNumber: text("card_number").notNull(),
  cardExpiry: text("card_expiry").notNull(),
  cardCvc: text("card_cvc").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country"),
  paymentProcessor: text("payment_processor").default("stripe").notNull(),
  amount: doublePrecision("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const paymentDetailsRelations = relations(paymentDetails, ({ one }) => ({
  booking: one(bookings, {
    fields: [paymentDetails.bookingId],
    references: [bookings.id]
  })
}));

// Insertion schemas
export const insertDestinationSchema = {
  name: '',
  description: '',
  image: '',
  location: ''
};

export const insertPackageSchema = {
  destinationId: 0,
  name: '',
  description: '',
  image: '',
  price: 0,
  duration: 0,
  inclusions: '',
  exclusions: '',
  itinerary: []
};

export const insertHotelSchema = {
  destinationId: 0,
  name: '',
  description: '',
  image: '',
  address: '',
  amenities: []
};

export const insertHotelRoomTypeSchema = {
  hotelId: 0,
  name: '',
  description: '',
  price: 0,
  capacity: 0,
  amenities: []
};

export const insertHotelRoomImageSchema = {
  roomTypeId: 0,
  imageUrl: ''
};

export const insertCruiseSchema = {
  destinationId: 0,
  name: '',
  description: '',
  image: '',
  price: 0,
  duration: 0,
  itinerary: [],
  amenities: [],
  departureDate: new Date()
};

export const insertDriverSchema = {
  destinationId: 0,
  name: '',
  description: '',
  image: '',
  rate: 0,
  languages: [],
  vehicleType: '',
  vehicleImage: ''
};

export const insertEventSchema = {
  destinationId: 0,
  name: '',
  description: '',
  image: '',
  price: 0,
  date: new Date(),
  duration: 0,
  venue: ''
};
