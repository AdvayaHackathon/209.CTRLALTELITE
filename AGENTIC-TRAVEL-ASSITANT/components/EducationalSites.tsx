import React from 'react';
import { FaGraduationCap, FaMapMarkerAlt, FaGlobe } from 'react-icons/fa';

interface EducationalSite {
  name: string;
  type: string;
  description: string;
  visitorInfo?: string;
  address: string;
  website?: string;
}

interface EducationalSitesProps {
  sites: EducationalSite[];
}

const EducationalSites: React.FC<EducationalSitesProps> = ({ sites }) => {
  if (!sites || sites.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-center">No educational sites information available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sites.map((site, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2 flex items-center">
                <FaGraduationCap className="mr-2 text-blue-600" />
                {site.name}
              </h3>
              <div className="text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded inline-block mb-2">
                {site.type}
              </div>
              
              <p className="text-gray-700 mb-3">{site.description}</p>
              
              {site.visitorInfo && (
                <div className="mb-2 text-sm bg-green-50 p-2 rounded">
                  <span className="font-semibold">Visitor Information:</span> {site.visitorInfo}
                </div>
              )}
              
              <div className="flex items-center mt-2 text-sm text-gray-600">
                <FaMapMarkerAlt className="mr-2 text-red-500" />
                <p>{site.address}</p>
              </div>
            </div>
          </div>
          
          {site.website && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <a 
                href={site.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
              >
                <FaGlobe className="mr-2" /> 
                Visit Official Website
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EducationalSites;
