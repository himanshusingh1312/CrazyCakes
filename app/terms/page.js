"use client";

import React from "react";
import Container from "../container";
import Header from "../header/page";
import Footer from "../footer/page";

const TermsPage = () => {
  const terms = [
    {
      icon: "📋",
      title: "Order Placement",
      content: "All orders must be placed through our website or by contacting us directly. Orders are subject to availability and confirmation. We recommend placing orders at least 24-48 hours in advance for custom cakes."
    },
    {
      icon: "💰",
      title: "Payment Terms",
      content: "Payment can be made through cash on delivery or online payment methods. Full payment is required at the time of order confirmation for custom designs. We accept all major credit/debit cards and digital wallets."
    },
    {
      icon: "📅",
      title: "Order Cancellation",
      content: "Orders can be cancelled up to 24 hours before the scheduled delivery/pickup time. Cancellations made less than 24 hours before may be subject to a cancellation fee. Once preparation has begun, orders cannot be cancelled."
    },
    {
      icon: "🔄",
      title: "Modifications",
      content: "Order modifications (size, design, delivery details) can be made up to 24 hours before delivery, subject to availability and additional charges if applicable. Changes requested less than 24 hours before may not be possible."
    },
    {
      icon: "🚚",
      title: "Delivery & Pickup",
      content: "We offer both home delivery and store pickup options. Delivery charges apply for home delivery orders. Delivery times are estimates and may vary based on location and traffic. Customers are responsible for providing accurate delivery addresses."
    },
    {
      icon: "📸",
      title: "Custom Designs",
      content: "Custom cake designs are created based on customer specifications. While we strive to match your vision, slight variations may occur. Custom design orders require approval before production begins. Design changes after approval may incur additional charges."
    },
    {
      icon: "⚠️",
      title: "Quality & Allergies",
      content: "We use high-quality ingredients in all our products. Please inform us of any allergies or dietary restrictions when placing your order. We are not liable for allergic reactions if allergies are not disclosed at the time of order."
    },
    {
      icon: "🔙",
      title: "Returns & Refunds",
      content: "Due to the perishable nature of our products, we do not accept returns. Refunds may be provided in cases of quality issues, incorrect orders, or delivery problems, subject to our review and approval. Refund requests must be made within 24 hours of delivery."
    },
    {
      icon: "📞",
      title: "Customer Support",
      content: "Our customer support team is available to assist you with any questions or concerns. Contact us through our website, phone, or email. We aim to respond to all inquiries within 24 hours during business days."
    },
    {
      icon: "⚖️",
      title: "Liability",
      content: "Crazy Cakes is not liable for any damages, injuries, or losses resulting from the consumption of our products beyond our control. Customers are responsible for storing and handling products according to our guidelines provided with each order."
    },
    {
      icon: "🔒",
      title: "Privacy & Data",
      content: "We respect your privacy and protect your personal information. Your data is used solely for order processing and communication purposes. We do not share your information with third parties without your consent."
    },
    {
      icon: "📝",
      title: "Terms Updates",
      content: "We reserve the right to update these terms and conditions at any time. Customers will be notified of significant changes. Continued use of our services after changes constitutes acceptance of the updated terms."
    }
  ];

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Header />
      <Container>
        <div className="py-12">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-block mb-6">
              <span className="text-6xl">📜</span>
            </div>
            <h1 className="text-5xl font-bold text-[#5b3a29] mb-4">
              Terms of Service
            </h1>
            <p className="text-xl text-[#8a6a52] max-w-2xl mx-auto">
              Please read these terms carefully before using our services. By placing an order, you agree to these terms and conditions.
            </p>
            <p className="text-sm text-[#8a6a52] mt-4">
              Last Updated: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Terms List */}
          <div className="space-y-6 max-w-4xl mx-auto">
            {terms.map((term, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg border-2 border-[#e5d4c4] p-6 md:p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{term.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#5b3a29] mb-3">
                      {term.title}
                    </h3>
                    <p className="text-[#8a6a52] leading-relaxed">
                      {term.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-16 text-center animate-fade-in delay-600">
            <div className="bg-gradient-to-br from-white to-[#fffaf3] rounded-2xl shadow-lg border-2 border-[#e5d4c4] p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-[#5b3a29] mb-4">
                Questions About Our Terms?
              </h2>
              <p className="text-[#8a6a52] mb-6">
                If you have any questions or concerns about these terms, please don't hesitate to contact us.
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

export default TermsPage;

