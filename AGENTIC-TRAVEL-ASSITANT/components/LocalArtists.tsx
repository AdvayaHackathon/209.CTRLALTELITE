import React from 'react';
import { FaPalette, FaMapMarkerAlt, FaInstagram, FaPhone } from 'react-icons/fa';

interface LocalArtist {
  name: string;
  specialty: string;
  location: string;
  contact: string;
  description?: string;
}

interface LocalArtistsProps {
  artists: LocalArtist[];
}

const LocalArtists: React.FC<LocalArtistsProps> = ({ artists }) => {
  if (!artists || artists.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-center">No local artist information available.</p>
      </div>
    );
  }

  // Check if the data might be limited or generic
  const isLimitedInfo = artists.some(artist => 
    artist.name.includes('Local') || // Generic names like "Local Artist"
    artist.contact === 'N/A' || // No contact info
    artist.location.includes('Studio') || // Generic locations
    (artist.description && artist.description.includes('known for')) // Generic descriptions
  );

  const getContactIcon = (contact: string) => {
    if (contact.includes('@') || contact.toLowerCase().includes('instagram')) {
      return <FaInstagram className="mr-2 text-pink-500" />;
    }
    return <FaPhone className="mr-2 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      {isLimitedInfo && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
          <p className="text-sm">
            Information is limited online. Please check with local residents or marketplaces for more details.
          </p>
        </div>
      )}
      
      {artists.map((artist, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
          <h3 className="text-xl font-bold mb-2">{artist.name}</h3>
          
          <div className="flex items-center mb-2">
            <FaPalette className="mr-2 text-amber-500" />
            <p className="text-gray-700 font-medium">{artist.specialty}</p>
          </div>
          
          <div className="flex items-center mb-3">
            <FaMapMarkerAlt className="mr-2 text-red-500" />
            <p className="text-gray-700">{artist.location}</p>
          </div>
          
          {artist.contact && artist.contact !== "N/A" && (
            <div className="flex items-center mt-2 text-gray-700">
              {getContactIcon(artist.contact)}
              <p>{artist.contact}</p>
            </div>
          )}
          
          {artist.description && (
            <p className="text-gray-700 mt-2">{artist.description}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default LocalArtists;
