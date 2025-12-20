"use client";
import { useEffect } from "react";
// AOS
import AOS from "aos";
import "aos/dist/aos.css";
import Link from "next/link";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { FaArrowRight } from "react-icons/fa";
import Container from "../container";


const Hero = () => {
 useEffect(() => {
  AOS.init({
    duration: 1000,
    easing: "ease-out-cubic",
    once: false,
    offset: 80,
  });

  AOS.refresh();
}, []);
  return (
    <>
    <section 
      className="relative bg-[#fffaf3] bg-cover bg-center bg-no-repeat py-16 md:py-24"
      style={{
        backgroundImage: "url('/bgcrazy.png')",
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-[#fffaf3]/60"></div>
      <Container>
        <div className="relative z-10 grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left Side - Text Content */}
          <div className="text-center lg:text-left"   data-aos="fade-up">
            <h1 className="sm:mb-6 mb-4 sm:text-4xl text-3xl font-bold leading-tight text-[#5b3a29] md:text-5xl lg:text-6xl xl:text-7xl ">
              Welcome to{" "}
              <span className="text-[#8B4513]">Crazy Cakes  </span>
            </h1>
            <p className="mb-8 sm:text-lg text-md leading-relaxed  text-[#583f2b] md:text-xl">
              Indulge in our delicious collection of freshly baked cakes and
              pastries. Made with love and the finest ingredients, perfect for
              every celebration and moment.
            </p><div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">

  {/* EXPLORE CAKES */}
  <Link
    href="/category/cake"
    className="group flex items-center justify-center gap-2 rounded-full bg-[#5b3a29] px-8 py-3 text-center text-sm sm:text-md font-semibold text-white shadow-md transition hover:bg-[#3e261a] md:px-10 md:py-4 md:text-base"
  >
    Explore Cakes
    <span className="transform rotate-[-45deg] transition-transform duration-300 group-hover:rotate-0">
      <FaArrowRight />
    </span>
  </Link>

  {/* VIEW PASTRIES */}
  <Link
    href="/category/pastry"
    className="group flex items-center justify-center gap-2 rounded-full border-2 border-[#5b3a29] bg-white px-8 py-3 text-center text-sm sm:text-md font-semibold text-[#5b3a29] transition hover:bg-[#fff4ea] md:px-10 md:py-4 md:text-base"
  >
    View Pastries
    <span className="transform rotate-[-45deg] transition-transform duration-300 group-hover:rotate-0">
      <FaArrowRight />
    </span>
  </Link>

</div>

           {/* Video Section */}
 <div className="mt-10 flex justify-center md:hidden  border-2 rounded-2xl border-white"   data-aos="fade-up">
  <video
    className="h-[220px] w-full  rounded-2xl object-cover shadow-lg sm:h-[380px] md:h-[450px]"
    src="/herovid1.mp4"
    autoPlay
    loop
    muted
    playsInline
      poster="/bgcrazy.png"
  />
</div>

          </div>

          {/* Right Side - Image Carousel */}
          <div className="hidden  justify-center lg:justify-end md:flex"   data-aos="fade-up">
            <div className="relative w-full max-w-lg">
             <div className="mt-10 flex justify-center border-4 rounded-2xl border-white ">
  <video
    className="h-[220px] w-full  rounded-2xl object-cover shadow-lg sm:h-[380px] md:h-[450px] xl:h-[480px]"
    src="/herovid1.mp4"
    autoPlay
    loop
    muted
    playsInline
      poster="/bgcrazy.png"
  />
</div>
            </div>
          </div>
        </div>
      </Container>
    </section>
          {/* Section 1 - Marquee */}
      <section
        className="w-full overflow-hidden lg:h-[80px] sm:h-[70px] h-[60px]"
        style={{
          background: "linear-gradient(90deg, #C19A6B 0%, #2F1B12 100%)",

        }}
      >
        <div className="mx-auto max-w-8xl h-full xl:px-20 lg:px-16 md:px-12 sm:px-6 px-4">
          {/* Marquee wrapper */}
          <div className="flex h-full items-center">
            <div
              className="flex lg:gap-16 sm:gap-12 gap-10 animate-marquee"
              style={{ whiteSpace: "nowrap" }}
            >
              {[
                "Crunchy Cakes ",
                "Choclate Cakes",
                "Pineapple Cakes",
                "Children Cakes",
                "Strawberry Cakes",
                "Pineapple Pastry",
                "Banana Pastry"
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center lg:gap-6 gap-4 sm:gap-5 lg:text-[22px] sm:text-[18px] text-[16px] text-white"
                  style={{
                    fontFamily: "DM Sans",
                    fontWeight: 700,
                  
                    lineHeight: "100%",
                  }}
                >
                  <span className="h-3 w-3 rounded-full bg-orange-500" />
                  {item}
                </div>
              ))}
              {/* Repeat items for continuous scroll */}
              {[
                "Crunchy Cakes ",
                "Choclate Cakes",
                "Pineapple Cakes",
                "Children Cakes",
                "Strawberry Cakes",
                "Pineapple Pastry",
                "Banana Pastry"
              ].map((item, index) => (
                <div
                  key={"repeat-" + index}
                  className="flex items-center lg:gap-6 gap-4 sm:gap-5 lg:text-[22px] sm:text-[18px] text-[16px] text-white"
                  style={{
                    fontFamily: "DM Sans",
                    fontWeight: 700,
                  
                    lineHeight: "100%",
                  }}
                >
                  <span className="h-3 w-3 rounded-full bg-orange-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Tailwind Animation */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0%);
          }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 16s linear infinite;
        }
      `}</style>
</>
  );
};

export default Hero;

