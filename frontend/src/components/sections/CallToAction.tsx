@@ .. @@
 import React from 'react';
+import { Link } from 'react-router-dom';
 import { motion } from 'framer-motion';
 import { Button } from '@/components/ui/button';
 import { ArrowRight } from 'lucide-react';
@@ .. @@
         viewport={{ once: true }}
         className="max-w-4xl mx-auto text-center text-white"
       >
         <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Render Your Mind?</h2>
         <p className="text-xl mb-12">Start turning ideas into simulations today.</p>
-        <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg">
-          Launch MindRender
-          <ArrowRight className="ml-2 w-5 h-5" />
-        </Button>
+        <Link to="/demo">
+          <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg">
+            Launch MindRender
+            <ArrowRight className="ml-2 w-5 h-5" />
+          </Button>
+        </Link>
       </motion.div>