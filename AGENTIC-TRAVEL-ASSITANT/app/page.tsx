"use client";

import { useState, useEffect } from "react";
import { FaPlane, FaHotel, FaMapMarkerAlt, FaSearch } from "react-icons/fa";
import TravelPlanner from "@/components/TravelPlanner";
import Header from "@/components/Header";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-[90vh] gap-6">
      <Header />
      <div className="flex flex-col items-center justify-center flex-1">
        <div className="w-full max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-dark mb-4">
              Plan Your Next Adventure with AI
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI travel planner helps you discover the best transportation options, 
              accommodations, and attractions for your dream destination.
            </p>
          </div>
          
          <TravelPlanner />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="card flex flex-col items-center text-center p-6">
      <div className="mb-4 p-3 bg-gray-50 rounded-full">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
