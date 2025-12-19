"use client";

import React from "react";
import Container from "../container";
import Header from "../header/page";
import Footer from "../footer/page";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Header />
      <Container>
        <div className="py-12">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-block mb-6">
              <span className="text-6xl">🎂</span>
            </div>
            <h1 className="text-5xl font-bold text-[#5b3a29] mb-4">
              About Crazy Cakes
            </h1>
            <p className="text-xl text-[#8a6a52] max-w-2xl mx-auto">
              Crafting sweet memories, one cake at a time. We bring joy and celebration to your special moments.
            </p>
          </div>

          {/* Section 1: Our Story */}
          <div className="mb-20 animate-fade-in delay-100">
            <div className="bg-gradient-to-br from-white to-[#fffaf3] rounded-3xl shadow-xl border-2 border-[#e5d4c4] p-8 md:p-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] p-4 rounded-2xl">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-[#5b3a29]">Our Story</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-lg text-[#8a6a52] leading-relaxed mb-4">
                    Crazy Cakes was born from a passion for creating extraordinary cakes that make every celebration memorable. 
                    What started as a small home-based bakery has grown into Lucknow's most beloved cake destination.
                  </p>
                  <p className="text-lg text-[#8a6a52] leading-relaxed mb-4">
                    Our journey began with a simple belief: every occasion deserves a perfect cake. Whether it's a birthday, 
                    wedding, anniversary, or just a Tuesday that needs some sweetness, we're here to make it special.
                  </p>
                  <p className="text-lg text-[#8a6a52] leading-relaxed">
                    Today, we combine traditional baking techniques with modern creativity, using only the finest ingredients 
                    to create cakes that are as beautiful as they are delicious.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-[#f1e4d8] to-[#fffaf3] rounded-2xl p-8 text-center">
                  <div className="text-6xl mb-4">👨‍🍳</div>
                  <h3 className="text-xl font-bold text-[#5b3a29] mb-2">Handcrafted with Love</h3>
                  <p className="text-[#8a6a52]">Every cake is made fresh daily by our expert bakers</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Our Values */}
          <div className="mb-20 animate-fade-in delay-200">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-[#5b3a29] mb-4">Our Values</h2>
              <p className="text-lg text-[#8a6a52]">What drives us every day</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Quality */}
              <div className="bg-white rounded-2xl shadow-lg border-2 border-[#e5d4c4] p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#5b3a29] mb-3">Premium Quality</h3>
                <p className="text-[#8a6a52]">
                  We use only the finest ingredients, sourced fresh daily. Every cake is crafted with attention to detail and uncompromising quality standards.
                </p>
              </div>

              {/* Creativity */}
              <div className="bg-white rounded-2xl shadow-lg border-2 border-[#e5d4c4] p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#5b3a29] mb-3">Creative Designs</h3>
                <p className="text-[#8a6a52]">
                  From classic elegance to modern masterpieces, our creative team brings your vision to life with stunning designs and personalized touches.
                </p>
              </div>

              {/* Customer Service */}
              <div className="bg-white rounded-2xl shadow-lg border-2 border-[#e5d4c4] p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#5b3a29] mb-3">Customer First</h3>
                <p className="text-[#8a6a52]">
                  Your satisfaction is our priority. We go above and beyond to ensure every order exceeds expectations and every customer feels valued.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Why Choose Us */}
          <div className="mb-20 animate-fade-in delay-300">
            <div className="bg-gradient-to-br from-[#5b3a29] to-[#8a6a52] rounded-3xl shadow-2xl p-8 md:p-12 text-white">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">Why Choose Crazy Cakes?</h2>
                <p className="text-lg text-white/90">Experience the difference</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                  <div className="text-4xl mb-3">🍰</div>
                  <h3 className="font-bold mb-2">Fresh Daily</h3>
                  <p className="text-sm text-white/90">Baked fresh every morning</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                  <div className="text-4xl mb-3">🚚</div>
                  <h3 className="font-bold mb-2">Fast Delivery</h3>
                  <p className="text-sm text-white/90">On-time delivery guaranteed</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                  <div className="text-4xl mb-3">🎨</div>
                  <h3 className="font-bold mb-2">Custom Designs</h3>
                  <p className="text-sm text-white/90">Personalized to your taste</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                  <div className="text-4xl mb-3">⭐</div>
                  <h3 className="font-bold mb-2">5-Star Rated</h3>
                  <p className="text-sm text-white/90">Loved by thousands</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="text-center animate-fade-in delay-400">
            <div className="bg-gradient-to-br from-white to-[#fffaf3] rounded-2xl shadow-lg border-2 border-[#e5d4c4] p-8">
              <h2 className="text-3xl font-bold text-[#5b3a29] mb-4">Have Questions?</h2>
              <p className="text-lg text-[#8a6a52] mb-6">
                We'd love to hear from you! Get in touch with us for custom orders or any inquiries.
              </p>
              <button
                onClick={() => window.location.href = "/contact"}
                className="bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] text-white px-8 py-3 rounded-full font-semibold hover:from-[#4c3022] hover:to-[#5b3a29] transition transform hover:scale-105 shadow-lg"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </Container>
      <Footer />
    </div>
  );
};

export default AboutPage;

