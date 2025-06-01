@@ .. @@
 import React from 'react';
+import { Link } from 'react-router-dom';
 import { Button } from "@/components/ui/button";
 import { Sparkles } from "lucide-react";
 import { motion } from "framer-motion";
@@ .. @@
           transition={{ delay: 0.4 }}
           className="flex flex-col sm:flex-row gap-4 justify-center"
         >
-          <Button className="bg-yellow-500 text-black hover:bg-yellow-400 px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg">
-            Try a Demo <Sparkles className="inline ml-2 w-5 h-5" />
-          </Button>
-          <Button variant="outline" className="border-2 border-white text-white px-8 py-6 rounded-2xl text-lg font-semibold hover:bg-white hover:text-black">
-            Learn More
-          </Button>
+          <Link to="/demo">
+            <Button className="bg-yellow-500 text-black hover:bg-yellow-400 px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg">
+              Try a Demo <Sparkles className="inline ml-2 w-5 h-5" />
+            </Button>
+          </Link>
+          <Link to="/learn-more">
+            <Button variant="outline" className="border-2 border-white text-white px-8 py-6 rounded-2xl text-lg font-semibold hover:bg-white hover:text-black">
+              Learn More
+            </Button>
+          </Link>
         </motion.div>

export default React