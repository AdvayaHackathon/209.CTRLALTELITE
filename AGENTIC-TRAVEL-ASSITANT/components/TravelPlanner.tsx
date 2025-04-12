"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaSearch, FaPlane, FaHotel, FaMapMarkerAlt, FaLocationArrow, FaGift, FaPalette, FaGraduationCap } from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import TravelOptions from "@/components/TravelOptions";
import LodgingOptions from "@/components/LodgingOptions";
import AttractionOptions from "@/components/AttractionOptions";
import LocalArtifacts from "@/components/LocalArtifacts";
import LocalArtists from "@/components/LocalArtists";
import EducationalSites from "@/components/EducationalSites";
import VirtualLocation from "@/components/VirtualLocation";
import { useStore } from "@/lib/store";

const TravelPlanner = () => {
  const [destination, setDestination] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState("");
  const [showOptions, setShowOptions] = useState<string | null>(null);
  
  // Get travel data from the store
  const {
    travelData,
    isGenerating,
    setTravelData,
    setIsGenerating,
    generateTravelData
  } = useStore();

  const router = useRouter();

  // Get user's location on component mount and when window is focused
  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        setLocationError(null);
        setUserLocation(null); // Reset while fetching new location
        
        // Clear any cached position by using maximum age of 0 and forcing high accuracy
        const geoOptions = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // Force fresh location every time
        };
        
        // Show a loading message while getting location
        setUserLocation("Detecting your location...");
        
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              // Use reverse geocoding to get city name from coordinates
              const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
              );
              
              if (response.ok) {
                const data = await response.json();
                const locationName = data.city || data.locality || "Unknown location";
                setUserLocation(locationName);
                setManualLocation(locationName); // Sync manual input with detected location
                
                // Store in localStorage for other components to access
                localStorage.setItem('userLocation', locationName);
              } else {
                setUserLocation("India"); // Default fallback
                setManualLocation("India");
                localStorage.setItem('userLocation', "India");
              }
            } catch (error) {
              console.error("Error getting location details:", error);
              setUserLocation("India"); // Default fallback
              setManualLocation("India");
              localStorage.setItem('userLocation', "India");
            }
          },
          (error) => {
            console.error("Error getting user location:", error);
            setLocationError("Location access denied. Using default pricing.");
            setUserLocation("India"); // Default fallback
            setManualLocation("India");
            localStorage.setItem('userLocation', "India");
          },
          geoOptions
        );
      } else {
        setLocationError("Geolocation is not supported by this browser. Using default pricing.");
        setUserLocation("India"); // Default fallback
        setManualLocation("India");
        localStorage.setItem('userLocation', "India");
      }
    };

    // Get location when component mounts
    getUserLocation();
    
    // Set up event listeners to refresh location when window is focused or visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        getUserLocation();
      }
    };
    
    const handleFocus = () => {
      getUserLocation();
    };
    
    // Add a refresh button functionality via a custom event
    const handleRefreshLocation = () => {
      getUserLocation();
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('refreshlocation', handleRefreshLocation);
    
    // Force a refresh on page load by adding a small delay
    // This helps bypass cached permissions in some browsers
    setTimeout(getUserLocation, 500);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('refreshlocation', handleRefreshLocation);
    };
  }, []); // Empty dependency array to run only on mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!destination.trim()) return;
    
    setIsLoading(true);
    setIsGenerating(true);
    
    try {
      // Pass user location to generate more accurate pricing
      await generateTravelData(destination, showManualLocation ? manualLocation : userLocation || "India");
      setIsLoading(false);
    } catch (error) {
      console.error("Error generating travel data:", error);
      setIsLoading(false);
    }
  };

  const toggleOptions = (option: string) => {
    if (showOptions === option) {
      setShowOptions(null);
    } else {
      setShowOptions(option);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-8">
        <div className="relative flex items-center">
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="input pr-12 text-lg"
            placeholder="Where do you want to travel?"
            required
          />
          <button
            type="submit"
            className="absolute right-2 p-2 text-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <ClipLoader size={24} color="#3B82F6" />
            ) : (
              <FaSearch className="text-xl" />
            )}
          </button>
        </div>
        {userLocation && (
          <div className="mt-2 text-sm text-gray-600 flex items-center justify-between">
            <div className="flex items-center">
              <FaMapMarkerAlt className="text-red-500 mr-2" />
              <span className="text-gray-600">
                Planning from: {showManualLocation ? manualLocation : userLocation}
                {locationError && <span className="ml-1 text-amber-600"> ({locationError})</span>}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                type="button"
                onClick={() => setShowManualLocation(!showManualLocation)}
                className="text-blue-500 hover:text-blue-700 text-xs flex items-center"
              >
                {showManualLocation ? "Use Detected" : "Enter Manually"}
              </button>
              <button 
                type="button"
                onClick={() => {
                  // Clear any cached location data
                  localStorage.removeItem('userLocation');
                  // Dispatch custom event to trigger location refresh
                  document.dispatchEvent(new Event('refreshlocation'));
                  setShowManualLocation(false);
                }}
                className="text-blue-500 hover:text-blue-700 text-xs flex items-center"
              >
                <FaLocationArrow className="mr-1" />
                Refresh Location
              </button>
            </div>
          </div>
        )}
        
        {/* Manual location input field */}
        {showManualLocation && (
          <div className="mt-2">
            <div className="flex items-center">
              <input
                type="text"
                value={manualLocation}
                onChange={(e) => {
                  setManualLocation(e.target.value);
                  // Update localStorage and data attribute for other components
                  if (e.target.value.trim()) {
                    localStorage.setItem('userLocation', e.target.value);
                    // Update the hidden data element
                    const locationElement = document.getElementById('user-location-data');
                    if (locationElement) {
                      locationElement.setAttribute('data-location', e.target.value);
                    }
                  }
                }}
                placeholder="Enter your location"
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  if (manualLocation.trim()) {
                    setUserLocation(manualLocation);
                    localStorage.setItem('userLocation', manualLocation);
                    // Update the hidden data element
                    const locationElement = document.getElementById('user-location-data');
                    if (locationElement) {
                      locationElement.setAttribute('data-location', manualLocation);
                    }
                  }
                }}
                className="ml-2 bg-blue-500 text-white px-2 py-1 rounded text-xs"
              >
                Use
              </button>
            </div>
          </div>
        )}
        
        {/* Hidden element to share location with child components */}
        <div id="user-location-data" data-location={showManualLocation ? manualLocation : userLocation} className="hidden"></div>
      </form>

      {/* Only show chatbot initially */}
      {!travelData && !isGenerating && (
        <div className="mt-8 p-6 bg-blue-50 rounded-lg shadow-sm">
          <p className="text-center text-gray-700">
            Welcome to the AI Travel Planner! Enter a destination above to get detailed travel information.
          </p>
        </div>
      )}
      
      {/* Show travel options only after destination is entered */}
      {travelData && !isGenerating && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-2 text-center">
            Your Travel Plan for {travelData.destination}
          </h2>
          
          {/* Display destination description */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
            <p className="text-gray-700">{travelData.description}</p>
          </div>
          
          {/* Virtual location QR code */}
          <VirtualLocation destination={travelData.destination} />
          
          <div className="grid grid-cols-1 gap-4">
            <OptionCard
              icon={<FaPlane />}
              title="Travel Options"
              description="Discover the best ways to reach your destination"
              onClick={() => toggleOptions("travel")}
              isExpanded={showOptions === "travel"}
            >
              {showOptions === "travel" && <TravelOptions options={travelData.travelOptions} destination={travelData.destination} />}
            </OptionCard>
            
            <OptionCard
              icon={<FaHotel />}
              title="Lodging Choices"
              description="Find comfortable places to stay during your trip"
              onClick={() => toggleOptions("lodging")}
              isExpanded={showOptions === "lodging"}
            >
              {showOptions === "lodging" && <LodgingOptions options={travelData.lodgingOptions} />}
            </OptionCard>
            
            <OptionCard
              icon={<FaMapMarkerAlt />}
              title="Local Attractions"
              description="Explore popular sights and activities"
              onClick={() => toggleOptions("attractions")}
              isExpanded={showOptions === "attractions"}
            >
              {showOptions === "attractions" && <AttractionOptions options={travelData.attractions} />}
            </OptionCard>
            
            <OptionCard
              icon={<FaGift />}
              title="Local Artifacts & Sweets"
              description="Discover local crafts and sweet treats"
              onClick={() => toggleOptions("artifacts")}
              isExpanded={showOptions === "artifacts"}
            >
              {showOptions === "artifacts" && <LocalArtifacts artifacts={travelData.localArtifacts || []} />}
            </OptionCard>
            
            <OptionCard
              icon={<FaPalette />}
              title="Local Artists to Connect With"
              description="Meet authentic local artisans and creators"
              onClick={() => toggleOptions("artists")}
              isExpanded={showOptions === "artists"}
            >
              {showOptions === "artists" && <LocalArtists artists={travelData.localArtists || []} />}
            </OptionCard>
            
            <OptionCard
              icon={<FaGraduationCap />}
              title="Educational Sites"
              description="Learn about local educational institutions and resources"
              onClick={() => toggleOptions("educational")}
              isExpanded={showOptions === "educational"}
            >
              {showOptions === "educational" && <EducationalSites sites={travelData.nearbyEducationalSites || []} />}
            </OptionCard>
          </div>
        </div>
      )}
    </div>
  );
};

interface OptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  isExpanded: boolean;
  children?: React.ReactNode;
}

const OptionCard = ({
  icon,
  title,
  description,
  onClick,
  isExpanded,
  children,
}: OptionCardProps) => {
  return (
    <div className="card transition-all duration-300">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gray-50 rounded-full">{icon}</div>
          <div>
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="text-gray-600">{description}</p>
          </div>
        </div>
        <button className="text-primary">
          {isExpanded ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </button>
      </div>
      {isExpanded && <div className="mt-6">{children}</div>}
    </div>
  );
};

export default TravelPlanner;
