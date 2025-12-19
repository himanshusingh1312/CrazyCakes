"use client";

import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push("...");
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-2 rounded-lg border-2 transition ${
          currentPage === 1
            ? "border-[#e5d4c4] text-[#8a6a52] cursor-not-allowed opacity-50"
            : "border-[#5b3a29] text-[#5b3a29] hover:bg-[#5b3a29] hover:text-white"
        }`}
      >
        ←
      </button>

      {/* Page Numbers */}
      {pageNumbers.map((page, index) => {
        if (page === "...") {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-[#8a6a52]">
              ...
            </span>
          );
        }

        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-4 py-2 rounded-lg border-2 font-semibold transition ${
              currentPage === page
                ? "bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] text-white border-[#5b3a29]"
                : "border-[#e5d4c4] text-[#5b3a29] hover:border-[#5b3a29] hover:bg-[#fff4ea]"
            }`}
          >
            {page}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-2 rounded-lg border-2 transition ${
          currentPage === totalPages
            ? "border-[#e5d4c4] text-[#8a6a52] cursor-not-allowed opacity-50"
            : "border-[#5b3a29] text-[#5b3a29] hover:bg-[#5b3a29] hover:text-white"
        }`}
      >
        →
      </button>
    </div>
  );
};

export default Pagination;

