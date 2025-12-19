import React from "react";

const Container = ({ children }) => {
  return (
    <div className="mx-auto max-w-8xl xl:px-20 lg:px-16 md:px-12 sm:px-6 px-4">
      {children}
    </div>
  );
};

export default Container;

