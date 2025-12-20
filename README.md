🍰 Crazy Cakes

A modern, AI-powered full-stack e-commerce platform for cakes and pastries.

📘 About

Crazy Cakes is a full-stack e-commerce web application built using Next.js and React, designed with a strong focus on performance, scalability, and user experience. The application utilizes the Next.js App Router for efficient server-side rendering, dynamic routing, and API handling. A fully responsive and visually consistent interface is achieved using Tailwind CSS, while AOS and Framer Motion enhance the UI with smooth animations and transitions.

On the backend, MongoDB with Mongoose is used for structured and scalable data management. Media assets are stored and optimized using Cloudinary, ensuring fast image delivery. Advanced features such as an AI-powered chatbot, sentiment analysis of user reviews, and dynamic admin dashboards are integrated using the Gemini API, making Crazy Cakes an intelligent, production-ready e-commerce solution.

✨ Key Highlights

⚡ Fast performance with SSR and optimized assets

🎨 Fully responsive modern UI

🤖 AI-driven features for smarter user interaction

🔐 Secure authentication with Admin & User roles

📊 Real-time analytics and order tracking

🚀 Features
🛒 User & Product Features
Feature	Status	Description
Sign Up	☑	Create a new user account
Log In	☑	Secure authentication
Cart	☑	Add and manage cart items
Checkout	☑	Fill delivery and order details
Subtotal	☑	Automatic price calculation
Wishlist	☑	Save favorite products
Orders	☑	View order history
Product Search	☑	Real-time search
Design Tool	☑	Customize cake designs
Order Tracking	☑	Live order status
🛠️ Admin Features
Feature	Status	Description
Admin Login	☑	Role-based admin access
Product Management	☑	Add, edit, delete products
Order Management	☑	Update order status
Dashboard	☑	Monthly analytics
Sentiment Analysis	☑	AI-based review insights
🤖 AI-Powered Features (Gemini API)

💬 AI Chatbot for product search, booking, and support

🧠 Sentiment Analysis on customer reviews

📈 Customer Insight Analysis for admins

🛍️ Smart product assistance (future-ready)

🧰 Built With

Frontend: HTML, CSS, React.js, Next.js

Styling: Tailwind CSS

Animations: AOS, Framer Motion

Backend: Next.js API Routes

Database: MongoDB, Mongoose

Media Storage: Cloudinary

AI Integration: Gemini API

Email Services: SMTP

Language: JavaScript / TypeScript

🖼️ Demonstration


![App Screenshot](/public/assistant.png)

![App Screenshot](/public/design_tool.png)

![App Screenshot](/public/products.png)

![App Screenshot](/public/order.png)


⚙️ Getting Started
Prerequisites

Node.js (v18 or higher)

MongoDB database

Cloudinary account

Gemini API key

Installation

Create a Next.js project:

npx create-next-app@latest


Or using Yarn:

yarn create next-app


Install dependencies and start the development server:

npm install
npm run dev

🔑 Environment Variables

Create a .env.local file and add the following:

MONGODB_URI=your_mongodb_url
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_api_key
SMTP_EMAIL=your_email
SMTP_PASSWORD=your_password