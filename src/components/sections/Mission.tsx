import React from 'react';
import { motion } from 'framer-motion';

export default function Mission() {
  return (
    <section className="bg-white py-24 px-8">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto text-center"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900">Our Mission</h2>
        <p className="text-xl text-gray-700 leading-relaxed">
          At MindRender, we're democratizing learning by making complex concepts instantly accessible through AI-powered visualizations. Our platform bridges the gap between abstract ideas and tangible understanding, enabling students, educators, and curious minds to explore and grasp challenging subjects through interactive simulations generated in real-time from simple natural language descriptions.
        </p>
      </motion.div>
    </section>
  );
}