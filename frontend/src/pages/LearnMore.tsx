import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Github } from "lucide-react";

export default function LearnMore() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="inline-block">
            <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <a
            href="https://github.com/smit-patel1/MindRender"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black">
              <Github className="w-4 h-4 mr-2" />
              View on GitHub
            </Button>
          </a>
        </div>
        
        <div className="max-w-4xl mx-auto mt-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">About MindRender</h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">What is MindRender?</h2>
              <p className="text-gray-300 leading-relaxed">
                MindRender is an innovative AI-powered simulation engine that transforms natural language descriptions into interactive, real-time visualizations. Our platform bridges the gap between abstract concepts and tangible understanding, making complex topics accessible to everyone.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">How Does It Work?</h2>
              <p className="text-gray-300 leading-relaxed">
                Simply describe what you want to visualize in plain English, and our AI engine converts your description into interactive simulations. Whether you're studying binary search algorithms or cellular biology, MindRender creates engaging, dynamic visualizations that respond to your input in real-time.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Natural language processing for intuitive interaction</li>
                <li>Real-time visualization generation</li>
                <li>Interactive simulations for hands-on learning</li>
                <li>Support for multiple domains (Computer Science, Biology, Mathematics)</li>
                <li>Customizable parameters and controls</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Ready to experience the future of learning? Try our demo to see how MindRender can transform your understanding of complex concepts.
              </p>
              <Link to="/demo">
                <Button className="bg-yellow-500 text-black hover:bg-yellow-400 px-6 py-3 rounded-xl text-lg font-semibold">
                  Try the Demo
                </Button>
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}