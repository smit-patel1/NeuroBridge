import React from 'react';
import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-white font-bold text-xl">
            MindRender
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-gray-300 hover:text-white">
              Home
            </Link>
            <Link to="/demo" className="text-gray-300 hover:text-white">
              Try Demo
            </Link>
            <Link to="/learn" className="text-gray-300 hover:text-white">
              Learn More
            </Link>
            <a
              href="https://github.com/smit-patel1/MindRender"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white"
            >
              <Github className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}