"use client";
import React, { useEffect } from "react";
import Container from "../container";
import AOS from "aos";
import "aos/dist/aos.css";
import { FaArrowRight } from "react-icons/fa";
import Link from "next/link";

const FeatureCard = ({
  title,
  description,
  image,
  badgeText,
  reverse = false,
  buttonText = "Learn More",
}) => {
  return (
    <div
      className="group grid grid-cols-1 md:grid-cols-2 gap-6 items-center
                 border border-[#d6d4d4] rounded-2xl
                 lg:p-8 md:p-6 p-4
                 shadow-md hover:shadow-[0px_0px_6px_rgba(0,0,0,0.3)]
                 transition-all duration-300 min-h-[420px]"
      data-aos="fade-up"
    >
      {/* TEXT */}
      <div className={reverse ? "order-2 md:order-2" : "order-1"}>
        <h3 className="xl:text-4xl lg:text-3xl sm:text-2xl text-xl font-bold text-[#5B3A29]">
          {title}
        </h3>

        {/* DESCRIPTION */}
        <p
          className="mt-6 sm:mt-4
                     xl:mt-16 lg:mt-12 md:mt-10 sm:mt-8
                     xl:group-hover:mt-8 lg:group-hover:mt-6 md:group-hover:mt-5 sm:group-hover:mt-4
                     transition-all duration-300
                     text-[#714f36] md:text-lg text-sm leading-relaxed"
        >
          {description}
        </p>

        {/* BUTTON */}
        <Link
          href={
            title === "Easy Contact & Support"
              ? "/contact"
              : title === "Cake Design Studio"
              ? "/category/cake"
              : "#"
          }
          className="mt-8 sm:mt-5
                     xl:mt-20 lg:mt-16 md:mt-12 sm:mt-10
                     xl:group-hover:mt-10 lg:group-hover:mt-8 md:group-hover:mt-6 sm:group-hover:mt-5 group-hover:mt-4
                     inline-flex items-center gap-2
                     transition-all duration-300
                     border border-[#5B3A29] 
                     px-6 sm:py-3 py-2 rounded-full 
                     font-semibold text-[#5B3A29]
                     hover:bg-white group-hover:shadow-[0px_0px_8px_rgba(0,0,0,0.4)]"
        >
          {buttonText}
          <FaArrowRight
            className="text-sm transform rotate-[-45deg]
                       transition-transform duration-300
                       group-hover:rotate-0"
          />
        </Link>
      </div>

      {/* IMAGE */}
      <div
        className={`relative flex justify-center ${
          reverse ? "order-1 md:order-1" : "order-2"
        }`}
      >
        {/* BADGE */}
        <div
          className="absolute top-2 right-3 transform translate-y-6
                     sm:translate-y-0 sm:opacity-100
                     group-hover:translate-y-0 group-hover:opacity-100
                     transition-all duration-500 z-20"
        >
          <span
            className={`px-4 py-1 sm:px-6 sm:py-2 rounded-full text-xs sm:text-sm lg:text-md font-semibold shadow-md
              ${
                badgeText === "Support"
                  ? "bg-[#5B3A29] text-white"
                  : "bg-white text-[#5B3A29]"
              }
            `}
          >
            {badgeText}
          </span>
        </div>

        <img
          src={image}
          alt={title}
          className={`rounded-2xl border border-[#5B3A29] shadow-lg transition-all duration-300
            ${image === "/design_tool.png" ? "w-full max-w-lg" : "w-full max-w-md"}`}
        />
      </div>
    </div>
  );
};

const Features = () => {
  useEffect(() => {
    AOS.init({ duration: 900, once: false });
  }, []);

  return (
    <section
      className="bg-cover bg-center bg-no-repeat py-20"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,247,239,0.95), rgba(255,247,239,0.95)), url('/headerbg.png')",
      }}
    >
      <Container>
        <div className="sm:space-y-12 space-y-8">
          <FeatureCard
            title="Smart AI Assistant"
            description="Helps you find the perfect cake & products, book instantly, track orders, and get support anytime with a smooth AI experience."
            image="/assistantnew.png"
            badgeText="AI Assistant"
            buttonText="Explore Assistant"
          />

          <FeatureCard
            title="Cake Design Studio"
            description="Design your cake your way. Customize flavors, sizes, toppings, preview before ordering, and save your creations."
            image="/design_tool.png"
            badgeText="Design Studio"
            reverse
            buttonText="Design Your Cake"
          />

          <FeatureCard
            title="Easy Contact & Support"
            description="Quick contact for custom orders, instant support for queries, order-related assistance, and smooth communication."
            image="/contact.png"
            badgeText="Support"
            buttonText="Get Support"
          />
        </div>
      </Container>
    </section>
  );
};

export default Features;
