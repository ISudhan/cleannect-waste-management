import React, { useEffect, useState } from 'react';

const Hero = () => {
  const texts = [
    "Connecting Waste to Worth",
    "Empowering Smart Waste Management",
    "Turn Trash into Treasure",
    "Join the Cleannect Revolution"
  ];

  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
        setIsVisible(true);
      }, 600);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      {/* Background Video */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover opacity-40"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src="/cleannect-bg.mp4" type="video/mp4" />
      </video>

      {/* Animated Grid Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70"></div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-500 bg-opacity-20 backdrop-blur-sm border border-emerald-400 border-opacity-30 rounded-full px-6 py-2 mb-8">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-emerald-300 text-sm font-medium tracking-wide">SUSTAINABLE FUTURE</span>
        </div>

        {/* Main Heading with Animation */}
        <h1 
          className={`text-6xl md:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-200 to-emerald-400 transition-all duration-600 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{
            lineHeight: '1.1',
            letterSpacing: '-0.02em'
          }}
        >
          {texts[currentTextIndex]}
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
          Transform waste management with cutting-edge technology. 
          <span className="block mt-2 text-emerald-400">Clean. Connect. Create.</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="group relative px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-emerald-500/50 hover:shadow-emerald-500/70 hover:scale-105">
            <span className="relative z-10">Get Started</span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          
          <button className="group px-8 py-4 bg-white bg-opacity-10 backdrop-blur-sm hover:bg-opacity-20 text-white font-semibold rounded-lg border border-white border-opacity-30 transition-all duration-300 hover:scale-105">
            Watch Demo
            <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
          <div className="backdrop-blur-sm bg-white bg-opacity-5 rounded-lg p-6 border border-white border-opacity-10">
            <div className="text-4xl font-bold text-emerald-400 mb-2">10K+</div>
            <div className="text-gray-400 text-sm">Users</div>
          </div>
          <div className="backdrop-blur-sm bg-white bg-opacity-5 rounded-lg p-6 border border-white border-opacity-10">
            <div className="text-4xl font-bold text-emerald-400 mb-2">50+</div>
            <div className="text-gray-400 text-sm">Cities</div>
          </div>
          <div className="backdrop-blur-sm bg-white bg-opacity-5 rounded-lg p-6 border border-white border-opacity-10">
            <div className="text-4xl font-bold text-emerald-400 mb-2">95%</div>
            <div className="text-gray-400 text-sm">Efficiency</div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-white text-xs opacity-60">Scroll to explore</span>
        <div className="w-6 h-10 border-2 border-white border-opacity-30 rounded-full flex justify-center p-1">
          <div className="w-1 h-3 bg-white rounded-full opacity-60"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;