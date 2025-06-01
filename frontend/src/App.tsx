@@ .. @@
 import React from 'react';
+import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
+import Home from './pages/Home';
+import Demo from './pages/Demo';
+import LearnMore from './pages/LearnMore';
 import Mission from './components/sections/Mission';
 import Problem from './components/sections/Problem';
 import HowItWorks from './components/sections/HowItWorks';
@@ .. @@
 
 function App() {
   return (
-    <div className="overflow-x-hidden">
-      <Hero />
-      <Mission />
-      <Problem />
-      <HowItWorks />
-      <UseCases />
-      <CallToAction />
-      <Footer />
-    </div>
+    <Router>
+      <div className="overflow-x-hidden">
+        <Routes>
+          <Route path="/" element={
+            <>
+              <Home />
+              <Mission />
+              <Problem />
+              <HowItWorks />
+              <UseCases />
+              <CallToAction />
+              <Footer />
+            </>
+          } />
+          <Route path="/demo" element={<Demo />} />
+          <Route path="/learn-more" element={<LearnMore />} />
+        </Routes>
+      </div>
+    </Router>
   );