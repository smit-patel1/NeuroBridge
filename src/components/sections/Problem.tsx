import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Lightbulb, Zap } from 'lucide-react';

export default function Problem() {
  return (
    <section className="bg-gray-50 py-24 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-8 text-gray-900">Why MindRender?</h2>
            <p className="text-xl text-gray-700 leading-relaxed mb-6">
              Traditional educational tools often fall short in providing dynamic, interactive learning experiences. Static textbooks and pre-recorded videos can't adapt to individual learning needs or demonstrate complex concepts in real-time.
            </p>
            <p className="text-xl text-gray-700 leading-relaxed">
              MindRender bridges this gap by offering instant, interactive simulations that respond to your specific questions and learning objectives, making complex topics accessible and engaging.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 gap-6"
          >
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <Brain className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI-Powered</h3>
              <p className="text-gray-600">Advanced algorithms understand and visualize concepts</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <Lightbulb className="w-12 h-12 text-yellow-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Interactive</h3>
              <p className="text-gray-600">Learn by doing, not just watching</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg col-span-2">
              <Zap className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Real-time</h3>
              <p className="text-gray-600">Instant visualization of your ideas</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}