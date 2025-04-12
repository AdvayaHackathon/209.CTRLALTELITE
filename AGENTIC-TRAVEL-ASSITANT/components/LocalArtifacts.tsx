import React from 'react';
import { FaShoppingBag, FaPhone } from 'react-icons/fa';

interface Shop {
  name: string;
  address: string;
  contact?: string;
}

interface LocalArtifact {
  name: string;
  description: string;
  shops: Shop[];
}

interface LocalArtifactsProps {
  artifacts: LocalArtifact[];
}

const LocalArtifacts: React.FC<LocalArtifactsProps> = ({ artifacts }) => {
  if (!artifacts || artifacts.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-center">No artifact information available.</p>
      </div>
    );
  }

  // Check if the data might be limited (generic or placeholders)
  const isLimitedInfo = artifacts.some(artifact => 
    artifact.name.includes('Local') || // Generic names like "Local Sweet"
    artifact.description.includes('traditional') || // Generic descriptions
    artifact.shops.some(shop => 
      shop.name.includes('Local') || // Generic shop names
      shop.contact === 'N/A' || // No contact info
      shop.address.includes('Market') // Generic addresses
    )
  );

  return (
    <div className="space-y-6">
      <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
        <p className="text-sm font-bold bg-yellow-100 p-2 rounded">
          <strong>Information is limited online. Please check with local residents or marketplaces for more details.</strong>
        </p>
      </div>
      
      {artifacts.map((artifact, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
          <h3 className="text-xl font-bold mb-2">{artifact.name}</h3>
          <p className="text-gray-700 mb-4">{artifact.description}</p>
          
          <h4 className="text-md font-semibold mb-2 flex items-center">
            <FaShoppingBag className="mr-2 text-indigo-500" />
            Where to Buy
          </h4>
          
          <div className="space-y-3">
            {artifact.shops.map((shop, shopIndex) => (
              <div key={shopIndex} className="bg-gray-50 p-3 rounded">
                <p className="font-medium">{shop.name}</p>
                <p className="text-gray-600 text-sm">{shop.address}</p>
                {shop.contact && shop.contact !== "N/A" && (
                  <p className="text-gray-600 text-sm flex items-center mt-1">
                    <FaPhone className="mr-1 text-xs" />
                    {shop.contact}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LocalArtifacts;
