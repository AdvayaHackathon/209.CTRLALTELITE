"use client";

import { useState } from "react";
import { FaHotel, FaHome, FaBed } from "react-icons/fa";

interface LodgingOption {
  name: string;
  type: string;
  price: string;
  rating: number;
  location: string;
  amenities: string[];
  image?: string;
}

interface LodgingOptionsProps {
  options: {
    hotels: LodgingOption[];
    apartments: LodgingOption[];
    hostels: LodgingOption[];
  };
}

const LodgingOptions = ({ options }: LodgingOptionsProps) => {
  const [activeTab, setActiveTab] = useState<"hotels" | "apartments" | "hostels">("hotels");

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "hotels":
        return <FaHotel />;
      case "apartments":
        return <FaHome />;
      case "hostels":
        return <FaBed />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className="flex border-b mb-4">
        {["hotels", "apartments", "hostels"].map((tab) => (
          <button
            key={tab}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab
                ? "border-secondary text-secondary"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab(tab as "hotels" | "apartments" | "hostels")}
          >
            {getTabIcon(tab)}
            <span className="capitalize">{tab}</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        {activeTab === "hotels" && (
          <LodgingList options={options.hotels} />
        )}
        {activeTab === "apartments" && (
          <LodgingList options={options.apartments} />
        )}
        {activeTab === "hostels" && (
          <LodgingList options={options.hostels} />
        )}
      </div>
    </div>
  );
};

const LodgingList = ({ options }: { options: LodgingOption[] }) => {
  if (!options || options.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-md">
        <p>No lodging options available for this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {options.map((option, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="h-40 bg-gray-200 relative">
            {option.image ? (
              <img 
                src={option.image} 
                alt={option.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <FaHotel size={48} />
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{option.name}</h3>
                <p className="text-sm text-gray-600">{option.location}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-secondary">{option.price}</div>
                <div className="text-sm text-gray-600">per night</div>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < option.rating ? "text-yellow-400" : "text-gray-300"}>★</span>
                ))}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {option.amenities.slice(0, 3).map((amenity, i) => (
                <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  {amenity}
                </span>
              ))}
              {option.amenities.length > 3 && (
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  +{option.amenities.length - 3} more
                </span>
              )}
            </div>
            <button className="mt-3 w-full btn btn-secondary text-sm">View Details</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LodgingOptions;
