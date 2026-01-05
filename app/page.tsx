import React from "react";
import Header from "./header/page";
import Hero from "./hero/page";
import Hero2 from "./hero2/page";
import BestsellerSection from "./components/BestsellerSection";
import TestimonialsSection from "./testimonials/section";
import Footer from "./footer/page";
import Features from './components/Features'
export const metadata = {
  title: "Order Cakes Online",
  description: "Order fresh cakes online with fast delivery from Crazy Cakes.",
  alternates: {
    canonical: "https://crazycakes.online/",
  },
};
const Home = () => {
  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Header />
      <main>
        <Hero />
        <Hero2 />
         <Features/>
        <BestsellerSection />
        <TestimonialsSection />
     
      </main>
      <Footer />
    </div>
  );
};

export default Home;
