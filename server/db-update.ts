import { db, pool } from './db';
import { sql } from 'drizzle-orm';

async function updateTables() {
  try {
    console.log('Starting database schema update...');

    // Create hotel_type enum if it doesn't exist
    try {
      await db.execute(sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hotel_type') THEN
            CREATE TYPE hotel_type AS ENUM ('hotel', 'resort', 'villa', 'independent_house');
          END IF;
        END
        $$;
      `);
      console.log('Created hotel_type enum if it did not exist');
    } catch (error) {
      console.error('Error creating hotel_type enum:', error);
    }

    // Add new fields to hotels table
    await db.execute(sql`
      ALTER TABLE hotels 
      ADD COLUMN IF NOT EXISTS image_gallery TEXT,
      ADD COLUMN IF NOT EXISTS user_rating DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS check_in TEXT,
      ADD COLUMN IF NOT EXISTS check_out TEXT,
      ADD COLUMN IF NOT EXISTS policies TEXT,
      ADD COLUMN IF NOT EXISTS languages_spoken TEXT,
      ADD COLUMN IF NOT EXISTS nearby_attractions TEXT,
      ADD COLUMN IF NOT EXISTS free_cancellation BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS room_types TEXT,
      ADD COLUMN IF NOT EXISTS hotel_type hotel_type DEFAULT 'hotel';
    `);
    console.log('Updated hotels table');

    // Add new fields to packages table
    await db.execute(sql`
      ALTER TABLE packages
      ADD COLUMN IF NOT EXISTS image_gallery TEXT,
      ADD COLUMN IF NOT EXISTS excluded TEXT,
      ADD COLUMN IF NOT EXISTS itinerary TEXT,
      ADD COLUMN IF NOT EXISTS hotels TEXT,
      ADD COLUMN IF NOT EXISTS flight_included BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS visa_required BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS visa_assistance BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS type_of_tour TEXT,
      ADD COLUMN IF NOT EXISTS cities_covered TEXT,
      ADD COLUMN IF NOT EXISTS meals TEXT,
      ADD COLUMN IF NOT EXISTS starting_dates TEXT,
      ADD COLUMN IF NOT EXISTS travel_mode TEXT,
      ADD COLUMN IF NOT EXISTS min_travelers INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS customizable BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS highlights TEXT;
    `);
    console.log('Updated packages table');

    // Check if cabs table exists and create if it doesn't
    try {
      const tableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'cabs'
        );
      `);
      
      const exists = tableExists.rows[0]?.exists;
      
      if (!exists) {
        console.log('Cabs table does not exist, skipping...');
      } else {
        // Add new fields to cabs table if it exists
        await db.execute(sql`
          ALTER TABLE cabs
          ADD COLUMN IF NOT EXISTS image_gallery TEXT,
          ADD COLUMN IF NOT EXISTS bags INTEGER DEFAULT 2,
          ADD COLUMN IF NOT EXISTS addons TEXT,
          ADD COLUMN IF NOT EXISTS ac_available BOOLEAN DEFAULT true,
          ADD COLUMN IF NOT EXISTS free_cancellation BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS cancellation_timeframe TEXT,
          ADD COLUMN IF NOT EXISTS driver_verified BOOLEAN DEFAULT true,
          ADD COLUMN IF NOT EXISTS fare_breakdown TEXT,
          ADD COLUMN IF NOT EXISTS tolls_included BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS multiple_stops BOOLEAN DEFAULT false;
        `);
        console.log('Updated cabs table');
      }
    } catch (error) {
      console.log('Error checking/updating cabs table:', error);
    }

    // Add new fields to cruises table
    await db.execute(sql`
      ALTER TABLE cruises
      ADD COLUMN IF NOT EXISTS ship_name TEXT,
      ADD COLUMN IF NOT EXISTS image_gallery TEXT,
      ADD COLUMN IF NOT EXISTS return_port TEXT,
      ADD COLUMN IF NOT EXISTS departure_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS boarding_time TEXT,
      ADD COLUMN IF NOT EXISTS ports_of_call TEXT,
      ADD COLUMN IF NOT EXISTS days_at_sea INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS cabin_types TEXT,
      ADD COLUMN IF NOT EXISTS amenities TEXT,
      ADD COLUMN IF NOT EXISTS dining TEXT,
      ADD COLUMN IF NOT EXISTS entertainment TEXT,
      ADD COLUMN IF NOT EXISTS ship_details TEXT,
      ADD COLUMN IF NOT EXISTS included_services TEXT,
      ADD COLUMN IF NOT EXISTS excluded_services TEXT,
      ADD COLUMN IF NOT EXISTS family_friendly BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS adult_only BOOLEAN DEFAULT false;
    `);
    console.log('Updated cruises table');

    // Add new fields to events table
    await db.execute(sql`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS end_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS start_time TEXT,
      ADD COLUMN IF NOT EXISTS end_time TEXT,
      ADD COLUMN IF NOT EXISTS venue_name TEXT,
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS image_gallery TEXT,
      ADD COLUMN IF NOT EXISTS ticket_types TEXT,
      ADD COLUMN IF NOT EXISTS event_type TEXT,
      ADD COLUMN IF NOT EXISTS categories TEXT,
      ADD COLUMN IF NOT EXISTS performers TEXT,
      ADD COLUMN IF NOT EXISTS schedule TEXT,
      ADD COLUMN IF NOT EXISTS amenities TEXT,
      ADD COLUMN IF NOT EXISTS restrictions TEXT,
      ADD COLUMN IF NOT EXISTS organizer TEXT,
      ADD COLUMN IF NOT EXISTS seated_event BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS virtual_event BOOLEAN DEFAULT false;
    `);
    console.log('Updated events table');

    // Add new fields to bookings table
    await db.execute(sql`
      ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS confirmation_code TEXT,
      ADD COLUMN IF NOT EXISTS special_requests TEXT,
      ADD COLUMN IF NOT EXISTS room_type TEXT,
      ADD COLUMN IF NOT EXISTS cabin_type TEXT,
      ADD COLUMN IF NOT EXISTS package_type TEXT,
      ADD COLUMN IF NOT EXISTS ticket_type TEXT,
      ADD COLUMN IF NOT EXISTS vehicle_type TEXT,
      ADD COLUMN IF NOT EXISTS contact_phone TEXT,
      ADD COLUMN IF NOT EXISTS contact_email TEXT,
      ADD COLUMN IF NOT EXISTS adult_count INTEGER,
      ADD COLUMN IF NOT EXISTS child_count INTEGER,
      ADD COLUMN IF NOT EXISTS infant_count INTEGER,
      ADD COLUMN IF NOT EXISTS payment_method TEXT,
      ADD COLUMN IF NOT EXISTS transaction_id TEXT,
      ADD COLUMN IF NOT EXISTS cancellable BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS cancellation_policy TEXT,
      ADD COLUMN IF NOT EXISTS additional_services TEXT;
    `);
    console.log('Updated bookings table');
    
    // Create reviews table if it doesn't exist
    try {
      const reviewsTableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'reviews'
        );
      `);
      
      const reviewsExist = reviewsTableExists.rows[0]?.exists;
      
      if (!reviewsExist) {
        await db.execute(sql`
          CREATE TABLE reviews (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            item_type TEXT NOT NULL,
            item_id INTEGER NOT NULL,
            rating INTEGER NOT NULL,
            title TEXT NOT NULL,
            comment TEXT NOT NULL,
            date_of_stay TIMESTAMP,
            images TEXT,
            helpful_votes INTEGER DEFAULT 0,
            verified BOOLEAN DEFAULT FALSE,
            response TEXT,
            response_date TIMESTAMP,
            status TEXT DEFAULT 'approved',
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
          );
        `);
        console.log('Created reviews table');
      } else {
        console.log('Reviews table already exists');
      }
    } catch (error) {
      console.error('Error creating reviews table:', error);
    }

    // Create conversation_status enum if it doesn't exist
    try {
      await db.execute(sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_status') THEN
            CREATE TYPE conversation_status AS ENUM ('open', 'closed', 'pending');
          END IF;
        END
        $$;
      `);
      console.log('Created conversation_status enum if it did not exist');
    } catch (error) {
      console.error('Error creating conversation_status enum:', error);
    }

    // Create message_type enum if it doesn't exist
    try {
      await db.execute(sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN
            CREATE TYPE message_type AS ENUM ('text', 'image', 'file');
          END IF;
        END
        $$;
      `);
      console.log('Created message_type enum if it did not exist');
    } catch (error) {
      console.error('Error creating message_type enum:', error);
    }

    // Create guest_users table if it doesn't exist
    try {
      const guestUsersTableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'guest_users'
        );
      `);
      
      const guestUsersExist = guestUsersTableExists.rows[0]?.exists;
      
      if (!guestUsersExist) {
        await db.execute(sql`
          CREATE TABLE guest_users (
            id SERIAL PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            session_id TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
          );
        `);
        console.log('Created guest_users table');
      } else {
        console.log('Guest users table already exists');
      }
    } catch (error) {
      console.error('Error creating guest_users table:', error);
    }

    // Create conversations table if it doesn't exist
    try {
      const conversationsTableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'conversations'
        );
      `);
      
      const conversationsExist = conversationsTableExists.rows[0]?.exists;
      
      if (!conversationsExist) {
        await db.execute(sql`
          CREATE TABLE conversations (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            guest_user_id INTEGER REFERENCES guest_users(id) ON DELETE CASCADE,
            item_type TEXT,
            item_id INTEGER,
            subject TEXT,
            status conversation_status DEFAULT 'open' NOT NULL,
            last_message_at TIMESTAMP DEFAULT NOW() NOT NULL,
            read_by_user BOOLEAN DEFAULT TRUE,
            read_by_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
          );
        `);
        console.log('Created conversations table');
      } else {
        console.log('Conversations table already exists');
      }
    } catch (error) {
      console.error('Error creating conversations table:', error);
    }

    // Create messages table if it doesn't exist
    try {
      const messagesTableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'messages'
        );
      `);
      
      const messagesExist = messagesTableExists.rows[0]?.exists;
      
      if (!messagesExist) {
        await db.execute(sql`
          CREATE TABLE messages (
            id SERIAL PRIMARY KEY,
            conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            sender_id INTEGER NOT NULL,
            sender_type TEXT NOT NULL,
            content TEXT NOT NULL,
            message_type message_type DEFAULT 'text' NOT NULL,
            file_url TEXT,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
          );
        `);
        console.log('Created messages table');
      } else {
        console.log('Messages table already exists');
      }
    } catch (error) {
      console.error('Error creating messages table:', error);
    }

    console.log('All database schema updates completed successfully!');
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    await pool.end();
  }
}

updateTables();