import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Demo from './pages/Demo';
import LearnMore from './pages/LearnMore';
import Mission from './components/sections/Mission';
import Problem from './components/sections/Problem';
import HowItWorks from './components/sections/HowItWorks';
import UseCases from './components/sections/UseCases';
import CallToAction from './components/sections/CallToAction';
import Footer from './components/sections/Footer';

function App() {
  return (
    <Router>
      <div className="overflow-x-hidden">
        <Routes>
          <Route path="/" element={
            <>
              <Home />
              <Mission />
              <Problem />
              <HowItWorks />
              <UseCases />
              <CallToAction />
              <Footer />
            </>
          } />
          <Route path="/demo" element={<Demo />} />
          <Route path="/learn-more" element={<LearnMore />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App