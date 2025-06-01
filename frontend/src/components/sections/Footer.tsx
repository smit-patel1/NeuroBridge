@@ .. @@
 import React from 'react';
-import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
+import { Github } from 'lucide-react';
+import { Link } from 'react-router-dom';
 
-const socialLinks = [
-  { icon: Github, href: "#", label: "GitHub" },
-  { icon: Twitter, href: "#", label: "Twitter" },
-  { icon: Linkedin, href: "#", label: "LinkedIn" },
-  { icon: Mail, href: "#", label: "Email" }
-];
-
 const quickLinks = [
-  { name: "Home", href: "#" },
-  { name: "About", href: "#" },
-  { name: "Try Demo", href: "#" },
-  { name: "GitHub", href: "#" }
+  { name: "Home", to: "/" },
+  { name: "Learn More", to: "/learn-more" },
+  { name: "Try Demo", to: "/demo" }
 ];
 
 export default function Footer() {
@@ .. @@
             <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
             <ul className="space-y-2">
               {quickLinks.map(link => (
-                <li key={link.name}>
-                  <a href={link.href} className="text-gray-400 hover:text-white transition-colors">
+                <li key={link.name}>
+                  <Link to={link.to} className="text-gray-400 hover:text-white transition-colors">
                     {link.name}
-                  </a>
+                  </Link>
                 </li>
               ))}
             </ul>
@@ .. @@
           
           <div>
-            <h4 className="text-lg font-semibold mb-4">Connect</h4>
-            <div className="flex space-x-4">
-              {socialLinks.map(({ icon: Icon, href, label }) => (
-                <a
-                  key={label}
-                  href={href}
-                  aria-label={label}
-                  className="text-gray-400 hover:text-white transition-colors"
-                >
-                  <Icon className="w-6 h-6" />
-                </a>
-              ))}
-            </div>
+            <h4 className="text-lg font-semibold mb-4">GitHub</h4>
+            <a
+              href="https://github.com/smit-patel1/MindRender"
+              target="_blank"
+              rel="noopener noreferrer"
+              className="text-gray-400 hover:text-white transition-colors inline-flex items-center"
+            >
+              <Github className="w-6 h-6" />
+              <span className="ml-2">View Source</span>
+            </a>
           </div>
         </div>