import React from 'react';
import { Link } from 'react-router-dom';
import { Github, LogIn } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed w-full bg-gray-900/90 backdrop-blur-sm z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-white">
            MindRender
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/demo" className="text-gray-300 hover:text-white transition-colors">
              Try Demo
            </Link>
            <Link to="/learn" className="text-gray-300 hover:text-white transition-colors">
              Learn More
            </Link>
            <a
              href="https://github.com/smit-patel1/MindRender"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <Link 
              to="/auth" 
              className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors flex items-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}