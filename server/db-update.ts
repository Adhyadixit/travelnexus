import { db, pool } from './db';
import { sql } from 'drizzle-orm';

async function updateTables() {
  try {
    console.log('Starting database schema update...');

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
      ADD COLUMN IF NOT EXISTS room_types TEXT;
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

    console.log('All database schema updates completed successfully!');
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    await pool.end();
  }
}

updateTables();