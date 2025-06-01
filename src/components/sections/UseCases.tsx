import React from 'react';
import { motion } from 'framer-motion';
import { Binary, Dna, LineChart as ChartLineUp, Network, Braces, Atom } from 'lucide-react';

const cases = [
  {
    icon: Binary,
    title: "Binary Search Visualization",
    description: "Watch how binary search traverses through sorted arrays"
  },
  {
    icon: Dna,
    title: "Mitosis Simulation",
    description: "Explore cell division in an interactive 3D environment"
  },
  {
    icon: ChartLineUp,
    title: "Population Dynamics",
    description: "Simulate predator-prey relationships over time"
  },
  {
    icon: Network,
    title: "Neural Networks",
    description: "Visualize how neural networks process information"
  },
  {
    icon: Braces,
    title: "Sorting Algorithms",
    description: "Compare different sorting methods in real-time"
  },
  {
    icon: Atom,
    title: "Particle Physics",
    description: "Interact with subatomic particle simulations"
  }
];

export default function UseCases() {
  return (
    <section className="bg-white py-24 px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Built for Learners & Educators</h2>
          <p className="text-xl text-gray-600">Explore some of the possibilities with MindRender</p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cases.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-shadow"
              >
                <Icon className="w-10 h-10 text-blue-600 mb-6" />
                <h3 className="text-xl font-semibold mb-4">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}