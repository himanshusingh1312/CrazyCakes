"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Container from "../container";
// AOS
import AOS from "aos";
import "aos/dist/aos.css";
const TestimonialsSection = () => {
  const [allTestimonials, setAllTestimonials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
 
    useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: "ease-out-cubic",
      once: false,
      offset: 80,
    });
  
    AOS.refresh();
  }, []);
  /* -------- Screen size detection -------- */
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const cardsPerPage = isMobile ? 1 : 3;

  /* -------- Fetch testimonials -------- */
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/testimonials");
        const data = await res.json();
        if (res.ok) setAllTestimonials(data.testimonials || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  const testimonials = allTestimonials.slice(
    currentIndex,
    currentIndex + cardsPerPage
  );

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex + cardsPerPage < allTestimonials.length;

  const handlePrev = () => {
    if (canGoPrev) {
      setCurrentIndex((prev) => Math.max(prev - cardsPerPage, 0));
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setCurrentIndex((prev) =>
        Math.min(prev + cardsPerPage, allTestimonials.length - cardsPerPage)
      );
    }
  };

  const renderStars = (rating) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-5 w-5 ${
            star <= rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  if (loading || allTestimonials.length === 0) return null;

  const showNav = allTestimonials.length > cardsPerPage;

  return (
    <section className="relative overflow-hidden py-16 bg-[#fcf9f7]">

  {/* BUBBLES */}
  <div className="pointer-events-none absolute inset-0">
    <span className="absolute left-10 top-10 h-24 w-24 rounded-full bg-white/40 blur-sm"></span>
    <span className="absolute right-20 top-32 h-32 w-32 rounded-full bg-white/30 blur-md"></span>
    <span className="absolute left-1/4 bottom-20 h-40 w-40 rounded-full bg-white/25 blur-lg"></span>
    <span className="absolute right-1/3 bottom-10 h-20 w-20 rounded-full bg-white/40 blur-sm"></span>
    <span className="absolute left-1/2 top-1/2 h-28 w-28 rounded-full bg-white/20 blur-md"></span>
  </div>

      <Container>
        <div className="text-center sm:mb-10 mb-6">
          <h2 className="sm:mb-4 mb-3 text-3xl font-bold text-[#5b3a29] md:text-4xl"  data-aos="fade-up">
            What Our Customers Say
          </h2>
          <p className="sm:text-lg text-md text-[#8a6a52]"  data-aos="fade-up">
            Real feedback from our happy customers
          </p>
        </div>

        {/* SAME STRUCTURE AS BESTSELLER */}
        <div className="relative py-2" data-aos="fade-up">
          {/* Left Arrow */}
          {showNav && (
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className="absolute left-0 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5b3a29] p-1.5 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#3e261a] disabled:opacity-30 md:p-2"
              aria-label="Previous testimonial"
            >
              <svg
                className="h-3 w-3 md:h-4 md:w-4"
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

          {/* Cards container (clipped) */}
          <div className="overflow-hidden rounded-2xl">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div
                data-aos="fade-up"
                  key={testimonial._id}
                  className="rounded-2xl border border-[#f1e4d8] bg-[#fffaf3] p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 flex items-center gap-3">
                    {testimonial.productImage && (
                      <img
                        src={testimonial.productImage}
                        alt={testimonial.productName}
                        className="hidden sm:block h-12 w-12 sm:h-16 sm:w-16 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-[#5b3a29]">
                        {testimonial.userName}
                      </h3>
                      <p className="text-xs text-[#8a6a52]">
                        {testimonial.productName}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    {renderStars(testimonial.rating)}
                  </div>

                  <p className="text-sm xl:text-md leading-relaxed text-[#8a6a52] line-clamp-3">
                    {testimonial.review}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Arrow */}
          {showNav && (
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className="absolute right-0 top-1/2 z-20 translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5b3a29] p-1.5 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#3e261a] disabled:opacity-30 md:p-2"
              aria-label="Next testimonial"
            >
              <svg
                className="h-3 w-3 md:h-4 md:w-4"
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
        </div>

        <div className="mt-10 text-center" data-aos="fade-up">
          <Link
            href="/testimonials"
            className="inline-block rounded-full bg-[#5b3a29] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#3e261a]"
          >
            View All Testimonials
          </Link>
        </div>
      </Container>
    </section>
  );
};

export default TestimonialsSection;
