import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Note: Removed api and related state as the new design is a static menu. No fetching 


const Dashboard = () => {
  return (
    <div className="min-h-screen bg-[#2d2243] flex flex-col items-center justify-center p-8 text-white">
      <div className="text-center mb-16">
        {/* Placeholder for the SideQuest logo and text */}
        <div className="flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-16 h-16 text-[#69c7cc]"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07L15.6 4.4a1 1 0 0 1 1.41 1.41l-1.61 1.62a3 3 0 1 1-4.24 4.24l-3-3a3 3 0 0 1 4.24-4.24l1.61 1.61a1 1 0 0 1-1.41 1.41l-1.61-1.61a1 1 0 0 0-1.41 1.41l3 3a1 1 0 0 0 1.41-1.41l-1.61-1.61a1 1 0 0 1 1.41-1.41l1.61 1.61a1 1 0 0 0 1.41-1.41l-3-3a5 5 0 0 0-7.07 7.07l3 3a5 5 0 0 0 7.54-.54" />
          </svg>
          <span className="text-5xl font-extrabold ml-4 tracking-wide">SIDEQUEST</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Creator Dashboard Section */}
        <div className="bg-[#46395c] rounded-xl shadow-xl p-8 flex flex-col items-center text-center">
          <h2 className="text-3xl font-semibold mb-2">Creator Dashboard</h2>
          <p className="text-gray-300 mb-6">Manage your treasure hunts</p>
          <Link
            to="/create"
            className="bg-sidequest-green text-gray-800 px-8 py-3 rounded-full font-bold text-lg hover:bg-opacity-80 transition-colors"
          >
            Create Hunt
          </Link>
        </div>

        {/* Player Dashboard Section */}
        <div className="bg-[#46395c] rounded-xl shadow-xl p-8 flex flex-col items-center text-center">
          <h2 className="text-3xl font-semibold mb-2">Player Dashboard</h2>
          <p className="text-gray-300 mb-6">Continue your adventure</p>
          <Link
            to="/join"
            className="bg-sidequest-green text-gray-800 px-8 py-3 rounded-full font-bold text-lg hover:bg-opacity-80 transition-colors"
          >
            View Hunts
          </Link>
        </div>

        {/* Badge Gallery Section */}
        <div className="md:col-span-2 bg-[#46395c] rounded-xl shadow-xl p-8 flex flex-col items-center text-center">
          <h2 className="text-3xl font-semibold mb-2">Badge Gallery</h2>
          <p className="text-gray-300 mb-6">See the badges you have earned</p>
          <Link
            to="/badges"
            className="bg-sidequest-yellow text-gray-800 px-8 py-3 rounded-full font-bold text-lg hover:bg-opacity-80 transition-colors"
          >
            View Badges
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
