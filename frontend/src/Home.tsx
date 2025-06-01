import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-gray-900 text-white flex flex-col items-center justify-center p-8">
      <section className="text-center max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
          Welcome to <span className="text-yellow-400">MindRender</span>
        </h1>
        <p className="text-lg md:text-xl mb-8 text-gray-300">
          An AI-powered simulation engine that transforms natural language into live, interactive simulations—designed for learning, discovery, and exploration.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button className="bg-yellow-500 text-black hover:bg-yellow-400 px-6 py-3 rounded-2xl text-lg font-semibold shadow-md">
            Try a Demo <Sparkles className="inline ml-2 w-5 h-5" />
          </Button>
          <Button variant="outline" className="border-white text-white px-6 py-3 rounded-2xl text-lg font-semibold hover:bg-white hover:text-black">
            Learn More
          </Button>
        </div>
      </section>
    </main>
  );
}