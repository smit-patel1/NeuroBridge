import React from 'react';
import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div>
            <h3 className="text-2xl font-bold mb-4">MindRender</h3>
            <p className="text-gray-400">Transform your ideas into interactive simulations.</p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/demo" className="text-gray-400 hover:text-white">
                  Try Demo
                </Link>
              </li>
              <li>
                <Link to="/learn" className="text-gray-400 hover:text-white">
                  Learn More
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">GitHub</h4>
            <a
              href="https://github.com/smit-patel1/MindRender"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white inline-flex items-center"
            >
              <Github className="w-6 h-6 mr-2" />
              <span>View Source</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}