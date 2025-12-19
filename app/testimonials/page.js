"use client";

import React, { useEffect, useState } from "react";
import Container from "../container";
import Header from "../header/page";

const TestimonialsPage = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/testimonials");
        const data = await response.json();

        if (response.ok) {
          setTestimonials(data.testimonials || []);
        }
      } catch (err) {
        console.error("Error fetching testimonials:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  const renderStars = (rating) => {
    return (
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
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Header />
      <Container>
        <div className="py-12">
          <h1 className="mb-4 text-3xl font-bold text-[#5b3a29]">Customer Testimonials</h1>
          <p className="mb-8 text-sm text-[#8a6a52]">
            See what our customers are saying about their experience with Crazy Cakes
          </p>

          {loading ? (
            <p className="text-center text-[#8a6a52]">Loading...</p>
          ) : testimonials.length === 0 ? (
            <div className="rounded-2xl border border-[#f1e4d8] bg-white p-12 text-center">
              <p className="text-lg text-[#8a6a52]">No testimonials yet</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial._id}
                  className="rounded-2xl border border-[#f1e4d8] bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-start gap-4">
                    {testimonial.productImage && (
                      <img
                        src={testimonial.productImage}
                        alt={testimonial.productName}
                        className="h-16 w-16 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="mb-1 font-semibold text-[#5b3a29]">
                        {testimonial.userName}
                      </h3>
                      <p className="text-xs text-[#8a6a52]">
                        {testimonial.productName}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">{renderStars(testimonial.rating)}</div>

                  <p className="mb-3 text-sm leading-relaxed text-[#8a6a52]">
                    {testimonial.review}
                  </p>

                  <p className="text-xs text-[#8a6a52]">
                    {formatDate(testimonial.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default TestimonialsPage;

