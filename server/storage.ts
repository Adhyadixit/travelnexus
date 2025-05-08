import { 
  users, type User, type InsertUser,
  destinations, type Destination, type InsertDestination,
  packages, type Package, type InsertPackage,
  hotels, type Hotel, type InsertHotel,
  drivers, type Driver, type InsertDriver,
  cruises, type Cruise, type InsertCruise,
  events, type Event, type InsertEvent,
  bookings, type Booking, type InsertBooking,
  bookingTypeEnum,
  guestUsers, type GuestUser, type InsertGuestUser,
  conversations, type Conversation, type InsertConversation,
  messages, type Message, type InsertMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, like, sql, count } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Define SessionStore type to fix type error
type SessionStore = session.Store;

// PostgreSQL session store
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserCount(): Promise<number>;

  // Destination operations
  getAllDestinations(): Promise<Destination[]>;
  getFeaturedDestinations(): Promise<Destination[]>;
  getDestination(id: number): Promise<Destination | undefined>;
  createDestination(destination: InsertDestination): Promise<Destination>;
  updateDestination(id: number, data: Partial<InsertDestination>): Promise<Destination | undefined>;
  deleteDestination(id: number): Promise<void>;
  getDestinationCount(): Promise<number>;

  // Package operations
  getAllPackages(): Promise<Package[]>;
  getFeaturedPackages(): Promise<Package[]>;
  getPackagesByDestination(destinationId: number): Promise<Package[]>;
  getPackage(id: number): Promise<Package | undefined>;
  createPackage(packageData: InsertPackage): Promise<Package>;
  updatePackage(id: number, data: Partial<InsertPackage>): Promise<Package | undefined>;
  deletePackage(id: number): Promise<void>;
  getPackageCount(): Promise<number>;

  // Hotel operations
  getAllHotels(): Promise<Hotel[]>;
  getFeaturedHotels(): Promise<Hotel[]>;
  getHotelsByDestination(destinationId: number): Promise<Hotel[]>;
  getHotel(id: number): Promise<Hotel | undefined>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;
  updateHotel(id: number, data: Partial<InsertHotel>): Promise<Hotel | undefined>;
  deleteHotel(id: number): Promise<void>;
  getHotelCount(): Promise<number>;

  // Driver operations
  getAllDrivers(): Promise<Driver[]>;
  getDriversByDestination(destinationId: number): Promise<Driver[]>;
  getDriver(id: number): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: number, data: Partial<InsertDriver>): Promise<Driver | undefined>;
  deleteDriver(id: number): Promise<void>;
  getDriverCount(): Promise<number>;

  // Cruise operations
  getAllCruises(): Promise<Cruise[]>;
  getFeaturedCruises(): Promise<Cruise[]>;
  getCruise(id: number): Promise<Cruise | undefined>;
  createCruise(cruise: InsertCruise): Promise<Cruise>;
  updateCruise(id: number, data: Partial<InsertCruise>): Promise<Cruise | undefined>;
  deleteCruise(id: number): Promise<void>;
  getCruiseCount(): Promise<number>;

  // Event operations
  getAllEvents(): Promise<Event[]>;
  getEventsByDestination(destinationId: number): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<void>;
  getEventCount(): Promise<number>;

  // Booking operations
  getAllBookings(): Promise<Booking[]>;
  getBookingsByUser(userId: number): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, data: Partial<InsertBooking>): Promise<Booking | undefined>;
  deleteBooking(id: number): Promise<void>;
  getBookingCount(): Promise<number>;
  getRecentBookings(limit: number): Promise<Booking[]>;

  // Analytics
  getBookingCountsByType(): Promise<Record<string, number>>;
  getRevenueData(): Promise<{ date: string; revenue: number }[]>;

  // Guest User operations
  createGuestUser(guestUser: InsertGuestUser): Promise<GuestUser>;
  getGuestUserBySessionId(sessionId: string): Promise<GuestUser | undefined>;
  
  // Chat operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByUser(userId: number): Promise<Conversation[]>;
  getConversationsByGuestUser(guestUserId: number): Promise<Conversation[]>;
  getAllConversations(): Promise<Conversation[]>;
  updateConversation(id: number, data: Partial<InsertConversation>): Promise<Conversation | undefined>;
  closeConversation(id: number): Promise<Conversation | undefined>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  getUnreadMessageCountForAdmin(): Promise<number>;
  getUnreadMessageCountForUser(userId: number): Promise<number>;
  markMessagesAsReadByAdmin(conversationId: number): Promise<void>;
  markMessagesAsReadByUser(conversationId: number): Promise<void>;

  // Session store
  sessionStore: SessionStore;
  
  // Other methods are already defined above
}

export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(users);
    return result[0].count;
  }

  // Destination operations
  async getAllDestinations(): Promise<Destination[]> {
    return db.select().from(destinations).orderBy(destinations.name);
  }

  async getFeaturedDestinations(): Promise<Destination[]> {
    return db.select().from(destinations).where(eq(destinations.featured, true)).orderBy(destinations.name);
  }

  async getDestination(id: number): Promise<Destination | undefined> {
    const [destination] = await db.select().from(destinations).where(eq(destinations.id, id));
    return destination;
  }

  async createDestination(destinationData: InsertDestination): Promise<Destination> {
    const [destination] = await db.insert(destinations).values(destinationData).returning();
    return destination;
  }

  async updateDestination(id: number, data: Partial<InsertDestination>): Promise<Destination | undefined> {
    const [destination] = await db.update(destinations)
      .set(data)
      .where(eq(destinations.id, id))
      .returning();
    return destination;
  }

  async deleteDestination(id: number): Promise<void> {
    await db.delete(destinations).where(eq(destinations.id, id));
  }

  async getDestinationCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(destinations);
    return result[0].count;
  }

  // Package operations
  async getAllPackages(): Promise<Package[]> {
    return db.select().from(packages).orderBy(desc(packages.featured), desc(packages.trending));
  }

  async getFeaturedPackages(): Promise<Package[]> {
    return db.select().from(packages).where(eq(packages.featured, true)).orderBy(desc(packages.trending));
  }

  async getPackagesByDestination(destinationId: number): Promise<Package[]> {
    return db.select().from(packages).where(eq(packages.destinationId, destinationId)).orderBy(desc(packages.featured));
  }

  async getPackage(id: number): Promise<Package | undefined> {
    const [packageData] = await db.select().from(packages).where(eq(packages.id, id));
    return packageData;
  }

  async createPackage(packageData: InsertPackage): Promise<Package> {
    const [newPackage] = await db.insert(packages).values(packageData).returning();
    return newPackage;
  }

  async updatePackage(id: number, data: Partial<InsertPackage>): Promise<Package | undefined> {
    const [updatedPackage] = await db.update(packages)
      .set(data)
      .where(eq(packages.id, id))
      .returning();
    return updatedPackage;
  }

  async deletePackage(id: number): Promise<void> {
    await db.delete(packages).where(eq(packages.id, id));
  }

  async getPackageCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(packages);
    return result[0].count;
  }

  // Hotel operations
  async getAllHotels(): Promise<Hotel[]> {
    return db.select().from(hotels).orderBy(desc(hotels.rating));
  }

  async getFeaturedHotels(): Promise<Hotel[]> {
    return db.select().from(hotels).where(eq(hotels.featured, true)).orderBy(desc(hotels.rating));
  }

  async getHotelsByDestination(destinationId: number): Promise<Hotel[]> {
    return db.select().from(hotels).where(eq(hotels.destinationId, destinationId)).orderBy(desc(hotels.rating));
  }

  async getHotel(id: number): Promise<Hotel | undefined> {
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, id));
    return hotel;
  }

  async createHotel(hotelData: InsertHotel): Promise<Hotel> {
    const [hotel] = await db.insert(hotels).values(hotelData).returning();
    return hotel;
  }

  async updateHotel(id: number, data: Partial<InsertHotel>): Promise<Hotel | undefined> {
    const [hotel] = await db.update(hotels)
      .set(data)
      .where(eq(hotels.id, id))
      .returning();
    return hotel;
  }

  async deleteHotel(id: number): Promise<void> {
    await db.delete(hotels).where(eq(hotels.id, id));
  }

  async getHotelCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(hotels);
    return result[0].count;
  }

  // Driver operations
  async getAllDrivers(): Promise<Driver[]> {
    return db.select().from(drivers).orderBy(desc(drivers.rating));
  }

  async getDriversByDestination(destinationId: number): Promise<Driver[]> {
    return db.select().from(drivers)
      .where(and(
        eq(drivers.destinationId, destinationId),
        eq(drivers.available, true)
      ))
      .orderBy(desc(drivers.rating));
  }

  async getDriver(id: number): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }

  async createDriver(driverData: InsertDriver): Promise<Driver> {
    const [driver] = await db.insert(drivers).values(driverData).returning();
    return driver;
  }

  async updateDriver(id: number, data: Partial<InsertDriver>): Promise<Driver | undefined> {
    const [driver] = await db.update(drivers)
      .set(data)
      .where(eq(drivers.id, id))
      .returning();
    return driver;
  }

  async deleteDriver(id: number): Promise<void> {
    await db.delete(drivers).where(eq(drivers.id, id));
  }

  async getDriverCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(drivers);
    return result[0].count;
  }

  // Cruise operations
  async getAllCruises(): Promise<Cruise[]> {
    return db.select().from(cruises).orderBy(cruises.name);
  }

  async getFeaturedCruises(): Promise<Cruise[]> {
    return db.select().from(cruises).where(eq(cruises.featured, true)).orderBy(desc(cruises.rating));
  }

  async getCruise(id: number): Promise<Cruise | undefined> {
    const [cruise] = await db.select().from(cruises).where(eq(cruises.id, id));
    return cruise;
  }

  async createCruise(cruiseData: InsertCruise): Promise<Cruise> {
    const [cruise] = await db.insert(cruises).values(cruiseData).returning();
    return cruise;
  }

  async updateCruise(id: number, data: Partial<InsertCruise>): Promise<Cruise | undefined> {
    const [cruise] = await db.update(cruises)
      .set(data)
      .where(eq(cruises.id, id))
      .returning();
    return cruise;
  }

  async deleteCruise(id: number): Promise<void> {
    await db.delete(cruises).where(eq(cruises.id, id));
  }

  async getCruiseCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(cruises);
    return result[0].count;
  }

  // Event operations
  async getAllEvents(): Promise<Event[]> {
    return db.select().from(events).orderBy(events.date);
  }

  async getEventsByDestination(destinationId: number): Promise<Event[]> {
    return db.select().from(events)
      .where(and(
        eq(events.destinationId, destinationId),
        eq(events.available, true),
        gte(events.date, new Date())
      ))
      .orderBy(events.date);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(eventData: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(eventData).returning();
    return event;
  }

  async updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db.update(events)
      .set(data)
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async getEventCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(events);
    return result[0].count;
  }

  // Booking operations
  async getAllBookings(): Promise<Booking[]> {
    return db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async getBookingsByUser(userId: number): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt));
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(bookingData).returning();
    return booking;
  }

  async updateBooking(id: number, data: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [booking] = await db.update(bookings)
      .set(data)
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async deleteBooking(id: number): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
  }

  async getBookingCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(bookings);
    return result[0].count;
  }

  async getRecentBookings(limit: number): Promise<Booking[]> {
    return db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(limit);
  }

  // Analytics
  async getBookingCountsByType(): Promise<Record<string, number>> {
    const result = await db.select({
      type: bookings.bookingType,
      count: count(),
    })
    .from(bookings)
    .groupBy(bookings.bookingType);
    
    return result.reduce((acc, item) => {
      acc[item.type] = item.count;
      return acc;
    }, {} as Record<string, number>);
  }

  async getRevenueData(): Promise<{ date: string; revenue: number }[]> {
    const result = await db.select({
      date: sql<string>`DATE_TRUNC('day', ${bookings.createdAt})::text`,
      revenue: sql<number>`SUM(${bookings.totalPrice})`,
    })
    .from(bookings)
    .where(eq(bookings.paymentStatus, 'paid'))
    .groupBy(sql`DATE_TRUNC('day', ${bookings.createdAt})`)
    .orderBy(sql`DATE_TRUNC('day', ${bookings.createdAt})`);
    
    return result;
  }

  // Guest User operations
  async createGuestUser(guestData: InsertGuestUser): Promise<GuestUser> {
    const [newGuestUser] = await db
      .insert(guestUsers)
      .values(guestData)
      .returning();
    return newGuestUser;
  }

  async getGuestUserBySessionId(sessionId: string): Promise<GuestUser | undefined> {
    const [guestUser] = await db
      .select()
      .from(guestUsers)
      .where(eq(guestUsers.sessionId, sessionId));
    return guestUser;
  }

  async getGuestUser(id: number): Promise<GuestUser | undefined> {
    const [guestUser] = await db
      .select()
      .from(guestUsers)
      .where(eq(guestUsers.id, id));
    return guestUser;
  }
  
  // Chat operations
  async createConversation(conversationData: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversationData)
      .returning();
    return newConversation;
  }
  
  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }
  
  async getConversationsByUser(userId: number): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }
  
  async getConversationsByGuestUser(guestUserId: number): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.guestUserId, guestUserId))
      .orderBy(desc(conversations.updatedAt));
  }
  
  async getAllConversations(): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.updatedAt));
  }
  
  async getActiveConversations(): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.status, 'open'))
      .orderBy(desc(conversations.updatedAt));
  }
  
  async updateConversation(id: number, data: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const [updatedConversation] = await db
      .update(conversations)
      .set(data)
      .where(eq(conversations.id, id))
      .returning();
    return updatedConversation;
  }
  
  async closeConversation(id: number): Promise<Conversation | undefined> {
    const [closedConversation] = await db
      .update(conversations)
      .set({ status: 'closed', updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return closedConversation;
  }
  
  async deleteConversation(id: number): Promise<void> {
    await db
      .delete(conversations)
      .where(eq(conversations.id, id));
  }
  
  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(messageData)
      .returning();
      
    // Update the conversation's lastMessageAt timestamp and read status
    const conversationId = messageData.conversationId;
    
    // Need to determine if message is from admin based on senderType
    const isFromAdmin = messageData.senderType === 'admin';
    
    await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
        updatedAt: new Date(),
        readByUser: isFromAdmin ? false : true,  // If admin sent message, user hasn't read it
        readByAdmin: isFromAdmin ? true : false  // If user/guest sent message, admin hasn't read it
      })
      .where(eq(conversations.id, conversationId));
      
    return newMessage;
  }
  
  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
  }
  
  async getUnreadMessageCountForAdmin(): Promise<number> {
    // Count conversations with unread messages for admin
    const result = await db
      .select({ count: count() })
      .from(conversations)
      .where(eq(conversations.readByAdmin, false));
    return result[0].count;
  }
  
  async getUnreadMessageCountForUser(userId: number): Promise<number> {
    // Count conversations where user has unread messages
    const result = await db
      .select({ count: count() })
      .from(conversations)
      .where(
        and(
          eq(conversations.userId, userId),
          eq(conversations.readByUser, false)
        )
      );
    return result[0].count;
  }
  
  async markMessagesAsReadByAdmin(conversationId: number): Promise<void> {
    // Update the conversation to mark as read by admin
    await db
      .update(conversations)
      .set({ readByAdmin: true })
      .where(eq(conversations.id, conversationId));
  }
  
  async markMessagesAsReadByUser(conversationId: number): Promise<void> {
    // Update the conversation to mark as read by user
    await db
      .update(conversations)
      .set({ readByUser: true })
      .where(eq(conversations.id, conversationId));
  }
  
  // Combined method to satisfy the interface
  async updateMessageReadStatus(conversationId: number, isAdmin: boolean): Promise<void> {
    if (isAdmin) {
      await this.markMessagesAsReadByAdmin(conversationId);
    } else {
      await this.markMessagesAsReadByUser(conversationId);
    }
  }
}

export const storage = new DatabaseStorage();
