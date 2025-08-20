import React, { useEffect, useRef, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";

export default function HeroSection() {
  const [activeAgent, setActiveAgent] = useState(null);
  const avatarGroupRef = useRef(null);
  const agents = [
    { name: "Agent 1", img: "https://randomuser.me/api/portraits/men/32.jpg" },
    {
      name: "Agent 2",
      img: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    { name: "Agent 3", img: "https://randomuser.me/api/portraits/men/55.jpg" },
    {
      name: "Agent 4",
      img: "https://randomuser.me/api/portraits/women/66.jpg",
    },
  ];

    // Detect click outside avatar group
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        avatarGroupRef.current &&
        !avatarGroupRef.current.contains(event.target)
      ) {
        setActiveAgent(null); // Close tooltip if clicked outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <div id="home" className="relative w-full overflow-hidden pt-14">
      {/* Background Image */}
      <img
        src="https://images.unsplash.com/photo-1600891964599-f61ba0e24092"
        alt="food-bg"
        className="w-full h-[90vh] object-cover rounded-b-[32px]"
      />

      {/* Black Overlay with Opacity */}
      <div className="absolute inset-0 bg-black/55 z-10"></div>

      {/* Content Above the Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 lg:px-20">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white text-4xl lg:text-6xl font-semibold max-w-3xl leading-tight"
        >
          Enhance Guest Experience with Technology
        </motion.h1>
        <p className="text-white mt-4 max-w-xl text-base lg:text-lg">
          Offer a faster, safer, and contactless dining experience with a simple
          QR scan — no physical menus, just seamless service.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link to="/login" className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 transition text-black font-semibold py-2.5 px-5 rounded-full">
            Get Started For Free <ArrowRight size={16} />
          </Link>
          <button className="flex items-center gap-2 border border-white hover:border-yellow-400 hover:text-yellow-400 transition text-white font-semibold py-2.5 px-5 rounded-full">
            Request a Quote <ArrowRight size={16} />
          </button>
        </div>

        {/* Agent Info */}
        <div className="mt-10 bg-white rounded-2xl py-3 px-4 w-full max-w-md sm:max-w-sm shadow-md mx-auto">
          <div className="flex items-center justify-between gap-3">
            {/* Avatars */}
            <div className="flex -space-x-2 overflow-visible"
            ref={avatarGroupRef}
            >
              {agents.map((agent, index) => (
                <div
                  key={index}
                  className="relative group cursor-pointer"
                  onClick={() =>
                    setActiveAgent(activeAgent === index ? null : index)
                  }
                >
                  {/* Avatar with hover scale */}
                  <img
                    src={agent.img}
                    alt={agent.name}
                    className="w-10 h-10 rounded-full border-2 border-white transition-transform duration-300 ease-in-out group-hover:scale-110"
                  />

                  {/* Tooltip on hover (desktop) */}
                  <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-yellow-400 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 sm:block hidden">
                    {agent.name}
                  </div>

                  {/* Name display on click (mobile) */}
                  {activeAgent === index && (
                    <div className="w-14 absolute z-20 bottom-full left-1/2 -translate-x-1/2 mt-2 px-1 py-1 bg-yellow-400 text-white text-xs rounded sm:hidden block">
                      {agent.name}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
              <span className="text-sm text-black ml-1">5 / 5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
