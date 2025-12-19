"use client";

import React from "react";

const TermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const terms = [
    {
      
      title: "Order Placement",
      content: "All orders must be placed through our website or by contacting us directly. Orders are subject to availability and confirmation. We recommend placing orders at least 24-48 hours in advance for custom cakes."
    },
    {
      
      title: "Payment Terms",
      content: "Payment can be made through cash on delivery or online payment methods. Full payment is required at the time of order confirmation for custom designs. We accept all major credit/debit cards and digital wallets."
    },
    {
      
      title: "Order Cancellation",
      content: "Orders can be cancelled up to 24 hours before the scheduled delivery/pickup time. Cancellations made less than 24 hours before may be subject to a cancellation fee. Once preparation has begun, orders cannot be cancelled."
    },
    {
      
      title: "Modifications",
      content: "Order modifications (size, design, delivery details) can be made up to 24 hours before delivery, subject to availability and additional charges if applicable. Changes requested less than 24 hours before may not be possible."
    },
    {
      
      title: "Delivery & Pickup",
      content: "We offer both home delivery and store pickup options. Delivery charges apply for home delivery orders. Delivery times are estimates and may vary based on location and traffic. Customers are responsible for providing accurate delivery addresses."
    },
    {
      
      title: "Custom Designs",
      content: "Custom cake designs are created based on customer specifications. While we strive to match your vision, slight variations may occur. Custom design orders require approval before production begins. Design changes after approval may incur additional charges."
    },
    {
      
      title: "Quality & Allergies",
      content: "We use high-quality ingredients in all our products. Please inform us of any allergies or dietary restrictions when placing your order. We are not liable for allergic reactions if allergies are not disclosed at the time of order."
    },
    {
      
      title: "Returns & Refunds",
      content: "Due to the perishable nature of our products, we do not accept returns. Refunds may be provided in cases of quality issues, incorrect orders, or delivery problems, subject to our review and approval. Refund requests must be made within 24 hours of delivery."
    },
    {
      
      title: "Customer Support",
      content: "Our customer support team is available to assist you with any questions or concerns. Contact us through our website, phone, or email. We aim to respond to all inquiries within 24 hours during business days."
    },
    {
      
      title: "Liability",
      content: "Crazy Cakes is not liable for any damages, injuries, or losses resulting from the consumption of our products beyond our control. Customers are responsible for storing and handling products according to our guidelines provided with each order."
    },
    {
      
      title: "Privacy & Data",
      content: "We respect your privacy and protect your personal information. Your data is used solely for order processing and communication purposes. We do not share your information with third parties without your consent."
    },
    {
      
      title: "Terms Updates",
      content: "We reserve the right to update these terms and conditions at any time. Customers will be notified of significant changes. Continued use of our services after changes constitutes acceptance of the updated terms."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="sm:text-3xl text-2xl">📜</span>
            <h2 className="sm:text-2xl text-xl font-bold text-white">Terms of Service</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#fffaf3]">
          <p className="text-sm text-[#8a6a52] mb-6 text-center">
            Last Updated: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="sm:text-lg text-md text-[#5b3a29] sm:mb-8 mb-6 text-center font-medium">
            Please read these terms carefully before using our services. By placing an order, you agree to these terms and conditions.
          </p>

          <div className="sm:space-y-4 space-y-3">
            {terms.map((term, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md border-2 border-[#e5d4c4] p-5 hover:shadow-lg transition-all"
              >
                <div className="flex items-start sm:gap-4 gap-3">
                  
                  <div className="flex-1">
                    <h3 className="sm:text-lg text-md font-bold text-[#5b3a29] mb-2">
                      {term.title}
                    </h3>
                    <p className="text-[#8a6a52] leading-relaxed sm:text-sm text-xs">
                      {term.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-[#e5d4c4] px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] text-white px-6 py-2 rounded-full font-semibold hover:from-[#4c3022] hover:to-[#5b3a29] transition shadow-md"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;

