import { db } from './db';
import { hotels, hotelRoomTypes, hotelRoomImages } from '@shared/schema';

// Hotel room type data structure
interface RoomTypeData {
  name: string;
  description: string;
  price: number;
  capacity: number;
  amenities: string[]; // Will be stored as JSON
  cancellationPolicy: string;
  featured: boolean;
  imageUrl?: string;
}

// Template room types with varying names by hotel type
const roomTemplates: { [key: string]: RoomTypeData[] } = {
  // For luxury/high-end hotels
  luxury: [
    {
      name: "Deluxe Room",
      description: "Elegant and spacious deluxe room featuring premium amenities and breathtaking views. Enjoy the perfect blend of comfort and sophistication during your stay.",
      price: 750,
      capacity: 2,
      amenities: ["King bed", "Air conditioning", "Rainfall shower", "Minibar", "Smart TV", "High-speed WiFi", "Luxury toiletries", "Nespresso machine"],
      cancellationPolicy: "Free cancellation up to 48 hours before check-in",
      featured: false,
    },
    {
      name: "Executive Room",
      description: "Premium executive room with enhanced amenities, exclusive access to the Executive Lounge, and personalized service. Perfect for business travelers and discerning guests.",
      price: 1100,
      capacity: 2,
      amenities: ["King bed", "Air conditioning", "Marble bathroom", "Rain shower", "Executive lounge access", "In-room tablet", "Smart TV", "Premium minibar", "Complimentary pressing service", "Express check-in/out"],
      cancellationPolicy: "Free cancellation up to 48 hours before check-in",
      featured: true,
    },
    {
      name: "Luxury Suite",
      description: "Stunning luxury suite offering separate living and sleeping areas, premium amenities, and spectacular views. Experience the epitome of comfort and elegance.",
      price: 1800,
      capacity: 3,
      amenities: ["King bed", "Separate living room", "Dining area", "Marble bathroom", "Soaking tub", "Walk-in closet", "Butler service", "Entertainment system", "Premium bar", "Lounge access", "Exclusive toiletries"],
      cancellationPolicy: "Free cancellation up to 72 hours before check-in",
      featured: true,
    },
    {
      name: "Royal Suite",
      description: "Our most prestigious accommodation, the Royal Suite offers unparalleled luxury with expansive living spaces, personalized butler service, and the finest amenities for an unforgettable experience.",
      price: 3500,
      capacity: 4,
      amenities: ["Master bedroom with king bed", "Second bedroom option", "Expansive living room", "Dining room", "Private bar", "Jacuzzi", "Steam shower", "Personal butler", "Chauffeur service", "VIP amenities", "Private check-in"],
      cancellationPolicy: "Free cancellation up to 7 days before check-in",
      featured: true,
    }
  ],
  
  // For resort properties
  resort: [
    {
      name: "Garden Room",
      description: "Charming garden room surrounded by lush tropical vegetation. Enjoy direct access to the resort grounds and a private terrace for a peaceful retreat.",
      price: 450,
      capacity: 2,
      amenities: ["King or twin beds", "Garden view", "Private terrace", "Air conditioning", "Rain shower", "Ceiling fan", "Mini fridge", "Daily fruit basket"],
      cancellationPolicy: "Free cancellation up to 48 hours before check-in",
      featured: false,
    },
    {
      name: "Superior Pool View",
      description: "Stylish superior room with stunning pool views and upgraded amenities. Enjoy the serene atmosphere and convenient access to the resort's main facilities.",
      price: 650,
      capacity: 3,
      amenities: ["King bed", "Pool view", "Balcony", "Air conditioning", "Rainfall shower", "Sofa bed", "Smart TV", "Premium toiletries", "Coffee maker"],
      cancellationPolicy: "Free cancellation up to 48 hours before check-in",
      featured: true,
    },
    {
      name: "Honeymoon Villa",
      description: "Romantic and private honeymoon villa with direct pool access and special amenities for couples. Create unforgettable memories in this intimate retreat.",
      price: 1200,
      capacity: 2,
      amenities: ["Four-poster king bed", "Private plunge pool", "Outdoor shower", "Sunken bathtub", "Couples massage area", "Romantic turndown service", "Champagne welcome", "Daily breakfast", "Evening canapes"],
      cancellationPolicy: "Free cancellation up to 72 hours before check-in",
      featured: true,
    },
    {
      name: "Presidential Villa",
      description: "Ultimate luxury in our signature presidential villa with private pool, butler service, and panoramic views. Experience the highest level of service and comfort.",
      price: 2500,
      capacity: 6,
      amenities: ["Multiple bedrooms", "Private infinity pool", "Full kitchen", "Outdoor dining pavilion", "Indoor and outdoor lounges", "Private butler", "Personal chef option", "Daily spa treatments", "VIP airport transfers"],
      cancellationPolicy: "Free cancellation up to 7 days before check-in",
      featured: true,
    }
  ],
  
  // For boutique/city hotels
  boutique: [
    {
      name: "Classic Room",
      description: "Stylish classic room blending contemporary design with comfort. Perfect for short stays and city explorers looking for quality accommodation.",
      price: 350,
      capacity: 2,
      amenities: ["Queen bed", "Air conditioning", "Walk-in shower", "Designer toiletries", "Smart TV", "High-speed WiFi", "Writing desk", "Blackout curtains"],
      cancellationPolicy: "Free cancellation up to 24 hours before check-in",
      featured: false,
    },
    {
      name: "Premium City View",
      description: "Upgraded premium room featuring stunning city views and enhanced amenities. Enjoy the urban panorama from your comfortable retreat.",
      price: 480,
      capacity: 2,
      amenities: ["King bed", "Floor-to-ceiling windows", "City view", "Rain shower", "Nespresso machine", "Bluetooth speaker", "Minibar", "Luxury bathroom amenities", "Bathrobe & slippers"],
      cancellationPolicy: "Free cancellation up to 48 hours before check-in",
      featured: true,
    },
    {
      name: "Designer Suite",
      description: "Spacious designer suite featuring separate living area and thoughtfully curated amenities. Experience the perfect blend of style and function.",
      price: 750,
      capacity: 3,
      amenities: ["King bed", "Living room", "Designer furniture", "Cocktail station", "Premium entertainment system", "Spa-inspired bathroom", "Rainfall shower", "Soaking tub", "Designer toiletries"],
      cancellationPolicy: "Free cancellation up to 48 hours before check-in",
      featured: true,
    },
    {
      name: "Penthouse Suite",
      description: "Exclusive penthouse suite offering spectacular views and premium amenities. This signature accommodation represents the height of urban luxury and sophistication.",
      price: 1500,
      capacity: 4,
      amenities: ["Master bedroom", "Second bedroom option", "Living room", "Dining area", "Fully stocked bar", "Panoramic views", "Soaking tub", "Steam shower", "Private terrace", "VIP amenities", "On-call concierge"],
      cancellationPolicy: "Free cancellation up to 72 hours before check-in",
      featured: true,
    }
  ]
};

// Generic room images by room type
const roomImages = {
  basic: [
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=2074&auto=format&fit=crop",
  ],
  premium: [
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?q=80&w=2132&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2070&auto=format&fit=crop",
  ],
  suite: [
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?q=80&w=2070&auto=format&fit=crop",
  ],
  luxury: [
    "https://images.unsplash.com/photo-1601565415267-724db0e9afb7?q=80&w=2108&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1609949279531-cf48d64bed89?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?q=80&w=2074&auto=format&fit=crop",
  ]
};

// Determine which template to use based on hotel details
function getHotelCategory(hotelName: string, price: number): 'luxury' | 'resort' | 'boutique' {
  const luxuryKeywords = ['burj', 'ritz', 'four seasons', 'palace', 'soneva', 'mandarin', 'eden', 'amanpuri'];
  const resortKeywords = ['resort', 'villa', 'bali', 'maldives', 'phuket', 'beach'];
  
  const lowercaseName = hotelName.toLowerCase();
  
  // Check for luxury indicators
  if (price > 1000 || luxuryKeywords.some(keyword => lowercaseName.includes(keyword))) {
    return 'luxury';
  }
  
  // Check for resort indicators
  if (resortKeywords.some(keyword => lowercaseName.includes(keyword))) {
    return 'resort';
  }
  
  // Default to boutique/city hotel
  return 'boutique';
}

// Function to add room images to a room type
async function addRoomImages(roomTypeId: number, roomCategory: 'basic' | 'premium' | 'suite' | 'luxury') {
  const images = roomImages[roomCategory];
  
  for (let i = 0; i < images.length; i++) {
    await db.insert(hotelRoomImages).values({
      roomTypeId: roomTypeId,
      imageUrl: images[i],
      displayOrder: i,
      caption: `Room view ${i + 1}`,
      featured: i === 0, // First image is featured
    });
  }
  
  console.log(`Added ${images.length} images for room type ${roomTypeId}`);
}

// Main function to add room types to all hotels
async function addRoomTypesToHotels() {
  try {
    console.log('Starting to add room types to hotels...');
    
    // Get all hotels
    const allHotels = await db.query.hotels.findMany();
    
    for (const hotel of allHotels) {
      console.log(`Processing hotel: ${hotel.name} (ID: ${hotel.id})`);
      
      // Determine hotel category
      const hotelCategory = getHotelCategory(hotel.name, hotel.price);
      console.log(`  Hotel category: ${hotelCategory}`);
      
      // Get room templates for this hotel category
      const rooms = roomTemplates[hotelCategory];
      
      // Price adjustment factor based on the base price of the hotel
      // This ensures luxury hotels have higher room prices
      const priceAdjustment = hotel.price / 300; // This will scale room prices based on hotel's base price
      
      // Add each room type
      for (let i = 0; i < rooms.length; i++) {
        const room = rooms[i];
        
        // Adjust the price based on the hotel's base price
        const adjustedPrice = Math.round(room.price * priceAdjustment);
        
        // Determine room image category
        let roomImageCategory: 'basic' | 'premium' | 'suite' | 'luxury';
        if (i === 0) roomImageCategory = 'basic';
        else if (i === 1) roomImageCategory = 'premium';
        else if (i === 2) roomImageCategory = 'suite';
        else roomImageCategory = 'luxury';
        
        // Insert the room type
        const [roomType] = await db.insert(hotelRoomTypes).values({
          hotelId: hotel.id,
          name: room.name,
          description: room.description,
          price: adjustedPrice,
          capacity: room.capacity,
          amenities: JSON.stringify(room.amenities),
          cancellationPolicy: room.cancellationPolicy,
          featured: room.featured,
          active: true,
        }).returning();
        
        console.log(`  Added room type: ${room.name} (ID: ${roomType.id}) - Price: $${adjustedPrice}`);
        
        // Add images for this room type
        await addRoomImages(roomType.id, roomImageCategory);
      }
      
      console.log(`Completed adding room types to hotel ${hotel.name}`);
    }
    
    console.log('Successfully added room types to all hotels');
  } catch (error) {
    console.error('Error adding room types:', error);
  }
}

// Execute the function
addRoomTypesToHotels().then(() => {
  console.log('Room type addition script completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});