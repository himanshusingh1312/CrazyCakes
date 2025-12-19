"use client"
import Container from "../container";

import { useEffect } from "react";
// AOS
import AOS from "aos";
import "aos/dist/aos.css";
const Hero2 = () => {
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
    <section className=" py-16 sm:py-20 lg:py-24">
      
       
          {/* Section 3: Why Choose Us */}
          <div className=" animate-fade-in delay-300"  data-aos="fade-up">
            <Container>
 <div
  data-aos="fade-up"
  className="group relative overflow-hidden rounded-3xl shadow-lg sm:p-8 p-6 md:p-12 text-white"
>
{/* DEFAULT IMAGE */}
<div
  className="
    absolute inset-0
    bg-cover bg-center
    transition-opacity
    duration-500
    lg:group-hover:opacity-0
  "
  style={{ backgroundImage: "url('/hero2a.png')" }}
/>
{/* HOVER IMAGE */}
<div
  className="
    absolute inset-0
    bg-cover bg-center
    opacity-0
    transition-opacity
    duration-500
    lg:group-hover:opacity-100
  "
  style={{ backgroundImage: "url('/hero2b.png')" }}
/>

              <div className="text-center lg:mb-12 sm:mb-8 mb-6"  data-aos="fade-up">
                <h2 className="xl:text-4xl lg:text-3xl sm:text-3xl text-2xl font-bold mb-2  sm:mb-3 md:mb-4 mt-4">Why Choose Crazy Cakes?</h2>
                <p className="sm:text-lg text-md lg:text-xl text-white/90">Experience the difference</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 sm:gap-6 gap-4"  data-aos="fade-up">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:p-6 p-4 text-center border border-white/20">
                  <div className="text-4xl sm:mb-3 mb-2">🍰</div>
                  <h1 className="font-bold  lg:text-2xl sm:text-xl text-lg sm:mb-2 mb-1">Fresh Daily</h1>
                  <p className="md:text-md text-sm  text-white/90">Baked fresh every morning</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:p-6 p-4 text-center border border-white/20"  data-aos="fade-up">
                  <div className="text-4xl sm:mb-3 mb-2">🚚</div>
                  <h1 className="font-bold lg:text-2xl sm:text-xl text-lg  sm:mb-2 mb-1">Fast Delivery</h1>
                  <p className="md:text-md text-sm text-white/90">On-time delivery guaranteed</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:p-6 p-4 text-center border border-white/20"  data-aos="fade-up">
                  <div className="text-4xl sm:mb-3 mb-2">🎨</div>
                  <h1 className="font-bold lg:text-2xl sm:text-xl text-lg  sm:mb-2 mb-1">Custom Designs</h1>
                  <p className="md:text-md text-sm text-white/90">Personalized to your taste</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:p-6 p-4 text-center border border-white/20"  data-aos="fade-up">
                  <div className="text-4xl sm:mb-3 mb-2">⭐</div>
                  <h1 className="font-bold lg:text-2xl sm:text-xl text-lg  sm:mb-2 mb-1">5-Star Rated</h1>
                  <p className="md:text-md text-sm text-white/90">Loved by thousands</p>
                </div>
              </div>
            </div>
            
      </Container>
          </div>

    </section>
  );
};

export default Hero2;

