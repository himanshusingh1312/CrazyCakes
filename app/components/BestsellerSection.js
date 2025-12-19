"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Container from "../container";
// AOS
import AOS from "aos";
import "aos/dist/aos.css";
const BestsellerSection = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(1);
  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: "ease-out-cubic",
      once: false,
      offset: 80,
    });
  
    AOS.refresh();
  }, []);
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerView(4); // Show all 4 on large screens
      } else if (window.innerWidth >= 768) {
        setItemsPerView(2); // Show 2 on medium screens
      } else {
        setItemsPerView(1); // Show 1 on small screens
      }
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/products");
        const data = await response.json();

        if (response.ok && data.products) {
          // Filter products that have tags (tag is not empty/null)
          const taggedProducts = data.products.filter(
            (product) => product.tag && product.tag.trim() !== ""
          );
          // Use all tagged products for sliding
          console.log("Bestsellers fetched:", taggedProducts);
          console.log("Product images:", taggedProducts.map(p => ({ name: p.name, images: p.images })));
          setProducts(taggedProducts);
        }
      } catch (error) {
        console.error("Error fetching bestsellers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBestsellers();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const maxIndex = Math.max(0, products.length - itemsPerView);
  
  // Calculate if we can navigate (like testimonials - no wrapping)
  const canGoNext = currentIndex < maxIndex;
  const canGoPrev = currentIndex > 0;

  const handlePrev = () => {
    if (canGoPrev) {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
    }
  };

  if (loading) {
    return (
      <section className="bg-white py-16">
        <Container>
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-[#5b3a29] md:text-4xl">
              ⭐ Bestsellers
            </h2>
            <p className="text-[#8a6a52]">Loading...</p>
          </div>
        </Container>
      </section>
    );
  }

  if (products.length === 0) {
    return null; // Don't show section if no tagged products
  }

  const showNav = products.length > itemsPerView;

  return (
    <section className="bg-white sm:py-16 py-12">
      <Container>
        <div className="text-center md:mb-12 sm:mb-10 mb-6">
          <h2 className="sm:mb-4 mb-3 sm:text-3xl text-3xl font-bold text-[#5b3a29] md:text-4xl"  data-aos="fade-up">
            ⭐ Bestsellers
          </h2>
          <p className="sm:text-lg text-md text-[#8a6a52]"  data-aos="fade-up">
            Our most loved and popular cakes
          </p>
        </div>

        <div className="relative py-2">
          {/* Left Arrow (outside the clipped area so it sits half-in/half-out) */}
          {showNav && (
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className={`absolute left-0 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5b3a29] p-1.5 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#3e261a] hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 disabled:hover:shadow-lg md:p-2 ${
                !canGoPrev ? "opacity-30" : ""
              }`}
              aria-label="Previous product"
            >
              <svg
                className="h-3 w-3 md:h-4 md:w-4 transition-transform duration-300 hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Slider Container (clipped) */}
          <div className="overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
              }}
            >
              {products.map((product) => {
                const images = Array.isArray(product.images) ? product.images : [];
                const mainImage = images[0];
                
                return (
                  <div
                    key={product._id}
                    className="min-w-full px-4 py-2 md:min-w-[50%] lg:min-w-[25%]"
                     data-aos="fade-up"
                  >
                    <div
                      onClick={() => router.push(`/product/${product._id}`)}
                      className="group cursor-pointer rounded-xl border-2 border-[#e5d4c4] bg-white p-4 shadow-lg transition-all duration-300 hover:border-[#5b3a29] hover:shadow-xl hover:scale-105 transform"
                    >
                      <div className="relative mb-3 h-40 lg:h-48  w-full overflow-hidden rounded-lg bg-gradient-to-br from-[#f1e4d8] to-[#fffaf3]">
                        {mainImage ? (
                          <img
                            src={mainImage}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => {
                              console.error("Image failed to load:", mainImage);
                              e.target.style.display = "none";
                            }}
                            onLoad={() => {
                              console.log("Image loaded successfully:", mainImage);
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#8a6a52] text-sm">
                            No Image Available
                          </div>
                        )}
                        {product.tag && (
                          <div className="absolute top-2 right-2 rounded-full bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-2 py-0.5 sm:py-1 text-xs sm:text-sm font-bold text-white shadow-md">
                            {product.tag}
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <h3 className="mb-1.5 text-base font-bold text-[#5b3a29] group-hover:text-[#3e261a] transition line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-lg font-bold text-[#8a6a52]">
                          {formatPrice(product.price)}
                        </p>
                     
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Arrow (outside the clipped area so it sits half-in/half-out) */}
          {showNav && (
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className={`absolute right-0 top-1/2 z-20 translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5b3a29] p-1.5 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#3e261a] hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 disabled:hover:shadow-lg md:p-2 ${
                !canGoNext ? "opacity-30" : ""
              }`}
              aria-label="Next product"
            >
              <svg
                className="h-3 w-3 md:h-4 md:w-4 transition-transform duration-300 hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}

          {/* Dots Indicator */}
          {products.length > itemsPerView && (
            <div className="mt-6 flex justify-center gap-2">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-8 bg-gradient-to-r from-[#5b3a29] to-[#8a6a52]"
                      : "w-3 bg-[#e5d4c4] hover:bg-[#8a6a52]"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
};

export default BestsellerSection;

