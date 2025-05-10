import { storage } from "./storage";
import { hashPassword } from "./auth";
import { roleEnum, hotels, reviews } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { db } from "./db";

// Function to create admin user
async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await storage.getUserByUsername("admin");
    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    // Create admin user
    const admin = await storage.createUser({
      username: "admin",
      password: await hashPassword("admin123"),
      email: "admin@travelease.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin"
    });

    console.log("Admin user created successfully:", admin.username);
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

// Function to create destinations
async function createDestinations() {
  try {
    const destinationsCount = await storage.getDestinationCount();
    if (destinationsCount > 0) {
      console.log("Destinations already exist");
      return;
    }

    const destinations = [
      {
        name: "Dubai",
        country: "United Arab Emirates",
        imageUrl: "https://images.unsplash.com/photo-1582672752296-e7e00f65b5c5?w=800&auto=format&fit=crop",
        description: "Experience the luxury of Dubai with its stunning skyscrapers, beautiful beaches, and world-class shopping.",
        featured: true
      },
      {
        name: "Bali",
        country: "Indonesia",
        imageUrl: "https://images.unsplash.com/photo-1537996194471-9ca9918e1ff5?w=800&auto=format&fit=crop",
        description: "Discover the beauty of Bali with its lush rice terraces, stunning temples, and vibrant culture.",
        featured: true
      },
      {
        name: "Paris",
        country: "France",
        imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop",
        description: "Fall in love with the city of lights. Explore iconic landmarks, world-class cuisine, and unmatched culture.",
        featured: true
      },
      {
        name: "Tokyo",
        country: "Japan",
        imageUrl: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&auto=format&fit=crop",
        description: "Experience the perfect blend of tradition and technology in Japan's bustling capital city.",
        featured: true
      },
      {
        name: "Maldives",
        country: "Maldives",
        imageUrl: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&auto=format&fit=crop",
        description: "Escape to paradise with crystal clear waters, white sandy beaches, and luxury overwater bungalows.",
        featured: true
      },
      {
        name: "Rome",
        country: "Italy",
        imageUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop",
        description: "Step back in time and discover the ancient history, incredible architecture, and delicious cuisine of the Eternal City.",
        featured: false
      },
      {
        name: "Phuket",
        country: "Thailand",
        imageUrl: "https://images.unsplash.com/photo-1589394760151-b4c9290d2084?w=800&auto=format&fit=crop",
        description: "Thailand's largest island offers beautiful beaches, vibrant nightlife, and incredible diving opportunities.",
        featured: false
      },
      {
        name: "Bangkok",
        country: "Thailand",
        imageUrl: "https://images.unsplash.com/photo-1508009603885-50cf7c8dd861?w=800&auto=format&fit=crop",
        description: "Explore Thailand's vibrant capital with its stunning temples, bustling markets, and amazing street food.",
        featured: false
      }
    ];

    for (const destination of destinations) {
      await storage.createDestination(destination);
    }

    console.log(`${destinations.length} destinations created`);
  } catch (error) {
    console.error("Error creating destinations:", error);
  }
}

// Function to create hotels
async function createHotels() {
  try {
    const hotelsCount = await storage.getHotelCount();
    if (hotelsCount > 0) {
      console.log("Hotels already exist");
      return;
    }

    // First get all destinations to link hotels to them
    const destinations = await storage.getAllDestinations();
    if (destinations.length === 0) {
      console.log("No destinations found. Create destinations first.");
      return;
    }

    const hotels = [
      {
        name: "Burj Al Arab",
        imageUrl: "https://images.unsplash.com/photo-1578681041175-9717c638e1f6?w=800&auto=format&fit=crop",
        description: "Experience unparalleled luxury at Dubai's iconic sail-shaped hotel with stunning views of the Arabian Gulf.",
        destinationId: destinations.find(d => d.name === "Dubai")?.id || destinations[0].id,
        price: 1200,
        address: "Jumeirah Beach Road, Dubai, UAE",
        rating: 5,
        amenities: "Pool, Spa, Fine Dining, Butler Service, Private Beach",
        featured: true
      },
      {
        name: "Four Seasons Resort Bali",
        imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop",
        description: "Nestled on Bali's southern coast, this luxurious resort offers private villas with infinity pools and ocean views.",
        destinationId: destinations.find(d => d.name === "Bali")?.id || destinations[0].id,
        price: 850,
        address: "Jimbaran Bay, Bali, Indonesia",
        rating: 5,
        amenities: "Infinity Pools, Spa, Beachfront, Yoga Classes, Water Sports",
        featured: true
      },
      {
        name: "The Ritz Paris",
        imageUrl: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&auto=format&fit=crop",
        description: "Historic luxury hotel in the heart of Paris, offering timeless elegance and exceptional service.",
        destinationId: destinations.find(d => d.name === "Paris")?.id || destinations[0].id,
        price: 1100,
        address: "15 Place Vendôme, 75001 Paris, France",
        rating: 5,
        amenities: "Michelin Star Restaurant, Spa, Bar, Concierge, Luxury Suites",
        featured: true
      },
      {
        name: "Park Hyatt Tokyo",
        imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&auto=format&fit=crop",
        description: "Sophisticated luxury hotel located in the heart of Shinjuku with stunning views of Tokyo and Mount Fuji.",
        destinationId: destinations.find(d => d.name === "Tokyo")?.id || destinations[0].id,
        price: 750,
        address: "3-7-1-2 Nishi Shinjuku, Tokyo 163-1055, Japan",
        rating: 5,
        amenities: "Indoor Pool, Fitness Center, Spa, Fine Dining, Skyline Views",
        featured: true
      },
      {
        name: "Soneva Jani",
        imageUrl: "https://images.unsplash.com/photo-1578922746465-3a80a228f223?w=800&auto=format&fit=crop",
        description: "Luxury overwater villas with retractable roofs for stargazing and direct access to the crystal-clear lagoon.",
        destinationId: destinations.find(d => d.name === "Maldives")?.id || destinations[0].id,
        price: 1500,
        address: "Medhufaru Island, Noonu Atoll, Maldives",
        rating: 5,
        amenities: "Private Pools, Water Slides, Observatory, Open-Air Cinema, Diving",
        featured: true
      },
      {
        name: "Hotel Eden Rome",
        imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop",
        description: "Elegant luxury hotel offering panoramic views of Rome from its rooftop restaurant and terrace.",
        destinationId: destinations.find(d => d.name === "Rome")?.id || destinations[0].id,
        price: 680,
        address: "Via Ludovisi 49, 00187 Rome, Italy",
        rating: 5,
        amenities: "Rooftop Restaurant, Spa, Concierge, City Views, Luxury Suites",
        featured: false
      },
      {
        name: "Amanpuri Phuket",
        imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop",
        description: "Peaceful resort set on a private peninsula with coconut palm groves and a pristine beach.",
        destinationId: destinations.find(d => d.name === "Phuket")?.id || destinations[0].id,
        price: 790,
        address: "Pansea Beach, Phuket 83110, Thailand",
        rating: 5,
        amenities: "Private Beach, Spa, Pools, Water Sports, Fitness Center",
        featured: false
      },
      {
        name: "Mandarin Oriental Bangkok",
        imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop",
        description: "Historic luxury hotel on the banks of the Chao Phraya River, offering timeless elegance and Thai hospitality.",
        destinationId: destinations.find(d => d.name === "Bangkok")?.id || destinations[0].id,
        price: 550,
        address: "48 Oriental Avenue, Bangkok 10500, Thailand",
        rating: 5,
        amenities: "Riverside Dining, Spa, Pools, Cooking School, Boat Service",
        featured: false
      }
    ];

    for (const hotel of hotels) {
      await storage.createHotel(hotel);
    }

    console.log(`${hotels.length} hotels created`);
  } catch (error) {
    console.error("Error creating hotels:", error);
  }
}

// Function to create packages
async function createPackages() {
  try {
    const packagesCount = await storage.getPackageCount();
    if (packagesCount > 0) {
      console.log("Packages already exist");
      return;
    }

    // First get all destinations to link packages to them
    const destinations = await storage.getAllDestinations();
    if (destinations.length === 0) {
      console.log("No destinations found. Create destinations first.");
      return;
    }

    const packages = [
      {
        name: "Dubai Luxury Escape",
        imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop",
        description: "Experience the height of luxury with this 7-day package including desert safari, Burj Khalifa visit, and yacht cruise.",
        destinationId: destinations.find(d => d.name === "Dubai")?.id || destinations[0].id,
        price: 2800,
        duration: 7,
        itinerary: "Day 1: Arrival & Hotel Check-in\nDay 2: Dubai City Tour & Burj Khalifa\nDay 3: Desert Safari\nDay 4: Dubai Mall & Fountain Show\nDay 5: Yacht Cruise & Beach Day\nDay 6: Abu Dhabi Day Trip\nDay 7: Departure",
        included: "5-star accommodation, Airport transfers, Daily breakfast, City tour, Desert safari, Burj Khalifa tickets, Yacht cruise",
        featured: true
      },
      {
        name: "Bali Serenity Retreat",
        imageUrl: "https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=800&auto=format&fit=crop",
        description: "Immerse yourself in Balinese culture and natural beauty with this 8-day package including temple visits, rice terraces, and spa treatments.",
        destinationId: destinations.find(d => d.name === "Bali")?.id || destinations[0].id,
        price: 1950,
        duration: 8,
        itinerary: "Day 1: Arrival & Welcome Dinner\nDay 2: Ubud Art & Culture Tour\nDay 3: Sacred Temple Journey\nDay 4: Tegalalang Rice Terraces & Coffee Plantation\nDay 5: Mt. Batur Sunrise Trek\nDay 6: Spa Day & Beach Relaxation\nDay 7: Uluwatu Temple & Kecak Dance\nDay 8: Departure",
        included: "Luxury villa accommodation, Airport transfers, Daily breakfast, Welcome dinner, Cultural tours, Temple entry fees, Sunrise trek, Spa treatment",
        featured: true
      },
      {
        name: "Parisian Romance",
        imageUrl: "https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?w=800&auto=format&fit=crop",
        description: "Experience the magic of Paris with this 6-day romantic package including Seine River cruise, Eiffel Tower dinner, and Louvre visit.",
        destinationId: destinations.find(d => d.name === "Paris")?.id || destinations[0].id,
        price: 2400,
        duration: 6,
        itinerary: "Day 1: Arrival & Hotel Check-in\nDay 2: Eiffel Tower & Seine River Cruise\nDay 3: Louvre Museum & Tuileries Garden\nDay 4: Montmartre & Sacré-Cœur\nDay 5: Versailles Day Trip\nDay 6: Departure",
        included: "4-star accommodation, Airport transfers, Daily breakfast, Seine River cruise, Eiffel Tower dinner, Museum passes, Versailles guided tour",
        featured: true
      },
      {
        name: "Tokyo Explorer",
        imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop",
        description: "Discover the wonders of Tokyo with this 7-day package including Mt. Fuji excursion, traditional tea ceremony, and robot restaurant.",
        destinationId: destinations.find(d => d.name === "Tokyo")?.id || destinations[0].id,
        price: 2600,
        duration: 7,
        itinerary: "Day 1: Arrival & Welcome Dinner\nDay 2: Tokyo City Tour & Skytree\nDay 3: Tsukiji Fish Market & Ginza\nDay 4: Mt. Fuji Day Trip\nDay 5: Traditional Cultural Experience\nDay 6: Akihabara & Robot Restaurant\nDay 7: Departure",
        included: "Modern hotel accommodation, Airport transfers, Daily breakfast, Welcome dinner, City tour, Mt. Fuji excursion, Tea ceremony, Robot restaurant",
        featured: true
      },
      {
        name: "Maldives Paradise Getaway",
        imageUrl: "https://images.unsplash.com/photo-1505881402582-c5bc11054f91?w=800&auto=format&fit=crop",
        description: "Escape to paradise with this 5-day luxurious package including overwater villa stay, snorkeling tours, and sunset cruise.",
        destinationId: destinations.find(d => d.name === "Maldives")?.id || destinations[0].id,
        price: 3800,
        duration: 5,
        itinerary: "Day 1: Arrival & Check-in\nDay 2: Snorkeling Tour & Beach Relaxation\nDay 3: Dolphin Watching & Water Sports\nDay 4: Spa Day & Sunset Cruise\nDay 5: Departure",
        included: "Overwater villa accommodation, Seaplane transfers, All-inclusive meals, Snorkeling equipment, Dolphin watching tour, Water sports, Sunset cruise, Couples spa treatment",
        featured: true
      }
    ];

    for (const pkg of packages) {
      await storage.createPackage(pkg);
    }

    console.log(`${packages.length} packages created`);
  } catch (error) {
    console.error("Error creating packages:", error);
  }
}

// Function to create drivers
async function createDrivers() {
  try {
    const driversCount = await storage.getDriverCount();
    if (driversCount > 0) {
      console.log("Drivers already exist");
      return;
    }

    // First get all destinations to link drivers to them
    const destinations = await storage.getAllDestinations();
    if (destinations.length === 0) {
      console.log("No destinations found. Create destinations first.");
      return;
    }

    const drivers = [
      {
        name: "Mohammed Al-Farsi",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop",
        destinationId: destinations.find(d => d.name === "Dubai")?.id || destinations[0].id,
        carModel: "Toyota Land Cruiser",
        languages: "Arabic, English, Hindi",
        dailyRate: 120,
        profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop",
        rating: 4.8,
        available: true
      },
      {
        name: "Wayan Setiawan",
        imageUrl: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=800&auto=format&fit=crop",
        destinationId: destinations.find(d => d.name === "Bali")?.id || destinations[0].id,
        carModel: "Toyota Avanza",
        languages: "Indonesian, English",
        dailyRate: 80,
        profileImageUrl: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=800&auto=format&fit=crop",
        rating: 4.9,
        available: true
      },
      {
        name: "Pierre Dubois",
        imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop",
        destinationId: destinations.find(d => d.name === "Paris")?.id || destinations[0].id,
        carModel: "Peugeot 508",
        languages: "French, English, Spanish",
        dailyRate: 150,
        profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop",
        rating: 4.7,
        available: true
      },
      {
        name: "Takashi Yamamoto",
        imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop",
        destinationId: destinations.find(d => d.name === "Tokyo")?.id || destinations[0].id,
        carModel: "Toyota Crown",
        languages: "Japanese, English",
        dailyRate: 130,
        profileImageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop",
        rating: 4.9,
        available: true
      },
      {
        name: "Ibrahim Rasheed",
        imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&auto=format&fit=crop",
        destinationId: destinations.find(d => d.name === "Maldives")?.id || destinations[0].id,
        carModel: "Toyota Hiace",
        languages: "Dhivehi, English",
        dailyRate: 100,
        profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&auto=format&fit=crop",
        rating: 4.6,
        available: true
      }
    ];

    for (const driver of drivers) {
      await storage.createDriver(driver);
    }

    console.log(`${drivers.length} drivers created`);
  } catch (error) {
    console.error("Error creating drivers:", error);
  }
}

// Function to create cruises
async function createCruises() {
  try {
    const cruisesCount = await storage.getCruiseCount();
    if (cruisesCount > 0) {
      console.log("Cruises already exist");
      return;
    }

    const cruises = [
      {
        name: "Mediterranean Dream",
        imageUrl: "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800&auto=format&fit=crop",
        description: "Experience the beauty of the Mediterranean with stops in Italy, Greece, and Croatia on this luxury cruise liner.",
        price: 2200,
        duration: 10,
        company: "Royal Caribbean",
        departure: "Barcelona, Spain",
        itinerary: "Day 1: Depart Barcelona\nDay 2: At Sea\nDay 3: Rome, Italy\nDay 4: Naples, Italy\nDay 5: At Sea\nDay 6: Santorini, Greece\nDay 7: Athens, Greece\nDay 8: At Sea\nDay 9: Dubrovnik, Croatia\nDay 10: Return to Barcelona",
        featured: true
      },
      {
        name: "Caribbean Paradise",
        imageUrl: "https://images.unsplash.com/photo-1599640842225-85d111c60e6b?w=800&auto=format&fit=crop",
        description: "Sail through the crystal-clear waters of the Caribbean, visiting exotic islands and enjoying world-class entertainment.",
        price: 1800,
        duration: 7,
        company: "Norwegian Cruise Line",
        departure: "Miami, USA",
        itinerary: "Day 1: Depart Miami\nDay 2: At Sea\nDay 3: Jamaica\nDay 4: Cayman Islands\nDay 5: Cozumel, Mexico\nDay 6: At Sea\nDay 7: Return to Miami",
        featured: true
      },
      {
        name: "Alaska Wilderness",
        imageUrl: "https://images.unsplash.com/photo-1461155321608-0d99e1f4c180?w=800&auto=format&fit=crop",
        description: "Discover the untamed beauty of Alaska's wilderness, glaciers, and wildlife on this unforgettable cruise adventure.",
        price: 2400,
        duration: 8,
        company: "Princess Cruises",
        departure: "Vancouver, Canada",
        itinerary: "Day 1: Depart Vancouver\nDay 2: Inside Passage (Scenic Cruising)\nDay 3: Ketchikan, Alaska\nDay 4: Juneau, Alaska\nDay 5: Skagway, Alaska\nDay 6: Glacier Bay (Scenic Cruising)\nDay 7: College Fjord (Scenic Cruising)\nDay 8: Arrive Anchorage (Whittier), Alaska",
        featured: true
      },
      {
        name: "Arabian Gulf Explorer",
        imageUrl: "https://images.unsplash.com/photo-1520637160056-fc0ae125267c?w=800&auto=format&fit=crop",
        description: "Experience the luxury and culture of the Arabian Gulf with visits to Dubai, Abu Dhabi, Oman, and Qatar.",
        price: 1950,
        duration: 9,
        company: "MSC Cruises",
        departure: "Dubai, UAE",
        itinerary: "Day 1: Depart Dubai\nDay 2: Abu Dhabi, UAE\nDay 3: Sir Bani Yas Island, UAE\nDay 4: At Sea\nDay 5: Muscat, Oman\nDay 6: Khasab, Oman\nDay 7: Doha, Qatar\nDay 8: Dubai, UAE (Overnight)\nDay 9: Disembark in Dubai",
        featured: false
      },
      {
        name: "Southeast Asia Discovery",
        imageUrl: "https://images.unsplash.com/photo-1480932678851-8a1b2ccd8394?w=800&auto=format&fit=crop",
        description: "Immerse yourself in the diverse cultures and stunning landscapes of Southeast Asia on this unique cruise journey.",
        price: 2100,
        duration: 12,
        company: "Celebrity Cruises",
        departure: "Singapore",
        itinerary: "Day 1: Depart Singapore\nDay 2: At Sea\nDay 3: Bangkok (Laem Chabang), Thailand\nDay 4: Bangkok (Laem Chabang), Thailand\nDay 5: At Sea\nDay 6: Ho Chi Minh City, Vietnam\nDay 7: Ho Chi Minh City, Vietnam\nDay 8: At Sea\nDay 9: Hue/Danang (Chan May), Vietnam\nDay 10: Hanoi (Halong Bay), Vietnam\nDay 11: At Sea\nDay 12: Return to Singapore",
        featured: false
      }
    ];

    for (const cruise of cruises) {
      await storage.createCruise(cruise);
    }

    console.log(`${cruises.length} cruises created`);
  } catch (error) {
    console.error("Error creating cruises:", error);
  }
}

// Function to create events
async function createEvents() {
  try {
    const eventsCount = await storage.getEventCount();
    if (eventsCount > 0) {
      console.log("Events already exist");
      return;
    }

    // First get all destinations to link events to them
    const destinations = await storage.getAllDestinations();
    if (destinations.length === 0) {
      console.log("No destinations found. Create destinations first.");
      return;
    }

    const events = [
      {
        name: "Dubai Shopping Festival",
        imageUrl: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&auto=format&fit=crop",
        description: "The largest shopping and entertainment festival in the Middle East with incredible deals, fashion shows, and concerts.",
        destinationId: destinations.find(d => d.name === "Dubai")?.id || destinations[0].id,
        price: 50,
        date: new Date(2025, 0, 15), // January 15, 2025
        location: "Various locations across Dubai",
        capacity: 5000,
        available: true,
        featured: true
      },
      {
        name: "Bali Arts Festival",
        imageUrl: "https://images.unsplash.com/photo-1601925260351-db2303e2c6f4?w=800&auto=format&fit=crop",
        description: "Annual celebration of Balinese arts, culture, and performance featuring traditional dance, music, and crafts.",
        destinationId: destinations.find(d => d.name === "Bali")?.id || destinations[0].id,
        price: 30,
        date: new Date(2025, 5, 10), // June 10, 2025
        location: "Denpasar, Bali",
        capacity: 2000,
        available: true,
        featured: true
      },
      {
        name: "Paris Fashion Week",
        imageUrl: "https://images.unsplash.com/photo-1552233707-ec75c8f5a6e2?w=800&auto=format&fit=crop",
        description: "One of the world's most prestigious fashion events showcasing the latest collections from top designers.",
        destinationId: destinations.find(d => d.name === "Paris")?.id || destinations[0].id,
        price: 200,
        date: new Date(2025, 8, 25), // September 25, 2025
        location: "Various locations across Paris",
        capacity: 1000,
        available: true,
        featured: true
      },
      {
        name: "Tokyo Anime Festival",
        imageUrl: "https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=800&auto=format&fit=crop",
        description: "Celebration of Japanese animation with exhibitions, screenings, cosplay competitions, and special guest appearances.",
        destinationId: destinations.find(d => d.name === "Tokyo")?.id || destinations[0].id,
        price: 45,
        date: new Date(2025, 3, 12), // April 12, 2025
        location: "Tokyo Big Sight, Odaiba",
        capacity: 3000,
        available: true,
        featured: false
      },
      {
        name: "Maldives Marine Festival",
        imageUrl: "https://images.unsplash.com/photo-1564845303945-9cb8b0a41e8b?w=800&auto=format&fit=crop",
        description: "Celebration of marine life and conservation with underwater photography exhibitions, snorkeling tours, and educational workshops.",
        destinationId: destinations.find(d => d.name === "Maldives")?.id || destinations[0].id,
        price: 120,
        date: new Date(2025, 1, 20), // February 20, 2025
        location: "Male and various resorts",
        capacity: 500,
        available: true,
        featured: false
      }
    ];

    for (const event of events) {
      await storage.createEvent(event);
    }

    console.log(`${events.length} events created`);
  } catch (error) {
    console.error("Error creating events:", error);
  }
}

// Function to create reviews
async function createReviews() {
  try {
    // Check if we have the admin user
    const admin = await storage.getUserByUsername("admin");
    if (!admin) {
      console.log("Admin user not found. Create admin first.");
      return;
    }
    
    // Get hotels to add reviews to
    const hotels = await storage.getAllHotels();
    if (hotels.length === 0) {
      console.log("No hotels found. Create hotels first.");
      return;
    }
    
    // Check if reviews already exist
    const reviewsData = await db.select().from(reviews).limit(1);
    if (reviewsData.length > 0) {
      console.log("Reviews already exist");
      return;
    }
    
    // Create reviews for hotels
    const hotelReviewsData = [
      // Reviews for first hotel (Burj Al Arab)
      {
        userId: admin.id,
        itemType: "hotel",
        itemId: hotels[0].id,
        rating: 5,
        title: "Absolutely Amazing Experience",
        comment: "The Burj Al Arab exceeds all expectations. The service is impeccable, the rooms are stunning with breathtaking views of Dubai, and the dining options are world-class. Worth every penny for a once-in-a-lifetime experience.",
        dateOfStay: new Date(2024, 2, 15),
        helpfulVotes: 12,
        verified: true,
        status: "approved",
        createdAt: new Date(2024, 2, 20),
        updatedAt: new Date(2024, 2, 20)
      },
      {
        userId: admin.id,
        itemType: "hotel",
        itemId: hotels[0].id,
        rating: 5,
        title: "Luxury Beyond Compare",
        comment: "From the moment you arrive via their private chauffeur service, the experience is unmatched. The duplex suite was stunning, with floor-to-ceiling windows overlooking the Arabian Gulf. The private butler service is exceptional, and the restaurants are phenomenal. The gold-plated everything might be a bit over the top, but that's part of the charm!",
        dateOfStay: new Date(2024, 1, 5),
        helpfulVotes: 8,
        verified: true,
        status: "approved",
        createdAt: new Date(2024, 1, 10),
        updatedAt: new Date(2024, 1, 10)
      },
      
      // Reviews for second hotel (Four Seasons Resort Bali)
      {
        userId: admin.id,
        itemType: "hotel",
        itemId: hotels[1].id,
        rating: 5,
        title: "Paradise Found in Bali",
        comment: "The Four Seasons Bali at Sayan is truly a slice of paradise. Our villa had the most stunning views of the jungle and river below. The infinity pool is Instagram-perfect. The staff remembered our names and preferences from day one. The spa treatments using local ingredients were fantastic. We especially loved the traditional Balinese dinner under the stars.",
        dateOfStay: new Date(2024, 3, 10),
        helpfulVotes: 15,
        verified: true,
        status: "approved",
        createdAt: new Date(2024, 3, 15),
        updatedAt: new Date(2024, 3, 15)
      },
      {
        userId: admin.id,
        itemType: "hotel",
        itemId: hotels[1].id,
        rating: 4,
        title: "Serene Luxury in Nature",
        comment: "The resort perfectly blends luxury with Bali's natural beauty. The villa was spacious with a private plunge pool. The sounds of the river and jungle create the perfect backdrop. The only minor issue was occasional insects, but that's expected in such a natural setting. The cooking class and rice field trek were highlights of our stay.",
        dateOfStay: new Date(2024, 2, 25),
        helpfulVotes: 7,
        verified: true,
        status: "approved",
        createdAt: new Date(2024, 3, 2),
        updatedAt: new Date(2024, 3, 2)
      },
      {
        userId: admin.id,
        itemType: "hotel",
        itemId: hotels[1].id,
        rating: 5,
        title: "Honeymoon Heaven",
        comment: "We chose Four Seasons Bali for our honeymoon and couldn't have picked a better place. The private villa with infinity pool was romantic and secluded. The staff arranged a special flower bath and candlelit dinner for us. The morning yoga sessions overlooking the jungle were magical. Worth every penny for a special occasion!",
        dateOfStay: new Date(2024, 1, 14),
        helpfulVotes: 10,
        verified: true,
        status: "approved",
        createdAt: new Date(2024, 1, 20),
        updatedAt: new Date(2024, 1, 20)
      },
      
      // Add reviews for other hotels
      {
        userId: admin.id,
        itemType: "hotel",
        itemId: hotels[2].id,
        rating: 5,
        title: "Perfect Romantic Getaway",
        comment: "The Shangri-La Paris exceeded all our expectations. The Eiffel Tower view from our balcony was unforgettable. The service was impeccable and the dining experience at L'Abeille was one of the best meals we've ever had. The location is perfect for exploring Paris.",
        dateOfStay: new Date(2024, 2, 1),
        helpfulVotes: 9,
        verified: true,
        status: "approved",
        createdAt: new Date(2024, 2, 5),
        updatedAt: new Date(2024, 2, 5)
      },
      {
        userId: admin.id,
        itemType: "hotel",
        itemId: hotels[3].id,
        rating: 5,
        title: "Japanese Hospitality at its Finest",
        comment: "The Aman Tokyo perfectly balances modern luxury with traditional Japanese aesthetics. The soaking tub with city views was incredible. The attention to detail in everything from room design to the tea ceremony was impressive. Staff anticipate your needs before you even realize them.",
        dateOfStay: new Date(2024, 3, 5),
        helpfulVotes: 11,
        verified: true,
        status: "approved",
        createdAt: new Date(2024, 3, 10),
        updatedAt: new Date(2024, 3, 10)
      }
    ];
    
    // Insert reviews into database
    for (const review of hotelReviewsData) {
      await db.insert(reviews).values(review);
    }
    
    // Update the review counts and ratings for each hotel
    for (let i = 0; i < hotels.length; i++) {
      const hotel = hotels[i];
      const hotelReviews = hotelReviewsData.filter(r => r.itemId === hotel.id);
      
      if (hotelReviews.length > 0) {
        const reviewCount = hotelReviews.length;
        const totalRating = hotelReviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = totalRating / reviewCount;
        
        // Use direct SQL update to avoid schema mismatch issues
        await db.execute(sql`
          UPDATE hotels SET review_count = ${reviewCount}, user_rating = ${avgRating} WHERE id = ${hotel.id}
        `);
      }
    }
    
    console.log(`${hotelReviewsData.length} reviews created`);
  } catch (error) {
    console.error("Error creating reviews:", error);
  }
}

// Main seed function
export async function seed() {
  console.log("Starting database seeding...");
  
  await createAdminUser();
  await createDestinations();
  await createHotels();
  await createPackages();
  await createDrivers();
  await createCruises();
  await createEvents();
  await createReviews();
  
  console.log("Database seeding completed successfully!");
}

// Note: This file will be imported by routes.ts to seed the database
// No need for direct execution check in ESM