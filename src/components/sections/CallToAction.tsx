import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function CallToAction() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-24 px-8">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto text-center text-white"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Render Your Mind?</h2>
        <p className="text-xl mb-12">Start turning ideas into simulations today.</p>
        <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg">
          Launch MindRender
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </motion.div>
    </section>
  );
}