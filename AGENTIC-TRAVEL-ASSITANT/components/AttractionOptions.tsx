"use client";

import { FaMapMarkerAlt, FaStar, FaExternalLinkAlt } from "react-icons/fa";

interface Attraction {
  name: string;
  type: string;
  description: string;
  rating: number;
  price: string;
  location: string;
  openingHours?: string;
  image?: string;
}

interface AttractionOptionsProps {
  options: Attraction[];
}

const AttractionOptions = ({ options }: AttractionOptionsProps) => {
  if (!options || options.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-md">
        <p>No attractions available for this destination.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {options.map((attraction, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow flex flex-col md:flex-row"
        >
          <div className="md:w-1/3 h-48 md:h-auto bg-gray-200 relative">
            {attraction.image ? (
              <img 
                src={attraction.image} 
                alt={attraction.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <FaMapMarkerAlt size={48} />
              </div>
            )}
          </div>
          <div className="p-5 md:w-2/3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-xl">{attraction.name}</h3>
                <div className="flex gap-1 items-center text-sm text-gray-600 mt-1">
                  <FaMapMarkerAlt size={14} />
                  <span>{attraction.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-yellow-400">
                <FaStar size={14} />
                {/* <span>{attraction.rating.toFixed(1)}</span> */}
              </div>
            </div>
            
            <div className="mt-2">
              <span className="bg-accent/10 text-accent px-2 py-1 rounded text-xs font-medium">
                {attraction.type}
              </span>
              {attraction.price && (
                <span className="ml-2 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                  {attraction.price}
                </span>
              )}
            </div>
            
            <p className="mt-3 text-gray-700">{attraction.description}</p>
            
            {attraction.openingHours && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Opening Hours:</span> {attraction.openingHours}
              </div>
            )}
            
            <div className="mt-4 flex justify-end">
              <button className="flex items-center gap-1 text-accent hover:text-accent/80 transition-colors">
                <span>Visit Website</span>
                <FaExternalLinkAlt size={12} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AttractionOptions;
