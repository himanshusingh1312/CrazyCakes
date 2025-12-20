import React from "react";

const Loader = () => {
  return (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fffaf3]">
      <div className="relative flex items-center justify-center">

        {/* Rotating Circle */}
        <div className="absolute sm:h-28 sm:w-28 h-20 w-20 rounded-full border-4 border-[#5B3A29] border-t-transparent animate-spin" />

        {/* Logo */}
        <img
          src="/cakelogo.png"
          alt="Loading"
          className="sm:h-16 sm:w-16 h-12 w-12 object-contain animate-pulse"
        />
      </div>
    </div>
  );
};

export default Loader;
