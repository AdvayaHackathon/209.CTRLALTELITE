import { create } from 'zustand';
import { getGeminiResponse } from '@/lib/gemini';

// Define types for our travel data
export interface TravelData {
  destination: string;
  description: string;
  travelOptions: {
    flights: Array<{
      type: string;
      provider: string;
      price: string;
      duration: string;
      departureTime: string;
      arrivalTime: string;
      details: string;
      bookingUrl: string;
    }>;
    trains: Array<{
      type: string;
      provider: string;
      price: string;
      duration: string;
      departureTime: string;
      arrivalTime: string;
      details: string;
      bookingUrl: string;
    }>;
    buses: Array<{
      type: string;
      provider: string;
      price: string;
      duration: string;
      departureTime: string;
      arrivalTime: string;
      details: string;
      bookingUrl: string;
    }>;
  };
  lodgingOptions: {
    hotels: Array<{
      name: string;
      type: string;
      price: string;
      rating: number;
      location: string;
      amenities: string[];
      image?: string;
      bookingUrl: string;
    }>;
    apartments: Array<{
      name: string;
      type: string;
      price: string;
      rating: number;
      location: string;
      amenities: string[];
      image?: string;
      bookingUrl: string;
    }>;
    hostels: Array<{
      name: string;
      type: string;
      price: string;
      rating: number;
      location: string;
      amenities: string[];
      image?: string;
      bookingUrl: string;
    }>;
  };
  attractions: Array<{
    name: string;
    type: string;
    description: string;
    rating: number;
    price: string;
    location: string;
    openingHours?: string;
    image?: string;
    ticketUrl?: string;
  }>;
  localArtifacts?: Array<{
    name: string;
    description: string;
    shops: Array<{
      name: string;
      address: string;
      contact?: string;
    }>;
  }>;
  localArtists?: Array<{
    name: string;
    specialty: string;
    location: string;
    contact: string;
    description?: string;
  }>;
  nearbyEducationalSites?: Array<{
    name: string;
    type: string;
    description: string;
    visitorInfo?: string;
    address: string;
    website?: string;
  }>;
}

interface TravelStore {
  travelData: TravelData | null;
  isGenerating: boolean;
  error: string | null;
  setTravelData: (data: TravelData) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  generateTravelData: (destination: string, userLocation?: string) => Promise<void>;
}

export const useStore = create<TravelStore>((set) => ({
  travelData: null,
  isGenerating: false,
  error: null,
  
  setTravelData: (data) => set({ travelData: data }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setError: (error) => set({ error }),
  
  generateTravelData: async (destination, userLocation = "India") => {
    set({ isGenerating: true, error: null });
    
    try {
      // Create a prompt that will ask Gemini to generate travel data in the format we need
      const prompt = `
      Generate a comprehensive travel guide for ${destination} with the following details.
      The user is traveling from ${userLocation}.
      Format your response as a JSON object with this exact structure:
      {
        "destination": "${destination}",
        "description": "Brief 2-3 sentence description of the destination",
        "travelOptions": {
          "flights": [
            {
              "type": "Flight",
              "provider": "Provider name",
              "price": "Price in Indian Rupees (₹)",
              "duration": "Flight duration",
              "departureTime": "Departure time",
              "arrivalTime": "Arrival time",
              "details": "Short description",
              "bookingUrl": "Booking URL"
            }
          ],
          "trains": [
            {
              "type": "Train",
              "provider": "Provider name",
              "price": "Price in Indian Rupees (₹)",
              "duration": "Travel duration",
              "departureTime": "Departure time",
              "arrivalTime": "Arrival time",
              "details": "Short description",
              "bookingUrl": "Booking URL"
            }
          ],
          "buses": [
            {
              "type": "Bus",
              "provider": "Provider name",
              "price": "Price in Indian Rupees (₹)",
              "duration": "Travel duration",
              "departureTime": "Departure time",
              "arrivalTime": "Arrival time",
              "details": "Short description",
              "bookingUrl": "Booking URL"
            }
          ]
        },
        "lodgingOptions": {
          "hotels": [
            {
              "name": "Hotel name",
              "type": "Hotel",
              "price": "Price per night in USD",
              "rating": 4.5,
              "location": "Location description",
              "amenities": ["Amenity 1", "Amenity 2", "Amenity 3"],
              "bookingUrl": "Booking URL"
            }
          ],
          "apartments": [
            {
              "name": "Apartment name",
              "type": "Apartment",
              "price": "Price per night in USD",
              "rating": 4.2,
              "location": "Location description",
              "amenities": ["Amenity 1", "Amenity 2", "Amenity 3"],
              "bookingUrl": "Booking URL"
            }
          ],
          "hostels": [
            {
              "name": "Hostel name",
              "type": "Hostel",
              "price": "Price per night in USD",
              "rating": 3.8,
              "location": "Location description",
              "amenities": ["Amenity 1", "Amenity 2", "Amenity 3"],
              "bookingUrl": "Booking URL"
            }
          ]
        },
        "attractions": [
          {
            "name": "Attraction name",
            "type": "Type (e.g., Museum, Park, etc.)",
            "description": "Detailed description",
            "rating": 4.7,
            "price": "Price or 'Free'",
            "location": "Location description",
            "openingHours": "Opening hours"
          }
        ],
        "localArtifacts": [
          {
            "name": "Artifact or Sweet name",
            "description": "Detailed description of this famous local artifact or sweet, including its historical significance, cultural importance, and where it can be found",
            "shops": [
              {
                "name": "Shop name where tourists can buy it",
                "address": "Shop address/location",
                "contact": "Contact number if known, otherwise N/A"
              }
            ]
          }
        ],
        "localArtists": [
          {
            "name": "Artist name",
            "specialty": "Art specialty (e.g., stone carving, embroidery, etc.)",
            "location": "Where to find this artist, including their workshop or studio address",
            "contact": "Phone or Instagram handle if publicly known, otherwise N/A",
            "description": "Brief description of the artist's work, including their inspiration and creative process"
          }
        ],
        "nearbyEducationalSites": [
          {
            "name": "Educational site name",
            "type": "Type (e.g., University, Museum, etc.)",
            "description": "Detailed description",
            "visitorInfo": "Visitor information",
            "address": "Address",
            "website": "Website URL"
          }
        ]
      }
      
      Please include 3-5 items for each category (except the new localArtifacts and localArtists sections, which should have 2-3 items each), with realistic details about transportation options, lodging choices, and popular attractions in ${destination}. For local artifacts, focus on famous local crafts and sweets specific to the region, and provide information on their cultural significance and where they can be found. For local artists, include authentic local artisans with their specialties, and provide information on their creative process and where to find them. Provide accurate price ranges, ratings, and descriptions.
      Return ONLY the JSON object with no additional text.
      `;
      
      // Call the Gemini API
      const response = await getGeminiResponse(prompt);
      
      // Parse the response as JSON
      let travelData: TravelData;
      try {
        // First try to parse the response directly
        travelData = JSON.parse(response);
      } catch (error) {
        // If direct parsing fails, try to extract JSON from text
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          travelData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Failed to parse JSON from response");
        }
      }
      
      set({ travelData, isGenerating: false });
    } catch (error) {
      console.error("Error generating travel data:", error);
      set({ 
        error: error instanceof Error ? error.message : "An unknown error occurred", 
        isGenerating: false 
      });
    }
  },
}));
