"use client";

import { useState, useEffect } from "react";
import { FaPlane, FaTrain, FaBus, FaStar, FaRegStar, FaStarHalfAlt, FaArrowRight, FaClock } from "react-icons/fa";
import { getBusOperators, getTrainInformation, getBusPriceComparison, BusPriceComparison, getBookingUrl } from "@/lib/transportData";

interface TravelOption {
  type: string;
  provider: string;
  price: string;
  duration: string;
  departureTime: string;
  arrivalTime: string;
  details: string;
  hasRealInfo?: boolean;
  bookingUrl: string;
}

interface TravelOptionsProps {
  options: {
    flights: TravelOption[];
    trains: TravelOption[];
    buses: TravelOption[];
  };
  destination: string;
}

const TravelOptions = ({ options, destination }: TravelOptionsProps) => {
  const [activeTab, setActiveTab] = useState<"flights" | "trains" | "buses">("flights");

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "flights":
        return <FaPlane />;
      case "trains":
        return <FaTrain />;
      case "buses":
        return <FaBus />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className="flex border-b mb-4">
        {["flights", "trains", "buses"].map((tab) => (
          <button
            key={tab}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab(tab as "flights" | "trains" | "buses")}
          >
            {getTabIcon(tab)}
            <span className="capitalize">{tab}</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        {activeTab === "flights" && (
          <OptionList options={options.flights} type="Flight" />
        )}
        {activeTab === "trains" && (
          <OptionList options={options.trains} type="Train" destination={destination} />
        )}
        {activeTab === "buses" && (
          <OptionList options={options.buses} type="Bus" destination={destination} />
        )}
      </div>
    </div>
  );
};

const OptionList = ({ options, type, destination = "" }: { options: TravelOption[], type: string, destination?: string }) => {
  const [enhancedOptions, setEnhancedOptions] = useState<TravelOption[]>(options);
  const [showRealOperators, setShowRealOperators] = useState<boolean>(false);
  const [busComparisons, setBusComparisons] = useState<BusPriceComparison[]>([]);
  const [showPriceComparison, setShowPriceComparison] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<string>("India");
  
  // Get user location from localStorage or use default
  useEffect(() => {
    // Try to get location from the DOM data attribute
    const locationElement = document.getElementById('user-location-data');
    if (locationElement && locationElement.dataset.location) {
      setUserLocation(locationElement.dataset.location);
    } else {
      // Try to get from localStorage as fallback
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        setUserLocation(savedLocation);
      }
    }
  }, []);
  
  useEffect(() => {
    if (type.toLowerCase() === "bus" && options.length > 0) {
      // Enable the option to show real bus operators
      setShowRealOperators(true);
      
      // Generate bus price comparisons if we have user location and destination
      if (userLocation && destination) {
        const comparisons = getBusPriceComparison(userLocation, destination);
        setBusComparisons(comparisons);
      }
    } else if (type.toLowerCase() === "train" && options.length > 0) {
      // For trains, we'll enhance the existing options
      const enhancedTrains = options.map(option => ({
        ...option,
        hasRealInfo: true // Flag to show we have additional info
      }));
      setEnhancedOptions(enhancedTrains);
    } else {
      setEnhancedOptions(options);
    }
  }, [options, type, userLocation, destination]);
  
  // Function to display real bus operators for the destination region
  const displayRealBusOperators = () => {
    if (type.toLowerCase() !== "bus") return null;
    
    const operators = getBusOperators(destination);
    
    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold mb-2">Popular Bus Operators in this Region:</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {operators.map((operator, index) => (
            <div key={index} className="bg-white p-2 rounded shadow-sm flex items-center justify-between">
              <span>{operator}</span>
              <a 
                href={getBookingUrl(operator, userLocation, destination)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Visit
              </a>
            </div>
          ))}
        </div>
        
        {userLocation && destination && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowPriceComparison(!showPriceComparison)}
              className="btn btn-primary text-sm"
            >
              {showPriceComparison ? "Hide Price Comparison" : "Compare Prices"}
            </button>
          </div>
        )}
      </div>
    );
  };
  
  // Function to render star ratings
  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-500" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-500" />);
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-500" />);
    }
    
    return (
      <div className="flex items-center">
        {stars} <span className="ml-1 text-sm">({rating})</span>
      </div>
    );
  };
  
  // Function to display bus price comparison
  const displayBusPriceComparison = () => {
    if (!showPriceComparison || busComparisons.length === 0) return null;
    
    return (
      <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
        <h4 className="font-semibold mb-3 text-center">Price Comparison from {userLocation} to {destination}</h4>
        
        <div className="space-y-4">
          {busComparisons.map((comp, index) => (
            <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h5 className="font-medium">{comp.operatorName}</h5>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <FaClock className="mr-1 text-xs" /> 
                    <span>{comp.departureTime} → {comp.arrivalTime}</span>
                    <span className="mx-2">·</span>
                    <span>Duration: {comp.duration}</span>
                  </div>
                  <div className="flex flex-wrap text-xs text-gray-500 mt-1">
                    {comp.amenities.map((amenity, i) => (
                      <span key={i} className="mr-2 mb-1 bg-gray-100 px-2 py-1 rounded-full">
                        {amenity}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2">
                    {renderRating(comp.rating)}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-primary">{comp.price}</div>
                  <a 
                    href={comp.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 btn btn-primary text-xs inline-flex items-center"
                    onClick={() => {
                      // Track the booking attempt in analytics
                      console.log(`Booking with ${comp.operatorName} from ${userLocation} to ${destination}`);
                    }}
                  >
                    Book Now <FaArrowRight className="ml-1" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>* Prices and schedules are estimates and may vary. Click "Book Now" to visit the operator's website with your travel details pre-filled.</p>
        </div>
      </div>
    );
  };
  
  // Function to display real train information for the destination
  const displayTrainInformation = (option: TravelOption) => {
    if (type.toLowerCase() !== "train") return null;
    
    const trains = getTrainInformation(destination);
    const randomTrain = trains[Math.floor(Math.random() * trains.length)];
    
    return (
      <div className="mt-2 text-sm text-gray-700 border-t pt-2">
        <div className="font-semibold">{randomTrain.name}</div>
        <div>Train Number: {randomTrain.number}</div>
        <div>Route: {randomTrain.route}</div>
      </div>
    );
  };

  if (!options || options.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-md">
        <p>No {type.toLowerCase()} options available for this destination.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {enhancedOptions.map((option, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{option.provider}</h3>
              <div className="mt-1 text-sm text-gray-600">
                {option.departureTime} - {option.arrivalTime} ({option.duration})
              </div>
              {option.hasRealInfo && type.toLowerCase() === "train" && 
                displayTrainInformation(option)
              }
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">{option.price}</div>
              <a 
                href={option.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 btn btn-primary text-sm inline-flex items-center"
                onClick={() => {
                  // Track the booking attempt in analytics
                  console.log(`Booking with ${option.provider} from ${userLocation} to ${destination}`);
                }}
              >
                Book Ticket <FaArrowRight className="ml-1" />
              </a>
            </div>
          </div>
        </div>
      ))}
      
      {showRealOperators && displayRealBusOperators()}
      {displayBusPriceComparison()}
    </div>
  );
};

export default TravelOptions;
