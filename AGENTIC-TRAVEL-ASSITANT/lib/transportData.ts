// Bus operator information including booking URLs
export interface BusOperator {
  name: string;
  bookingUrl: string;
  logo?: string;
  urlTemplate?: string; // For path-based URL templates like "https://www.redbus.in/bus-tickets/{source}-to-{destination}"
  preFillParams?: {
    source?: string;
    destination?: string;
    date?: string;
    returnDate?: string;
    passengers?: string;
  };
}

// Flight operator information including booking URLs
export interface FlightOperator {
  name: string;
  bookingUrl: string;
  logo?: string;
  urlTemplate?: string; // For path-based URL templates
  preFillParams?: {
    source?: string;
    destination?: string;
    departDate?: string;
    returnDate?: string;
    adults?: string;
    children?: string;
    infants?: string;
    cabinClass?: string;
  };
}

// Train operator information including booking URLs
export interface TrainOperator {
  name: string;
  bookingUrl: string;
  logo?: string;
  urlTemplate?: string; // For path-based URL templates
  preFillParams?: {
    source?: string;
    destination?: string;
    date?: string;
    trainNumber?: string;
    passengers?: string;
    class?: string;
  };
}

// Bus operator mapping with their booking URLs
const busOperatorBookingUrls: Record<string, BusOperator> = {
  "RedBus": { 
    name: "RedBus",
    bookingUrl: "https://www.redbus.in/bus-tickets", 
    urlTemplate: "https://www.redbus.in/bus-tickets/{source}-to-{destination}",
    preFillParams: {
      source: "srcStation",
      destination: "destStation",
      date: "onward",
      returnDate: "return"
    }
  },
  "AbhiBus": { 
    name: "AbhiBus",
    bookingUrl: "https://www.abhibus.com/bus-tickets", 
    urlTemplate: "https://www.abhibus.com/bus-tickets/{source}-{destination}-bus-tickets",
    preFillParams: {
      source: "source",
      destination: "destination",
      date: "journey_date"
    }
  },
  "MakeMyTrip Bus": { 
    name: "MakeMyTrip",
    bookingUrl: "https://www.makemytrip.com/bus-tickets", 
    urlTemplate: "https://www.makemytrip.com/bus-tickets/{source}-{destination}-bus-tickets",
    preFillParams: {
      source: "fromCity",
      destination: "toCity",
      date: "departureDate"
    }
  },
  "Goibibo Bus": { 
    name: "Goibibo",
    bookingUrl: "https://www.goibibo.com/bus", 
    urlTemplate: "https://www.goibibo.com/bus/{source}-to-{destination}-bus",
    preFillParams: {
      source: "srcCity",
      destination: "destCity",
      date: "date"
    }
  },
  "APSRTC": { 
    name: "APSRTC",
    bookingUrl: "https://www.apsrtconline.in/oprs-web/guest/home.do", 
    preFillParams: {
      source: "startPlaceId",
      destination: "endPlaceId",
      date: "journeyDate"
    }
  },
  "TNSTC": { 
    name: "TNSTC",
    bookingUrl: "https://www.tnstc.in/home.html" 
  },
  "KSRTC": { 
    name: "KSRTC",
    bookingUrl: "https://ksrtc.in/oprs-web/guest/home.do",
    preFillParams: {
      source: "fromPlaceName",
      destination: "toPlaceName",
      date: "txtJourneyDate"
    }
  },
  "MSRTC": { 
    name: "MSRTC",
    bookingUrl: "https://msrtc.maharashtra.gov.in/msrtc/e_reservation" 
  },
  "TSRTC": { 
    name: "TSRTC",
    bookingUrl: "https://www.tsrtconline.in/oprs-web/guest/home.do",
    preFillParams: {
      source: "startPlaceId",
      destination: "endPlaceId",
      date: "journeyDate"
    }
  },
  "VRL Travels": { 
    name: "VRL Travels",
    bookingUrl: "https://www.vrlbus.in" 
  },
  "SRS Travels": { 
    name: "SRS Travels",
    bookingUrl: "https://www.srstravels.co.in" 
  },
  "KPN Travels": { 
    name: "KPN Travels",
    bookingUrl: "https://www.kpntravels.in" 
  }
};

// Flight operator mapping with their booking URLs
const flightOperatorBookingUrls: Record<string, FlightOperator> = {
  "IndiGo": { 
    name: "IndiGo",
    bookingUrl: "https://www.goindigo.in", 
    urlTemplate: "https://www.goindigo.in/flight-tickets/{source}-{destination}.html",
    preFillParams: {
      source: "fromCity",
      destination: "toCity",
      departDate: "departureDate",
      returnDate: "returnDate",
      adults: "adults",
      children: "children",
      infants: "infants",
      cabinClass: "cabinClass"
    }
  },
  "SpiceJet": { 
    name: "SpiceJet",
    bookingUrl: "https://www.spicejet.com", 
    urlTemplate: "https://www.spicejet.com/search?from={source}&to={destination}",
    preFillParams: {
      source: "fromCity",
      destination: "toCity",
      departDate: "departureDate",
      returnDate: "returnDate",
      adults: "adults",
      children: "children",
      infants: "infants",
      cabinClass: "cabinClass"
    }
  },
  "Air India": { 
    name: "Air India",
    bookingUrl: "https://www.airindia.in", 
    urlTemplate: "https://www.airindia.in/book-flight.htm?from={source}&to={destination}",
    preFillParams: {
      source: "fromCity",
      destination: "toCity",
      departDate: "departureDate",
      returnDate: "returnDate",
      adults: "adults",
      children: "children",
      infants: "infants",
      cabinClass: "cabinClass"
    }
  }
};

// Train operator mapping with their booking URLs
const trainOperatorBookingUrls: Record<string, TrainOperator> = {
  "IRCTC": { 
    name: "IRCTC",
    bookingUrl: "https://www.irctc.co.in", 
    urlTemplate: "https://www.irctc.co.in/nget/train-search?fromStation={source}&toStation={destination}",
    preFillParams: {
      source: "fromStation",
      destination: "toStation",
      date: "journeyDate",
      trainNumber: "trainNumber",
      passengers: "passengers",
      class: "class"
    }
  }
};

// Function to get booking URL with pre-filled details for a specific operator
export const getBookingUrl = (
  operatorName: string, 
  transportType: string,
  source: string,
  destination: string,
  date: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 1 week from now
): string => {
  let operator;
  switch (transportType.toLowerCase()) {
    case "bus":
      operator = busOperatorBookingUrls[operatorName];
      break;
    case "flight":
      operator = flightOperatorBookingUrls[operatorName];
      break;
    case "train":
      operator = trainOperatorBookingUrls[operatorName];
      break;
    default:
      return "";
  }

  if (!operator) return "";
  
  // Format date as YYYY-MM-DD
  const formattedDate = date.toISOString().split('T')[0];
  
  // Format source and destination for URL path (convert spaces to hyphens and make lowercase)
  const formattedSource = source.toLowerCase().replace(/\s+/g, '-');
  const formattedDestination = destination.toLowerCase().replace(/\s+/g, '-');
  
  // Check if this operator uses a URL template (path-based URL)
  if (operator.urlTemplate) {
    // Create URL from template with dynamic source and destination replacement
    const formattedUrl = operator.urlTemplate
      .replace('{source}', formattedSource)
      .replace('{destination}', formattedDestination);
    
    try {
      // Create URL object for further parameter additions
      const url = new URL(formattedUrl);
      
      // Add date parameter(s) based on transport type
      if (transportType.toLowerCase() === 'flight') {
        const flightOperator = operator as FlightOperator;
        if (flightOperator.preFillParams?.departDate) {
          url.searchParams.append(flightOperator.preFillParams.departDate, formattedDate);
        }
        
        if (flightOperator.preFillParams?.returnDate) {
          // Set return date to a week after departure by default
          const returnDate = new Date(date);
          returnDate.setDate(returnDate.getDate() + 7);
          url.searchParams.append(flightOperator.preFillParams.returnDate, returnDate.toISOString().split('T')[0]);
        }
        
        // Add passenger info if supported
        if (flightOperator.preFillParams?.adults) {
          url.searchParams.append(flightOperator.preFillParams.adults, "1");
        }
      } else if (transportType.toLowerCase() === 'train') {
        const trainOperator = operator as TrainOperator;
        if (trainOperator.preFillParams?.date) {
          url.searchParams.append(trainOperator.preFillParams.date, formattedDate);
        }
      } else if (transportType.toLowerCase() === 'bus') {
        const busOperator = operator as BusOperator;
        if (busOperator.preFillParams?.date) {
          url.searchParams.append(busOperator.preFillParams.date, formattedDate);
        }
      }
      
      return url.toString();
    } catch (error) {
      // Fallback to basic URL if there's an error with the template
      console.error("Error creating URL from template:", error);
      return operator.bookingUrl;
    }
  }
  
  // If no URL template, use query parameters approach
  try {
    const url = new URL(operator.bookingUrl);
    
    // Add source city if supported
    if (operator.preFillParams?.source && source) {
      url.searchParams.append(operator.preFillParams.source, source);
    }
    
    // Add destination city if supported
    if (operator.preFillParams?.destination && destination) {
      url.searchParams.append(operator.preFillParams.destination, destination);
    }
    
    // Add travel date parameters based on transport type
    if (transportType.toLowerCase() === 'flight') {
      const flightOperator = operator as FlightOperator;
      if (flightOperator.preFillParams?.departDate) {
        url.searchParams.append(flightOperator.preFillParams.departDate, formattedDate);
      }
      
      if (flightOperator.preFillParams?.returnDate) {
        // Set return date to a week after departure by default
        const returnDate = new Date(date);
        returnDate.setDate(returnDate.getDate() + 7);
        url.searchParams.append(flightOperator.preFillParams.returnDate, returnDate.toISOString().split('T')[0]);
      }
      
      if (flightOperator.preFillParams?.adults) {
        url.searchParams.append(flightOperator.preFillParams.adults, "1");
      }
      
      if (flightOperator.preFillParams?.children) {
        url.searchParams.append(flightOperator.preFillParams.children, "0");
      }
      
      if (flightOperator.preFillParams?.infants) {
        url.searchParams.append(flightOperator.preFillParams.infants, "0");
      }
      
      if (flightOperator.preFillParams?.cabinClass) {
        url.searchParams.append(flightOperator.preFillParams.cabinClass, "Economy");
      }
    } else if (transportType.toLowerCase() === 'train') {
      const trainOperator = operator as TrainOperator;
      if (trainOperator.preFillParams?.date) {
        url.searchParams.append(trainOperator.preFillParams.date, formattedDate);
      }
      
      if (trainOperator.preFillParams?.trainNumber) {
        url.searchParams.append(trainOperator.preFillParams.trainNumber, "12345");
      }
      
      if (trainOperator.preFillParams?.passengers) {
        url.searchParams.append(trainOperator.preFillParams.passengers, "1");
      }
      
      if (trainOperator.preFillParams?.class) {
        url.searchParams.append(trainOperator.preFillParams.class, "2A");
      }
    } else if (transportType.toLowerCase() === 'bus') {
      const busOperator = operator as BusOperator;
      if (busOperator.preFillParams?.date) {
        url.searchParams.append(busOperator.preFillParams.date, formattedDate);
      }
      
      if (busOperator.preFillParams?.returnDate) {
        // Set return date to a week after departure by default
        const returnDate = new Date(date);
        returnDate.setDate(returnDate.getDate() + 7);
        url.searchParams.append(busOperator.preFillParams.returnDate, returnDate.toISOString().split('T')[0]);
      }
      
      if (busOperator.preFillParams?.passengers) {
        url.searchParams.append(busOperator.preFillParams.passengers, "1");
      }
    }
    
    return url.toString();
  } catch (error) {
    console.error("Error creating booking URL:", error);
    return operator.bookingUrl;
  }
};

// Database of Indian transport operators
// This could be expanded or fetched from an actual API

// Popular Indian bus operators by region
export const getBusOperators = (region: string): string[] => {
  // Default operators available nationwide
  const nationalOperators = [
    "RedBus",
    "AbhiBus",
    "MakeMyTrip Bus",
    "Goibibo Bus",
    "APSRTC",
    "TNSTC",
    "KSRTC",
    "MSRTC",
  ];

  // Region-specific operators
  const regionOperators: Record<string, string[]> = {
    // South India
    "Karnataka": ["KSRTC", "VRL Travels", "SRS Travels", "Durgamba Motors", "Sharma Travels"],
    "Tamil Nadu": ["TNSTC", "SETC", "KPN Travels", "SRM Travels", "YBM Travels", "Parveen Travels"],
    "Kerala": ["KSRTC (Kerala)", "Kallada Travels", "Suresh Kallada", "KPN Travels", "Shama Tourists"],
    "Andhra Pradesh": ["APSRTC", "Diwakar Travels", "Kaveri Travels", "Orange Travels", "Morning Star Travels"],
    "Telangana": ["TSRTC", "Jabbar Travels", "Kaveri Travels", "Orange Travels", "Chartered Bus"],
    
    // North India
    "Delhi": ["DTC", "DIMTS", "Laxmi Travels", "Hans Travels", "Cityway Travels"],
    "Uttar Pradesh": ["UPSRTC", "Shatabdi Travels", "Prasanna Purple", "Hans Travels"],
    "Punjab": ["PRTC", "PUNBUS", "New Deep Bus Service", "Libra Bus Service", "Kartar Bus Service"],
    "Rajasthan": ["RSRTC", "Jain Travels", "Mahalaxmi Travels", "Kalpana Travels"],
    
    // West India
    "Maharashtra": ["MSRTC", "Neeta Tours and Travels", "Purple Travels", "Konduskar Travels", "Prasanna Purple"],
    "Gujarat": ["GSRTC", "Patel Tours and Travels", "Eagle Travels", "Chartered Bus", "Royal Travels"],
    "Goa": ["Kadamba Transport", "Paulo Travels", "Neeta Tours", "Anand Travels"],
    
    // East India
    "West Bengal": ["WBTC", "Shyamoli Paribahan", "Durgapur Express", "Green Line", "Royal Cruiser"],
    "Odisha": ["OSRTC", "Nanda Travels", "Dolphin Travels", "Bajrangbali Travels"],
    "Bihar": ["BSRTC", "Danapur Bus Service", "Sindhu Bus Service", "Utkarsh Travels"],
    
    // Northeast
    "Assam": ["ASTC", "Network Travels", "Chalo", "Blue Hill Travels"],
    "Meghalaya": ["MTC", "Winger Service", "Network Travels"],
    
    // Central India
    "Madhya Pradesh": ["MPSRTC", "Hans Travels", "Chartered Bus", "Pawan Travels"],
    "Chhattisgarh": ["CGSRTC", "Shrinath Travels", "Chartered Bus", "Mahendra Travels"],
  };

  // Check if we have specific operators for this region
  const lowerCaseRegion = region.toLowerCase();
  
  // Try to match the region name
  for (const [r, operators] of Object.entries(regionOperators)) {
    if (lowerCaseRegion.includes(r.toLowerCase())) {
      // Return region-specific operators plus some nationals
      return [...operators, ...nationalOperators.slice(0, 3)];
    }
  }

  // For cities, try to map to their state
  const cityToState: Record<string, string> = {
    "mumbai": "Maharashtra",
    "delhi": "Delhi",
    "bangalore": "Karnataka",
    "bengaluru": "Karnataka",
    "hyderabad": "Telangana",
    "chennai": "Tamil Nadu",
    "kolkata": "West Bengal",
    "jaipur": "Rajasthan",
    "pune": "Maharashtra",
    "ahmedabad": "Gujarat",
    "lucknow": "Uttar Pradesh",
    "kochi": "Kerala",
    "goa": "Goa",
    "chandigarh": "Punjab",
    "coimbatore": "Tamil Nadu",
    "indore": "Madhya Pradesh",
    "bhubaneswar": "Odisha",
    "guwahati": "Assam",
  };
  
  for (const [city, state] of Object.entries(cityToState)) {
    if (lowerCaseRegion.includes(city)) {
      const stateOperators = regionOperators[state] || [];
      return [...stateOperators, ...nationalOperators.slice(0, 3)];
    }
  }

  // If no specific region match, return national operators
  return nationalOperators;
};

// Popular Indian flight operators
export const getFlightOperators = (region: string): string[] => {
  // Default operators available nationwide
  const nationalOperators = [
    "IndiGo",
    "SpiceJet",
    "Air India",
    "GoAir",
    "AirAsia India",
    "Vistara",
  ];

  // Region-specific operators
  const regionOperators: Record<string, string[]> = {
    // South India
    "Karnataka": ["IndiGo", "SpiceJet", "Air India", "GoAir", "AirAsia India"],
    "Tamil Nadu": ["IndiGo", "SpiceJet", "Air India", "GoAir", "AirAsia India"],
    "Kerala": ["IndiGo", "SpiceJet", "Air India", "GoAir", "AirAsia India"],
    "Andhra Pradesh": ["IndiGo", "SpiceJet", "Air India", "GoAir", "AirAsia India"],
    "Telangana": ["IndiGo", "SpiceJet", "Air India", "GoAir", "AirAsia India"],
    
    // North India
    "Delhi": ["IndiGo", "SpiceJet", "Air India", "GoAir", "AirAsia India", "Vistara"],
    "Uttar Pradesh": ["IndiGo", "SpiceJet", "Air India", "GoAir", "AirAsia India"],
    "Punjab": ["IndiGo", "SpiceJet", "Air India", "GoAir", "AirAsia India"],
    "Rajasthan": ["IndiGo", "SpiceJet", "Air India", "GoAir", "AirAsia India"],
    
    // West India
    "Maharashtra": ["IndiGo", "SpiceJet", "Air India", "GoAir", "AirAsia India", "Vistara"],
    "Gujarat": ["IndiGo", "SpiceJet", "Air India", "GoAir", "AirAsia India"],
    "Goa": ["IndiGo", "SpiceJet", "Air India", "GoAir", "AirAsia India"],
    
    // East India
    "West Bengal": ["IndiGo", "SpiceJet", "Air India", "GoAir", "AirAsia India"],
    "Odisha": ["IndiGo", "SpiceJet", "Air India", "GoAir", "AirAsia India"],
    "Bihar": ["IndiGo", "SpiceJet", "Air India", "GoAir", "AirAsia India"],
    
    // Northeast
    "Assam": ["IndiGo", "SpiceJet", "Air India", "GoAir", "AirAsia India"],
    "Meghalaya": ["IndiGo", "SpiceJet", "Air India", "GoAir", "AirAsia India"],
    
    // Central India
    "Madhya Pradesh": ["IndiGo", "SpiceJet", "Air India", "GoAir", "AirAsia India"],
    "Chhattisgarh": ["IndiGo", "SpiceJet", "Air India", "GoAir", "AirAsia India"],
  };

  // Check if we have specific operators for this region
  const lowerCaseRegion = region.toLowerCase();
  
  // Try to match the region name
  for (const [r, operators] of Object.entries(regionOperators)) {
    if (lowerCaseRegion.includes(r.toLowerCase())) {
      // Return region-specific operators plus some nationals
      return [...operators, ...nationalOperators.slice(0, 3)];
    }
  }

  // For cities, try to map to their state
  const cityToState: Record<string, string> = {
    "mumbai": "Maharashtra",
    "delhi": "Delhi",
    "bangalore": "Karnataka",
    "bengaluru": "Karnataka",
    "hyderabad": "Telangana",
    "chennai": "Tamil Nadu",
    "kolkata": "West Bengal",
    "jaipur": "Rajasthan",
    "pune": "Maharashtra",
    "ahmedabad": "Gujarat",
    "lucknow": "Uttar Pradesh",
    "kochi": "Kerala",
    "goa": "Goa",
    "chandigarh": "Punjab",
    "coimbatore": "Tamil Nadu",
    "indore": "Madhya Pradesh",
    "bhubaneswar": "Odisha",
    "guwahati": "Assam",
  };
  
  for (const [city, state] of Object.entries(cityToState)) {
    if (lowerCaseRegion.includes(city)) {
      const stateOperators = regionOperators[state] || [];
      return [...stateOperators, ...nationalOperators.slice(0, 3)];
    }
  }

  // If no specific region match, return national operators
  return nationalOperators;
};

// Popular Indian train operators
export const getTrainOperators = (region: string): string[] => {
  // Default operators available nationwide
  const nationalOperators = [
    "IRCTC",
  ];

  // Region-specific operators
  const regionOperators: Record<string, string[]> = {
    // South India
    "Karnataka": ["IRCTC", "South Western Railway"],
    "Tamil Nadu": ["IRCTC", "Southern Railway"],
    "Kerala": ["IRCTC", "Southern Railway"],
    "Andhra Pradesh": ["IRCTC", "South Central Railway"],
    "Telangana": ["IRCTC", "South Central Railway"],
    
    // North India
    "Delhi": ["IRCTC", "Northern Railway"],
    "Uttar Pradesh": ["IRCTC", "Northern Railway", "North Eastern Railway"],
    "Punjab": ["IRCTC", "Northern Railway"],
    "Rajasthan": ["IRCTC", "North Western Railway"],
    
    // West India
    "Maharashtra": ["IRCTC", "Central Railway", "Western Railway"],
    "Gujarat": ["IRCTC", "Western Railway"],
    "Goa": ["IRCTC", "Konkan Railway"],
    
    // East India
    "West Bengal": ["IRCTC", "Eastern Railway", "South Eastern Railway"],
    "Odisha": ["IRCTC", "East Coast Railway"],
    "Bihar": ["IRCTC", "East Central Railway"],
    
    // Northeast
    "Assam": ["IRCTC", "Northeast Frontier Railway"],
    "Meghalaya": ["IRCTC", "Northeast Frontier Railway"],
    
    // Central India
    "Madhya Pradesh": ["IRCTC", "West Central Railway"],
    "Chhattisgarh": ["IRCTC", "South East Central Railway"],
  };

  // Check if we have specific operators for this region
  const lowerCaseRegion = region.toLowerCase();
  
  // Try to match the region name
  for (const [r, operators] of Object.entries(regionOperators)) {
    if (lowerCaseRegion.includes(r.toLowerCase())) {
      // Return region-specific operators plus some nationals
      return [...operators, ...nationalOperators.slice(0, 3)];
    }
  }

  // For cities, try to map to their state
  const cityToState: Record<string, string> = {
    "mumbai": "Maharashtra",
    "delhi": "Delhi",
    "bangalore": "Karnataka",
    "bengaluru": "Karnataka",
    "hyderabad": "Telangana",
    "chennai": "Tamil Nadu",
    "kolkata": "West Bengal",
    "jaipur": "Rajasthan",
    "pune": "Maharashtra",
    "ahmedabad": "Gujarat",
    "lucknow": "Uttar Pradesh",
    "kochi": "Kerala",
    "goa": "Goa",
    "chandigarh": "Punjab",
    "coimbatore": "Tamil Nadu",
    "indore": "Madhya Pradesh",
    "bhubaneswar": "Odisha",
    "guwahati": "Assam",
  };
  
  for (const [city, state] of Object.entries(cityToState)) {
    if (lowerCaseRegion.includes(city)) {
      const stateOperators = regionOperators[state] || [];
      return [...stateOperators, ...nationalOperators.slice(0, 3)];
    }
  }

  // If no specific region match, return national operators
  return nationalOperators;
};

// Price comparison for bus operators
export interface BusPriceComparison {
  operatorName: string;
  price: string;
  duration: string;
  amenities: string[];
  rating: number;
  departureTime?: string;
  arrivalTime?: string;
  bookingUrl?: string;
}

// Function to generate realistic bus pricing based on source, destination and distance
export const getBusPriceComparison = (
  source: string,
  destination: string
): BusPriceComparison[] => {
  // Get operators for this region
  const operators = getBusOperators(destination);
  
  // Estimate distance based on major city pairs
  const distance = estimateDistance(source, destination);
  
  // Generate realistic pricing for each operator
  const basePrice = Math.floor(distance * 2.5);
  const durationHours = Math.floor(distance / 60);
  
  const comparisons: BusPriceComparison[] = [
    {
      operatorName: "RedBus",
      price: `₹${basePrice}`,
      duration: `${Math.floor(durationHours)}h ${Math.floor(Math.random() * 59)}m`,
      amenities: ["AC", "WiFi", "Charging Points"],
      rating: 4.5,
      departureTime: "21:30",
      arrivalTime: `${Math.floor(durationHours) + 21 > 24 ? Math.floor(durationHours) + 21 - 24 : Math.floor(durationHours) + 21}:30`,
      bookingUrl: "https://www.redbus.in"
    },
    {
      operatorName: operators[0],
      price: `₹${Math.floor(basePrice * 0.9)}`,
      duration: `${Math.floor(durationHours + 0.5)}h ${Math.floor(Math.random() * 59)}m`,
      amenities: ["AC", "Blanket", "Water Bottle"],
      rating: 4.2,
      departureTime: "22:00",
      arrivalTime: `${Math.floor(durationHours) + 22 > 24 ? Math.floor(durationHours) + 22 - 24 : Math.floor(durationHours) + 22}:00`,
      bookingUrl: busOperatorBookingUrls[operators[0]]?.bookingUrl || "https://www.makemytrip.com/bus-tickets"
    },
    {
      operatorName: operators[1],
      price: `₹${Math.floor(basePrice * 1.1)}`,
      duration: `${Math.floor(durationHours - 0.5)}h ${Math.floor(Math.random() * 59)}m`,
      amenities: ["AC", "Entertainment System", "Snacks"],
      rating: 4.7,
      departureTime: "20:00",
      arrivalTime: `${Math.floor(durationHours) + 20 > 24 ? Math.floor(durationHours) + 20 - 24 : Math.floor(durationHours) + 20}:00`,
      bookingUrl: busOperatorBookingUrls[operators[1]]?.bookingUrl || "https://www.abhibus.com"
    }
  ];
  
  return comparisons;
};

// Helper function to estimate distance between Indian cities
function estimateDistance(source: string, destination: string): number {
  // Normalize inputs
  source = source.toLowerCase().trim();
  destination = destination.toLowerCase().trim();
  
  // Common distances between major Indian cities (in km)
  const cityDistances: Record<string, Record<string, number>> = {
    'mumbai': {
      'delhi': 1400,
      'bangalore': 980,
      'chennai': 1350,
      'kolkata': 2000,
      'hyderabad': 700,
      'pune': 150,
      'jaipur': 1150
    },
    'delhi': {
      'mumbai': 1400,
      'bangalore': 2150,
      'chennai': 2180,
      'kolkata': 1500,
      'hyderabad': 1580,
      'jaipur': 270
    },
    'bangalore': {
      'mumbai': 980,
      'delhi': 2150,
      'chennai': 350,
      'hyderabad': 570,
      'mysore': 140
    },
    'chennai': {
      'mumbai': 1350,
      'delhi': 2180,
      'bangalore': 350,
      'hyderabad': 630,
      'kolkata': 1670
    },
    'kolkata': {
      'mumbai': 2000,
      'delhi': 1500,
      'chennai': 1670,
      'hyderabad': 1500
    },
    'hyderabad': {
      'mumbai': 700,
      'delhi': 1580,
      'bangalore': 570,
      'chennai': 630
    }
  };
  
  // Check if we have exact distance data
  for (const city1 in cityDistances) {
    if (source.includes(city1)) {
      for (const city2 in cityDistances[city1]) {
        if (destination.includes(city2)) {
          return cityDistances[city1][city2];
        }
      }
    }
  }
  
  // If we don't have exact data, estimate based on a default value with some variance
  return 500 + Math.floor(Math.random() * 300);
}

// Train information for Indian destinations
export const getTrainInformation = (region: string): {name: string, number: string, route: string}[] => {
  // Default trains that operate across India
  const nationalTrains = [
    { name: "Rajdhani Express", number: "Various", route: "Connects major cities to Delhi" },
    { name: "Shatabdi Express", number: "Various", route: "Intercity day travel" },
    { name: "Duronto Express", number: "Various", route: "Non-stop service between major cities" },
    { name: "Garib Rath", number: "Various", route: "Economy AC service" },
    { name: "Sampark Kranti Express", number: "Various", route: "Connects states to Delhi" },
  ];

  // Region-specific popular trains
  const regionTrains: Record<string, Array<{name: string, number: string, route: string}>> = {
    // Delhi and North
    "Delhi": [
      { name: "New Delhi - Mumbai Rajdhani Express", number: "12951/12952", route: "New Delhi to Mumbai" },
      { name: "New Delhi - Howrah Rajdhani Express", number: "12301/12302", route: "New Delhi to Kolkata" },
      { name: "New Delhi - Chennai Rajdhani Express", number: "12433/12434", route: "New Delhi to Chennai" },
      { name: "Shatabdi Express", number: "12005/12006", route: "New Delhi to Kalka" },
    ],
    
    // Mumbai and Maharashtra
    "Mumbai": [
      { name: "Mumbai - Ahmedabad Shatabdi Express", number: "12009/12010", route: "Mumbai to Ahmedabad" },
      { name: "Mumbai - Pune Intercity Express", number: "12123/12124", route: "Mumbai to Pune" },
      { name: "Deccan Express", number: "12123/12124", route: "Mumbai to Pune" },
      { name: "Mumbai - Howrah Mail", number: "12809/12810", route: "Mumbai to Kolkata" },
    ],
    
    // Bangalore and Karnataka
    "Bangalore": [
      { name: "Bengaluru - Chennai Shatabdi Express", number: "12027/12028", route: "Bengaluru to Chennai" },
      { name: "Bengaluru - Mysuru Shatabdi Express", number: "12007/12008", route: "Bengaluru to Mysuru" },
      { name: "Bengaluru - Hubballi Jan Shatabdi Express", number: "12079/12080", route: "Bengaluru to Hubballi" },
      { name: "Bengaluru - Kacheguda Express", number: "12785/12786", route: "Bengaluru to Hyderabad" },
    ],
    
    // Chennai and Tamil Nadu
    "Chennai": [
      { name: "Chennai - Coimbatore Shatabdi Express", number: "12243/12244", route: "Chennai to Coimbatore" },
      { name: "Chennai - Mysuru Shatabdi Express", number: "12007/12008", route: "Chennai to Mysuru" },
      { name: "Chennai - Bengaluru Shatabdi Express", number: "12027/12028", route: "Chennai to Bengaluru" },
      { name: "Tamil Nadu Express", number: "12621/12622", route: "Chennai to New Delhi" },
    ],
    
    // Kolkata and East
    "Kolkata": [
      { name: "Howrah - New Delhi Rajdhani Express", number: "12301/12302", route: "Kolkata to New Delhi" },
      { name: "Howrah - Mumbai Mail", number: "12809/12810", route: "Kolkata to Mumbai" },
      { name: "Howrah - Chennai Mail", number: "12839/12840", route: "Kolkata to Chennai" },
      { name: "Howrah - Digha AC Express", number: "12847/12848", route: "Kolkata to Digha" },
    ],
    
    // Hyderabad and Telangana
    "Hyderabad": [
      { name: "Hyderabad - Bengaluru Express", number: "12785/12786", route: "Hyderabad to Bengaluru" },
      { name: "Telangana Express", number: "12723/12724", route: "Hyderabad to New Delhi" },
      { name: "Hyderabad - Tirupati Express", number: "12733/12734", route: "Hyderabad to Tirupati" },
      { name: "Godavari Express", number: "12727/12728", route: "Hyderabad to Visakhapatnam" },
    ],
    
    // Kerala
    "Kerala": [
      { name: "Kerala Express", number: "12625/12626", route: "Thiruvananthapuram to New Delhi" },
      { name: "Mangala Lakshadweep Express", number: "12617/12618", route: "Ernakulam to New Delhi" },
      { name: "Malabar Express", number: "16629/16630", route: "Mangaluru to Thiruvananthapuram" },
      { name: "Venad Express", number: "16301/16302", route: "Thiruvananthapuram to Shoranur" },
    ],
    
    // Goa
    "Goa": [
      { name: "Goa Express", number: "12779/12780", route: "Vasco da Gama to New Delhi" },
      { name: "Mandovi Express", number: "10103/10104", route: "Madgaon to Mumbai" },
      { name: "Konkan Kanya Express", number: "10111/10112", route: "Madgaon to Mumbai" },
      { name: "Vasco-Patna Express", number: "17317/17318", route: "Vasco to Patna" },
    ],
  };

  // Check if we have specific trains for this region
  const lowerCaseRegion = region.toLowerCase();
  
  // Try to match the region name
  for (const [r, trains] of Object.entries(regionTrains)) {
    if (lowerCaseRegion.includes(r.toLowerCase())) {
      // Return region-specific trains plus some nationals
      return [...trains, ...nationalTrains.slice(0, 2)];
    }
  }

  // Map cities to larger regions
  const cityToRegion: Record<string, string> = {
    "bengaluru": "Bangalore",
    "mumbai": "Mumbai",
    "delhi": "Delhi",
    "new delhi": "Delhi",
    "chennai": "Chennai",
    "kolkata": "Kolkata",
    "hyderabad": "Hyderabad",
    "kochi": "Kerala",
    "trivandrum": "Kerala",
    "thiruvananthapuram": "Kerala",
    "ernakulam": "Kerala",
    "vasco": "Goa",
    "madgaon": "Goa",
    "panaji": "Goa",
  };
  
  for (const [city, mappedRegion] of Object.entries(cityToRegion)) {
    if (lowerCaseRegion.includes(city)) {
      const regionSpecificTrains = regionTrains[mappedRegion] || [];
      return [...regionSpecificTrains, ...nationalTrains.slice(0, 2)];
    }
  }

  // If no specific region match, return national trains
  return nationalTrains;
};
