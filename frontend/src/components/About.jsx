import React from "react";
import aboutImg from "../assets/about-img.svg";

const About = () => {
  return (
    <section className="w-full bg-gray-50 py-16 px-8 md:px-16">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10">
        
        {/* Left Side - Text */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            About Cleannect
          </h2>
          <p className="text-gray-600 text-base md:text-lg leading-relaxed">
            Cleannect is a smart waste management platform that bridges the gap 
            between waste producers and recyclers. It promotes sustainable habits, 
            enables users to sell or donate waste materials, and provides creative 
            ideas to transform waste into useful products — all in one digital space.
          </p>
        </div>

        {/* Right Side - Image */}
        <div className="flex-1">
          <img
            src={aboutImg}
            alt="About Cleannect"
            className="w-full max-w-md mx-auto md:mx-0 rounded-2xl shadow-md"
          />
        </div>

      </div>
    </section>
  );
};

export default About;
