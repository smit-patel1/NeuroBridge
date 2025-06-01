import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Code2, Play, MousePointer } from 'lucide-react';

const steps = [
  {
    icon: MessageSquare,
    title: "Describe",
    description: "Express what you want to visualize in plain English"
  },
  {
    icon: Code2,
    title: "Generate",
    description: "AI transforms your description into interactive code"
  },
  {
    icon: Play,
    title: "Visualize",
    description: "Watch your concept come to life in real-time"
  },
  {
    icon: MousePointer,
    title: "Explore",
    description: "Interact with and modify the simulation"
  }
];

export default function HowItWorks() {
  return (
    <section className="bg-gray-900 text-white py-24 px-8">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-center mb-16"
        >
          How MindRender Works
        </motion.h2>
        
        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-gray-800 p-8 rounded-xl hover:bg-gray-700 transition-colors"
              >
                <Icon className="w-12 h-12 text-blue-400 mb-6" />
                <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}