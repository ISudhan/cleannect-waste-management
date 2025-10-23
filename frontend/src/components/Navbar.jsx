import React, { useState } from "react";
import { Link } from "react-router-dom";
import logoUrl from "../assets/cleannect-logo.svg";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services & Support", path: "/services" },
    { name: "Explore →", path: "/signup" }
  ];

  return (
    <nav className="w-full bg-white shadow-sm py-3 px-6 md:px-16 flex items-center justify-between relative">
      {/* Left: Logo + Title */}
      <Link to="/" className="flex items-center space-x-3 ml-6 md:ml-24">
        <img src={logoUrl} alt="Cleannect Logo" className="h-8 w-8" />
        <span className="text-3xl font-irish text-green-700 drop-shadow-sm">
          Cleannect
        </span>
      </Link>

      {/* Desktop Nav */}
      <div className="hidden md:flex bg-green-50 rounded-full px-8 py-2 space-x-8 shadow-md mr-6 md:mr-24">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className="text-gray-700 hover:text-green-600 font-medium transition duration-200"
          >
            {link.name}
          </Link>
        ))}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-green-700 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-green-50 shadow-md flex flex-col items-center space-y-4 py-4 rounded-b-2xl md:hidden z-20">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="text-gray-700 hover:text-green-600 font-medium text-lg transition duration-200"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;