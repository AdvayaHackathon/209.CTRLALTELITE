// Using fetch directly for more control over the API request

import { getBookingUrl, getBusOperators, getTrainOperators, getFlightOperators } from '@/lib/transportData';

export async function getGeminiResponse(prompt: string): Promise<string> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please set the GEMINI_API_KEY environment variable.");
    }

    // Get the destination from the prompt
    const destination = extractDestination(prompt);
    console.log("Generating travel data for: ", destination);
    
    try {
      // Use Gemini 1.5 Flash for more accurate results
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: generatePromptForDestination(destination)
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topP: 0.8,
              topK: 40,
              maxOutputTokens: 2048,
            }
          }),
        }
      );

      if (!response.ok) {
        console.error(`API request failed with status ${response.status}`);
        throw new Error(`API request failed`); // Will be caught below and fall back to mock data
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (apiError) {
      console.log("Falling back to mock data due to API error:", apiError);
      // Fall back to mock data if the API call fails
      return generateLocationSpecificMockData(destination);
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}

// Helper function to extract destination from prompt
function extractDestination(prompt: string): string {
  // Extract destination from prompt
  if (prompt.includes("for ")) {
    const afterFor = prompt.split("for ")[1];
    // Handle potential end of sentence or phrase
    if (afterFor.includes(" with")) return afterFor.split(" with")[0].trim();
    if (afterFor.includes(".")) return afterFor.split(".")[0].trim();
    if (afterFor.includes("?")) return afterFor.split("?")[0].trim();
    if (afterFor.includes(",")) return afterFor.split(",")[0].trim();
    return afterFor.trim();
  }
  return prompt.trim(); // If no "for" keyword, use the whole prompt as destination
}

// Generate a detailed prompt for the Gemini model
function generatePromptForDestination(destination: string): string {
  return `
  Generate a comprehensive travel guide for ${destination} with the following details. 
  Format your response as a JSON object with this exact structure:
  {
    "destination": "${destination}",
    "description": "Detailed description of ${destination}, its geography, climate, key attractions, and historical/cultural significance",
    "travelOptions": {
      "flights": [
        // Only include if flights are actually available to this destination
        // For remote or isolated places with no airports, return an empty array
        {
          "type": "Flight",
          "provider": "Actual airline that serves this route (e.g., IndiGo, Air India, Vistara, SpiceJet)",
          "price": "Realistic price in Indian Rupees (₹) based on current market rates for economy class",
          "duration": "Realistic flight duration in hours and minutes",
          "departureTime": "Common departure time (e.g., '10:30 AM')",
          "arrivalTime": "Arrival time based on duration (e.g., '12:45 PM')",
          "details": "Route details including stops if not direct, aircraft type, frequency (e.g., 'Daily', 'Tue, Thu, Sat')",
          "bookingUrl": "Official URL of the airline's website (e.g., https://www.goindigo.in, https://www.airindia.in)"
        }
      ],
      "trains": [
        // Only include if trains are actually available to this destination
        // For places without rail connections, return an empty array
        {
          "type": "Train",
          "provider": "Actual train service name with train number (e.g., 'Rajdhani Express (12301)', 'Shatabdi Express (12026)')",
          "price": "Realistic price in Indian Rupees (₹) with class specified (e.g., '₹1,200 (Sleeper)', '₹2,400 (AC 3-Tier)')",
          "duration": "Realistic travel duration in hours and minutes",
          "departureTime": "Common departure time from major stations",
          "arrivalTime": "Arrival time based on duration",
          "details": "Train frequency, classes available, route information, amenities",
          "bookingUrl": "https://www.irctc.co.in"
        }
      ],
      "buses": [
        {
          "type": "Bus",
          "provider": "Actual bus service provider for this route (e.g., KSRTC, MSRTC, RedBus, Intercity operators)",
          "price": "Realistic price in Indian Rupees (₹) with bus type (e.g., '₹800 (AC Sleeper)', '₹500 (Non-AC Seater)')",
          "duration": "Realistic travel duration in hours and minutes including typical traffic conditions",
          "departureTime": "Common departure time from major bus stations",
          "arrivalTime": "Arrival time based on duration",
          "details": "Bus type (AC/Non-AC, Sleeper/Seater), frequency, onboard facilities, departure location",
          "bookingUrl": "Official URL of the bus provider (e.g., https://www.redbus.in, https://ksrtc.in)"
        }
      ]
    },
    "lodgingOptions": {
      "hotels": [
        {
          "name": "Real hotel name near ${destination} that actually exists",
          "type": "Hotel (with star rating if applicable)",
          "price": "Realistic price per night in Indian Rupees (₹) with room type specified",
          "rating": "Actual rating between 1.0-5.0 based on real reviews",
          "location": "Specific neighborhood, proximity to landmarks or center",
          "amenities": ["List 4-6 actual amenities offered like 'Free Wi-Fi', 'Swimming Pool', 'Restaurant', 'Airport Shuttle'"],
          "bookingUrl": "Official hotel website or specific booking.com/makemytrip/goibibo link"
        }
      ],
      "apartments": [
        {
          "name": "Real apartment/homestay/guesthouse name near ${destination} that actually exists",
          "type": "Apartment/Homestay/Guesthouse",
          "price": "Realistic price per night in Indian Rupees (₹) with occupancy details",
          "rating": "Actual rating between 1.0-5.0 based on real reviews",
          "location": "Specific neighborhood, proximity to landmarks or center",
          "amenities": ["List 4-6 actual amenities offered like 'Kitchen', 'Washing Machine', 'Private Balcony', 'Self Check-in'"],
          "bookingUrl": "Official booking website or Airbnb/VRBO link"
        }
      ],
      "hostels": [
        {
          "name": "Real hostel/budget accommodation near ${destination} that actually exists",
          "type": "Hostel/Dormitory/Budget Hotel",
          "price": "Realistic price per night in Indian Rupees (₹) with bed type specified (dorm/private)",
          "rating": "Actual rating between 1.0-5.0 based on real reviews",
          "location": "Specific neighborhood, proximity to landmarks or center", 
          "amenities": ["List 4-6 actual amenities offered like 'Free Breakfast', 'Locker Storage', 'Common Kitchen', 'Laundry Facilities'"],
          "bookingUrl": "Official booking website or Hostelworld link"
        }
      ]
    },
    "attractions": [
      {
        "name": "Specific major attraction in/near ${destination}",
        "type": "Specific type (e.g., Historical Site, Museum, Natural Wonder, Religious Site)",
        "description": "Detailed description with historical/cultural context, what to expect, and why it's significant",
        "rating": "Actual rating between 1.0-5.0 based on visitor reviews",
        "price": "Current entrance fee in Rupees with concession details or 'Free'",
        "location": "Precise location with neighborhood/area",
        "openingHours": "Actual up-to-date opening hours with day-specific variations if applicable",
        "ticketUrl": "Official ticket booking website if available"
      }
    ],
    "localArtifacts": [
      {
        "name": "Specific authentic local artifact or sweet from ${destination} region, not generic items",
        "description": "Detailed description including materials, production techniques, historical significance, cultural importance, and unique characteristics that differentiate it from similar items in other regions",
        "shops": [
          {
            "name": "Actual named shop that verifiably sells this item (preferably specializing in it)",
            "address": "Specific address or landmark-based location that would allow a visitor to find it",
            "contact": "Current contact number or 'N/A' if not publicly available"
          }
        ]
      }
    ],
    "localArtists": [
      {
        "name": "Named local artist or artisan collective that visitors can actually find",
        "specialty": "Specific traditional or contemporary art form practiced (e.g., 'Madhubani Painting', 'Bidri Metalwork', 'Bronze Sculpture')",
        "location": "Specific studio, workshop, gallery address, or market stall location where visitors can meet them or see their work",
        "contact": "Public contact information (phone, social media handle) or 'N/A' if unavailable",
        "description": "Description of their distinctive style, techniques, materials, recognition (awards/exhibits), and whether they offer demonstrations or workshops for visitors"
      }
    ],
    "nearbyEducationalSites": [
      {
        "name": "Specific educational institution or knowledge-focused site near ${destination}",
        "type": "University/Museum/Library/Research Center/Historical Archive/Science Center",
        "description": "Detailed description focused on educational value, special collections, historical significance, research opportunities, and distinctive architectural features",
        "visitorInfo": "Specific visitor information including guided tour availability, whether prior registration is needed, access to facilities, and special events",
        "address": "Complete physical address",
        "website": "Current official website URL"
      }
    ]
  }
  
  Please research and provide the following with MAXIMUM ACCURACY:
  1. VERIFIED transportation providers that actually serve ${destination} - use real airlines, train services, bus companies with their correct names, routes, and current schedules. If limited or no options exist for a category, return an empty array rather than fabricating connections.
  
  2. CONFIRMED accommodation options near ${destination} - use real hotel/hostel/apartment names that actually exist in the location, with accurate locations, realistic price ranges (in ₹), and verified amenities.
  
  3. FACTUAL attractions and landmarks with precise descriptions, actual opening hours, and current entrance fees. Focus on attractions that are significant to the destination's identity or culture.
  
  4. AUTHENTIC local artifacts, crafts, and sweet treats that are SPECIFICALLY associated with ${destination} region, not generic items found throughout the country. Include:
     - Traditional manufacturing processes
     - Materials unique to the region
     - Cultural or religious significance
     - Distinctive regional designs or flavors
     - Shops where these items are genuinely available (with current contacts)
  
  5. GENUINE information about local artists in ${destination}, focusing on:
     - Artists/artisans with established workshops or galleries
     - Traditional craftspeoplE preserving cultural heritage
     - Well-known local experts in their field
     - Whether they offer demonstrations or workshops for visitors
     - Accurate locations where visitors can see their work or meet them
  
  6. ACCURATE educational and historical sites with correct visitor information including:
     - Academic facilities open to visitors
     - Research institutions with public programs
     - Knowledge-focused attractions (science centers, historical archives)
     - Libraries or museums with special collections
     - Campus tour availability and educational programs
     - Whether appointments/prior registration is required
  
  Special instructions:
  - For remote or less-visited destinations, return smaller arrays with only verified options rather than fabricating entities
  - If ${destination} is a smaller location, include travel options to/from the nearest major transportation hub
  - For educational institutions like universities, provide specific visitor information including campus tour details
  - Include realistic price ranges that reflect the current market rates (as of 2024-2025)
  - For attractions, prioritize those with cultural, historical, or educational significance
  - DO NOT generate fictitious business names or generic descriptions
  - If specific authenticated information is limited for any category, it is better to provide fewer accurate entries than many fictional ones
  
  Return EXACTLY 3-5 items for transportation options, lodging, and attractions categories.
  Return EXACTLY 2-3 items for local artifacts, local artists, and educational sites categories.
  
  Return ONLY the JSON object with no additional text.
  `;
}

// Function to generate location-specific mock travel data
function generateLocationSpecificMockData(destination: string): string {
  // This function provides location-specific fallback data when the API fails
  
  // We'll customize the data based on destination characteristics
  let countryOrRegion = "";
  let localAirlines: string[] = [];
  let localTrains: string[] = [];
  let localBuses: string[] = [];
  let attractions: any[] = [];
  
  // Set region-specific providers and details based on destination
  if (["new york", "los angeles", "chicago", "san francisco", "boston", "miami"].includes(destination.toLowerCase())) {
    countryOrRegion = "USA";
    localAirlines = getFlightOperators("USA");
    localTrains = getTrainOperators("USA");
    localBuses = getBusOperators("USA");
  } 
  else if (["london", "manchester", "liverpool", "edinburgh", "glasgow"].includes(destination.toLowerCase())) {
    countryOrRegion = "UK";
    localAirlines = getFlightOperators("UK");
    localTrains = getTrainOperators("UK");
    localBuses = getBusOperators("UK");
  }
  else if (["paris", "nice", "lyon", "marseille", "bordeaux"].includes(destination.toLowerCase())) {
    countryOrRegion = "France";
    localAirlines = getFlightOperators("France");
    localTrains = getTrainOperators("France");
    localBuses = getBusOperators("France");
  }
  else if (["rome", "milan", "venice", "florence", "naples"].includes(destination.toLowerCase())) {
    countryOrRegion = "Italy";
    localAirlines = getFlightOperators("Italy");
    localTrains = getTrainOperators("Italy");
    localBuses = getBusOperators("Italy");
  }
  else if (["tokyo", "osaka", "kyoto", "hiroshima", "sapporo"].includes(destination.toLowerCase())) {
    countryOrRegion = "Japan";
    localAirlines = getFlightOperators("Japan");
    localTrains = getTrainOperators("Japan");
    localBuses = getBusOperators("Japan");
  }
  else if (["delhi", "mumbai", "bangalore", "chennai", "kolkata", "jaipur", "hampi"].includes(destination.toLowerCase())) {
    countryOrRegion = "India";
    localAirlines = getFlightOperators("India");
    localTrains = getTrainOperators("India");
    localBuses = getBusOperators("India");
  }
  else if (["sydney", "melbourne", "brisbane", "perth", "adelaide"].includes(destination.toLowerCase())) {
    countryOrRegion = "Australia";
    localAirlines = getFlightOperators("Australia");
    localTrains = getTrainOperators("Australia");
    localBuses = getBusOperators("Australia");
  }
  else {
    // Generic providers for locations not in our specific lists
    countryOrRegion = "International";
    localAirlines = getFlightOperators("International");
    localTrains = getTrainOperators("International");
    localBuses = getBusOperators("International");
    
    // For locations not in our database, we'll try to make educated guesses
    if (destination.toLowerCase().includes("beach") || destination.toLowerCase().includes("island")) {
      localAirlines = getFlightOperators("Island");
      attractions = [
        {
          "name": `${destination} Beach`,
          "type": "Beach",
          "description": `Beautiful sandy beaches with crystal clear waters.`,
          "rating": 4.8,
          "price": "Free",
          "location": "Coastal Area",
          "openingHours": "Always Open",
          "ticketUrl": "https://visitbeaches.com/free-entry"
        },
        {
          "name": "Coral Reef Tours",
          "type": "Nature",
          "description": "Guided snorkeling tours of the vibrant coral reefs.",
          "rating": 4.7,
          "price": "₹2,500",
          "location": "Pier",
          "openingHours": "9:00 AM - 4:00 PM",
          "ticketUrl": "https://coralreeftours.com/tickets"
        }
      ];
    }
  }
  
  // Generate attractions based on destination if not already set
  if (attractions.length === 0) {
    attractions = [
      {
        "name": `${destination} Historical Museum`,
        "type": "Museum",
        "description": `Explore the rich history of ${destination} through interactive exhibits and ancient artifacts.`,
        "rating": 4.6,
        "price": "₹1,200",
        "location": "Cultural District",
        "openingHours": "9:00 AM - 5:00 PM, Closed Mondays",
        "ticketUrl": "https://historicalmuseums.com/tickets"
      },
      {
        "name": `${destination} Botanical Gardens`,
        "type": "Park",
        "description": "Beautiful gardens featuring local and exotic plants in a peaceful setting.",
        "rating": 4.8,
        "price": "₹650",
        "location": "East Side",
        "openingHours": "8:00 AM - 7:00 PM Daily",
        "ticketUrl": "https://botanicalgardens.com/tickets"
      },
      {
        "name": `${destination} Tower`,
        "type": "Landmark",
        "description": `The iconic symbol of ${destination} offering panoramic views of the entire city.`,
        "rating": 4.9,
        "price": "₹1,800",
        "location": "City Center",
        "openingHours": "10:00 AM - 10:00 PM Daily",
        "ticketUrl": "https://citytowers.com/tickets"
      },
      {
        "name": `Old Town ${destination}`,
        "type": "District",
        "description": "Charming historic area with cobblestone streets, traditional architecture, and local shops.",
        "rating": 4.7,
        "price": "Free",
        "location": "City Center",
        "openingHours": "Always Open",
        "ticketUrl": "https://oldtowntours.com/walking-tours"
      },
      {
        "name": `${destination} Food Tour`,
        "type": "Tour",
        "description": "Guided culinary experience sampling local delicacies and traditional cuisine.",
        "rating": 4.5,
        "price": "₹5,300",
        "location": "Various Locations",
        "openingHours": "Tours at 11:00 AM and 5:00 PM",
        "ticketUrl": "https://foodtours.com/book-now"
      }
    ];
  }
  
  // Get random elements from our arrays to avoid same options every time
  const getRandomElements = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, arr.length));
  };
  
  // Pick random providers from our lists
  const selectedAirlines = getRandomElements(localAirlines, 3);
  const selectedTrains = getRandomElements(localTrains, 2);
  const selectedBuses = getRandomElements(localBuses, 2);
  
  // Create mock JSON response
  // Generate a description for the destination
  let description = "";
  if (destination.toLowerCase().includes("hampi")) {
    description = "Hampi is a UNESCO World Heritage Site located in Karnataka, India. It's famous for its ruins of the Vijayanagara Empire, with stunning ancient temples, boulder-strewn landscapes, and the magnificent Virupaksha Temple. Visitors can explore the Stone Chariot, Vittala Temple, and Elephant Stables while experiencing the rich history of this 14th-century capital.";
  } else if (countryOrRegion === "India") {
    description = `${destination} is a vibrant destination in India known for its rich cultural heritage, historic monuments, and diverse culinary experiences. Visitors can explore the blend of ancient traditions and modern attractions while enjoying the warm hospitality of locals.`;
  } else if (countryOrRegion === "USA") {
    description = `${destination} offers a perfect blend of urban excitement and natural beauty. This American destination features iconic landmarks, diverse neighborhoods, and countless entertainment options for travelers of all types.`;
  } else if (countryOrRegion === "UK") {
    description = `${destination} showcases the quintessential British charm with its historic architecture, cultural institutions, and scenic landscapes. Visitors can enjoy exploring the local heritage, sampling traditional cuisine, and experiencing the unique atmosphere.`;
  } else if (countryOrRegion === "Japan") {
    description = `${destination} perfectly balances traditional Japanese culture with modern innovation. Visitors can experience ancient temples, beautiful gardens, and vibrant city life, all while enjoying world-class cuisine and hospitality.`;
  } else {
    description = `${destination} is a fascinating destination offering travelers a mix of cultural attractions, natural beauty, and unique experiences. Visitors can immerse themselves in local traditions while exploring popular landmarks and hidden gems.`;
  }

  return JSON.stringify({
    "destination": destination,
    "description": description,
    "travelOptions": {
      "flights": selectedAirlines.length > 0 ? selectedAirlines.map(airline => ({
        "type": "Flight",
        "provider": airline,
        "price": "₹" + (3000 + Math.floor(Math.random() * 2000)).toString(),
        "duration": Math.floor(1 + Math.random() * 3) + "h " + Math.floor(Math.random() * 50) + "m",
        "departureTime": Math.floor(5 + Math.random() * 15) + ":" + (Math.random() > 0.5 ? "30" : "00") + " AM",
        "arrivalTime": Math.floor(1 + Math.random() * 12) + ":" + (Math.random() > 0.5 ? "30" : "00") + " PM",
        "details": "Direct flight to " + destination + " with in-flight meals",
        "bookingUrl": getBookingUrl(airline, "flight", "India", destination, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      })) : [],
      "trains": selectedTrains.length > 0 ? selectedTrains.map(train => ({
        "type": "Train",
        "provider": train,
        "price": "₹" + (1000 + Math.floor(Math.random() * 1500)).toString(),
        "duration": Math.floor(5 + Math.random() * 10) + "h " + Math.floor(Math.random() * 50) + "m",
        "departureTime": Math.floor(1 + Math.random() * 23) + ":" + (Math.random() > 0.5 ? "30" : "00"),
        "arrivalTime": Math.floor(1 + Math.random() * 23) + ":" + (Math.random() > 0.5 ? "30" : "00"),
        "details": "Train to " + destination + " with comfortable seating and catering",
        "bookingUrl": getBookingUrl("IRCTC", "train", "India", destination, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      })) : [],
      "buses": selectedBuses.length > 0 ? selectedBuses.map(bus => ({
        "type": "Bus",
        "provider": bus,
        "price": "₹" + (500 + Math.floor(Math.random() * 1000)).toString(),
        "duration": Math.floor(3 + Math.random() * 8) + "h " + Math.floor(Math.random() * 50) + "m",
        "departureTime": Math.floor(1 + Math.random() * 23) + ":" + (Math.random() > 0.5 ? "30" : "00"),
        "arrivalTime": Math.floor(1 + Math.random() * 23) + ":" + (Math.random() > 0.5 ? "30" : "00"),
        "details": "Comfortable bus service to " + destination,
        "bookingUrl": getBookingUrl(bus, "bus", "India", destination, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      })) : []
    },
    "lodgingOptions": {
      "hotels": [
        {
          "name": `Grand Hotel ${destination}`,
          "type": "Hotel",
          "price": "₹17,000",
          "rating": 4.7,
          "location": "City Center",
          "amenities": ["Free Wi-Fi", "Swimming Pool", "Restaurant", "Fitness Center", "Room Service"],
          "bookingUrl": "https://www.booking.com/hotels"
        },
        {
          "name": `${destination} Plaza Hotel`,
          "type": "Hotel",
          "price": "₹14,500",
          "rating": 4.5,
          "location": "Downtown",
          "amenities": ["Free Wi-Fi", "Restaurant", "Spa", "Business Center"],
          "bookingUrl": "https://www.hotels.com"
        },
        {
          "name": `Comfort Inn ${destination}`,
          "type": "Hotel",
          "price": "₹10,000",
          "rating": 4.2,
          "location": "Near Transport Hub",
          "amenities": ["Free Wi-Fi", "Breakfast Included", "Parking"],
          "bookingUrl": "https://www.expedia.com/hotels"
        }
      ],
      "apartments": [
        {
          "name": "Luxury Downtown Apartment",
          "type": "Apartment",
          "price": "₹13,000",
          "rating": 4.8,
          "location": "City Center",
          "amenities": ["Full Kitchen", "Washer/Dryer", "Free Wi-Fi", "Balcony"],
          "bookingUrl": "https://www.airbnb.com"
        },
        {
          "name": `Modern Studio near ${destination} Attractions`,
          "type": "Apartment",
          "price": "₹9,000",
          "rating": 4.4,
          "location": "Tourist District",
          "amenities": ["Kitchenette", "Free Wi-Fi", "24h Check-in"],
          "bookingUrl": "https://www.vrbo.com"
        }
      ],
      "hostels": [
        {
          "name": `${destination} Backpackers Hostel`,
          "type": "Hostel",
          "price": "₹2,900",
          "rating": 4.3,
          "location": "Near Public Transport",
          "amenities": ["Free Wi-Fi", "Communal Kitchen", "Lockers", "Laundry"],
          "bookingUrl": "https://www.hostelworld.com"
        },
        {
          "name": `Traveler's Rest ${destination}`,
          "type": "Hostel",
          "price": "₹2,500",
          "rating": 4.1,
          "location": "Central Area",
          "amenities": ["Free Wi-Fi", "Breakfast Included", "Common Area"],
          "bookingUrl": "https://www.hostels.com"
        }
      ]
    },
    "attractions": attractions,
    "localArtifacts": [
      {
        "name": "Local Sweet",
        "description": "A traditional sweet dish famous in ${destination} region, made with local ingredients and known for its unique flavor.",
        "shops": [
          {
            "name": "Local Sweet Shop",
            "address": "Main Market, ${destination}",
            "contact": "N/A"
          }
        ]
      },
      {
        "name": "Handicraft",
        "description": "A local handicraft item, known for its intricate designs and craftsmanship, made by artisans in ${destination}.",
        "shops": [
          {
            "name": "Handicraft Store",
            "address": "Tourist Area, ${destination}",
            "contact": "N/A"
          }
        ]
      }
    ],
    "localArtists": [
      {
        "name": "Local Artist",
        "specialty": "Painting",
        "location": "Art Studio, ${destination}",
        "contact": "N/A",
        "description": "A local artist known for their vibrant paintings of ${destination}'s landscapes and culture."
      },
      {
        "name": "Local Musician",
        "specialty": "Music",
        "location": "Music School, ${destination}",
        "contact": "N/A",
        "description": "A local musician who teaches and performs traditional music of ${destination}."
      }
    ]
  });
}
