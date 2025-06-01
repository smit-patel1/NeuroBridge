import React from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-blue-950 to-gray-900 text-white flex flex-col items-center justify-center p-8"
    >
      <div className="text-center max-w-4xl">
        <motion.h1 
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight"
        >
          Welcome to <span className="text-yellow-400">MindRender</span>
        </motion.h1>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl mb-12 text-gray-300"
        >
          Transform natural language into live, interactive simulations for learning and discovery.
        </motion.p>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button className="bg-yellow-500 text-black hover:bg-yellow-400 px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg">
            Try a Demo <Sparkles className="inline ml-2 w-5 h-5" />
          </Button>
          <Button variant="outline" className="border-2 border-white text-white px-8 py-6 rounded-2xl text-lg font-semibold hover:bg-white hover:text-black">
            Learn More
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
}