import React from 'react';
import serviceImg from '../assets/services-support.svg'; // replace with your actual image path

const ServicesAndSupport = () => {
  return (
    <section className="flex flex-col md:flex-row items-center justify-between px-10 py-16 bg-gray-50">
      {/* Image Left */}
      <div className="md:w-1/2 flex justify-center mb-10 md:mb-0">
        <img
          src={serviceImg}
          alt="Services and Support"
          className="w-4/5 max-w-md rounded-2xl shadow-lg"
        />
      </div>

      {/* Content Right */}
      <div className="md:w-1/2 text-gray-800">
        <h2 className="text-3xl font-bold mb-4 text-green-700">
          Our Services & Support
        </h2>
        <p className="text-lg mb-4">
          Cleannect offers a range of smart waste management services to make
          sustainability simpler for everyone. Whether you’re a household,
          business, or recycler — we’ve got the right tools and support to
          connect you with eco-friendly solutions.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Connect with verified waste buyers and recyclers.</li>
          <li>Track and manage your waste efficiently with smart tools.</li>
          <li>Get personalized tips on reducing waste and recycling better.</li>
          <li>24/7 community support for waste management queries.</li>
        </ul>
      </div>
    </section>
  );
};

export default ServicesAndSupport;
