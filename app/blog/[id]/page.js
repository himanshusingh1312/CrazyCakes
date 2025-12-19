"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Container from "../../container";
import Header from "../../header/page";
import Footer from "../../footer/page";
import Loader from "../../loader";
const BlogDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const blogId = String(params.id || "");
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!blogId) return;
    fetchBlog();
  }, [blogId]);

  useEffect(() => {
    if (blog) {
      fetchRelatedBlogs();
    }
  }, [blog]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blogs?id=${blogId}`);
      const data = await response.json();

      if (response.ok && data.blog) {
        setBlog(data.blog);
      }
    } catch (err) {
      console.error("Error fetching blog:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBlogs = async () => {
    try {
      const response = await fetch("/api/blogs");
      const data = await response.json();

      if (response.ok && data.blogs) {
        // Filter out current blog and get related blogs (same category or recent)
        const filtered = data.blogs
          .filter((b) => b._id !== blogId)
          .slice(0, 3); // Get 3 related blogs
        setRelatedBlogs(filtered);
      }
    } catch (err) {
      console.error("Error fetching related blogs:", err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffaf3]">
        <Header />
        <Container>
          <div className="py-12">
            < Loader/>
          </div>
        </Container>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-[#fffaf3]">
        <Header />
        <Container>
          <div className="py-12">
            <div className="text-center text-[#8a6a52]">Blog not found.</div>
            <button
              onClick={() => router.push("/blog")}
              className="mt-4 rounded-full bg-[#5b3a29] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#3e261a]"
            >
              Back to Blogs
            </button>
          </div>
        </Container>
        <Footer />
      </div>
    );
  }

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Header />
      <Container>
        <div className="sm:py-12  py-8">
          {/* Back Button */}
          <button
            onClick={() => router.push("/blog")}
            className="mb-8 text-sm text-[#8a6a52] hover:text-[#5b3a29] flex items-center gap-2 transition-all duration-300 hover:gap-3 animate-fade-in"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Blogs
          </button>

          {/* Full Width Blog Image */}
          <div className="sm:mb-12 mb-8 sm:h-[500px] h-[350px] w-full overflow-hidden rounded-3xl sm:shadow-lg shadow-md animate-fade-in">
            <img
              src={blog.image}
              alt={blog.title}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-100"
              onError={(e) => {
                e.target.src = "/placeholder-image.jpg";
              }}
            />
          </div>

          {/* Main Content Grid - Below Image */}
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Left Column - Main Blog Content */}
            <div className="lg:col-span-8">
              {/* Blog Content with Animations */}
              <div className="sm:space-y-6 space-y-4 animate-slide-up">
                {/* Category Tag */}
                <div className="animate-fade-in">
                  <span className="inline-block rounded-full bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] sm:px-5 px-4 sm:py-2 py-1 text-sm font-semibold text-white sm:shadow-lg shadow-md">
                    {blog.category}
                  </span>
                </div>

                {/* Title */}
                <h1 className="md:text-5xl sm:text-3xl text-2xl font-bold text-[#5b3a29] leading-tight animate-fade-in delay-100">
                  {blog.title}
                </h1>

                {/* Author and Date */}
                <div className="flex flex-wrap items-center gap-6 border-b-2 border-[#e5d4c4] pb-6 animate-fade-in delay-200">
                  <div className="flex items-center gap-2">
                    {blog.authorId?.photo ? (
                      <img
                        src={blog.authorId.photo}
                        alt={blog.author}
                        className="h-12 w-12 rounded-full object-cover border-2 border-[#e5d4c4]"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextElementSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div className={`rounded-full bg-[#fff4ea] p-2 ${blog.authorId?.photo ? "hidden" : ""}`}>
                      <svg
                        className="h-5 w-5 text-[#5b3a29]"
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
                    </div>
                    <span className="text-sm font-medium text-[#5b3a29]">
                      By {blog.author}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-[#fff4ea] p-2">
                      <svg
                        className="h-5 w-5 text-[#5b3a29]"
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
                    </div>
                    <span className="text-sm font-medium text-[#5b3a29]">
                      {formatDate(blog.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="prose prose-lg max-w-none animate-fade-in delay-300">
                  <div className="rounded-2xl bg-white sm:p-8 p-6 sm:shadow-lg shadow-md border border-[#e5d4c4]">
                    <p className="whitespace-pre-line lg:text-lg sm:text-md text-sm leading-relaxed text-[#5b3a29]">
                      {blog.description}
                    </p>
                  </div>
                </div>

                {/* Share Section */}
                <div className="sm:mt-12 mt-8 rounded-2xl border-2 border-[#e5d4c4] bg-gradient-to-br from-white to-[#fffaf3] sm:p-8 p-6 sm:shadow-lg shadow-md animate-fade-in delay-400">
                  <h3 className="sm:mb-6 mb-4 sm:text-2xl text-xl font-bold text-[#5b3a29]">
                    Share this blog
                  </h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: blog.title,
                            text: blog.description,
                            url: window.location.href,
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          alert("Link copied to clipboard!");
                        }
                      }}
                      className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Related Blogs Sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                <div className="rounded-2xl bg-white p-6 shadow-lg border border-[#e5d4c4] animate-fade-in delay-500">
                  <h2 className="mb-6 text-2xl font-bold text-[#5b3a29] border-b-2 border-[#e5d4c4] pb-4">
                    Related Blogs
                  </h2>
                  
                  {relatedBlogs.length === 0 ? (
                    <p className="text-sm text-[#8a6a52]">No related blogs available</p>
                  ) : (
                    <div className="space-y-4">
                      {relatedBlogs.map((relatedBlog, index) => (
                        <div
                          key={relatedBlog._id}
                          className="group cursor-pointer overflow-hidden rounded-xl border border-[#e5d4c4] bg-white transition-all duration-300 hover:shadow-xl hover:border-[#5b3a29] animate-fade-in"
                          style={{ animationDelay: `${600 + index * 100}ms` }}
                          onClick={() => router.push(`/blog/${relatedBlog._id}`)}
                        >
                          <div className="relative h-40 overflow-hidden">
                            <img
                              src={relatedBlog.image}
                              alt={relatedBlog.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                e.target.src = "/placeholder-image.jpg";
                              }}
                            />
                            <div className="absolute top-2 left-2">
                              <span className="rounded-full bg-[#5b3a29] px-3 py-1 text-xs font-semibold text-white">
                                {relatedBlog.category}
                              </span>
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="mb-2 text-base font-bold text-[#5b3a29] line-clamp-2 group-hover:text-[#8a6a52] transition-colors">
                              {relatedBlog.title}
                            </h3>
                            <div className="flex items-center justify-between text-xs text-[#8a6a52]">
                              <div className="flex items-center gap-2">
                                {relatedBlog.authorId?.photo ? (
                                  <img
                                    src={relatedBlog.authorId.photo}
                                    alt={relatedBlog.author}
                                    className="h-6 w-6 rounded-full object-cover border border-[#e5d4c4]"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                ) : null}
                                <span>{relatedBlog.author}</span>
                              </div>
                              <span>{formatDateShort(relatedBlog.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Back to Blogs Button */}
                <button
                  onClick={() => router.push("/blog")}
                  className="w-full rounded-full bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in delay-700"
                >
                  View All Blogs
                </button>
              </div>
            </div>
          </div>
        </div>
      </Container>
      <Footer />
      
      {/* Add CSS animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .delay-100 {
          animation-delay: 0.1s;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-400 {
          animation-delay: 0.4s;
        }
        
        .delay-500 {
          animation-delay: 0.5s;
        }
        
        .delay-600 {
          animation-delay: 0.6s;
        }
        
        .delay-700 {
          animation-delay: 0.7s;
        }
      `}</style>
    </div>
  );
};

export default BlogDetailPage;

