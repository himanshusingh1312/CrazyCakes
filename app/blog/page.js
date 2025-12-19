"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Container from "../container";
import Header from "../header/page";
import Footer from "../footer/page";
import Pagination from "../components/Pagination";
import Loader from "../loader";
const BlogPage = () => {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/blogs");
      const data = await response.json();

      if (response.ok) {
        setBlogs(data.blogs || []);
      }
    } catch (err) {
      console.error("Error fetching blogs:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  // Calculate pagination
  const totalPages = Math.ceil(blogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBlogs = blogs.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Header />
      <Container>
        <div className="py-12">
          <h1 className="mb-12 text-center sm:text-4xl text-3xl font-bold text-[#5b3a29]">
            Our Blog
          </h1>

          {loading ? (
            <div className="py-12 text-center text-[#8a6a52]">
              <Loader></Loader>
            </div>
          ) : blogs.length === 0 ? (
            <div className="py-12 text-center text-[#8a6a52]">
              No blogs available yet. Check back soon!
            </div>
          ) : (
            <>
              <div className="grid sm:gap-8 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {paginatedBlogs.map((blog) => (
                <div
                  key={blog._id}
                  className="group cursor-pointer rounded-lg bg-white overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-[#e5d4c4]"
                  onClick={() => router.push(`/blog/${blog._id}`)}
                >
                  {/* Image with Date Badge */}
                  <div className="relative sm:h-64 h-56 overflow-hidden">
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = "/placeholder-image.jpg";
                      }}
                    />
                    {/* Date Badge Overlay */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#5b3a29]">
                          {new Date(blog.createdAt).getDate()}
                        </div>
                        <div className="text-xs text-[#8a6a52] uppercase">
                          {new Date(blog.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Category Tag */}
                    <div className="sm:mb-2 mb-1">
                      <span className="inline-block rounded-full bg-[#5b3a29] px-4 py-1 text-xs font-semibold text-white">
                        {blog.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="sm:mb-2 mb-1 text-xl font-bold text-[#5b3a29] line-clamp-2 group-hover:text-[#8a6a52] transition-colors">
                      {blog.title}
                    </h2>

                    {/* Description */}
                    <p className="sm:mb-3 mb-2 text-sm text-[#8a6a52] line-clamp-3">
                      {blog.description}
                    </p>

                    {/* Read More Button */}
                    <button className="sm:mb-3 mb-2 text-sm font-semibold text-[#5b3a29] hover:text-[#8a6a52] transition-colors flex items-center gap-2">
                      Read More
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>

                    {/* Author and Date */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#e5d4c4]">
                      <div className="flex items-center gap-2">
                        {blog.authorId?.photo ? (
                          <img
                            src={blog.authorId.photo}
                            alt={blog.author}
                            className="h-8 w-8 rounded-full object-cover border border-[#e5d4c4]"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextElementSibling.style.display = "block";
                            }}
                          />
                        ) : null}
                        <svg
                          className={`h-4 w-4 text-[#8a6a52] ${blog.authorId?.photo ? "hidden" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span className="text-xs text-[#8a6a52]">
                          {blog.author}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4 text-[#8a6a52]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-xs text-[#8a6a52]">
                          {formatDate(blog.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </Container>
      <Footer />
    </div>
  );
};

export default BlogPage;

