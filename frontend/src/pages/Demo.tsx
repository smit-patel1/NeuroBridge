import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Demo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-gray-900">
      <div className="container mx-auto px-4">
        <Link to="/" className="inline-block pt-6">
          <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        
        <div className="flex flex-col lg:flex-row gap-6 py-8">
          {/* Chat Input Section */}
          <div className="w-full lg:w-1/3 bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Describe Your Simulation</h2>
            <div className="bg-gray-700 rounded-lg p-4 h-[calc(100vh-250px)]">
              <p className="text-gray-400">Chat interface coming soon...</p>
            </div>
          </div>
          
          {/* Visualization Section */}
          <div className="w-full lg:w-2/3 bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Visualization</h2>
            <div className="bg-gray-700 rounded-lg p-4 h-[calc(100vh-250px)]">
              <p className="text-gray-400">Visualization will appear here...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}