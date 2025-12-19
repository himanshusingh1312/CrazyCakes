"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Container from "../../container";
import Header from "../../header/page";
import Footer from "../../footer/page";
import { FaSearch } from "react-icons/fa";
import Pagination from "../../components/Pagination";
import Loader from "../../loader";
const CategoryPage = () => {
  const params = useParams();
  const router = useRouter();
  const categoryParam = String(params.category || "").toLowerCase();
  const [subcategories, setSubcategories] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState(null);
  const itemsPerPage = 9;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!categoryParam) return;
    if (!["cake", "pastry"].includes(categoryParam)) {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/subcategory?category=${categoryParam}`);
        const data = await res.json();
        if (res.ok) {
          const fetchedSubcategories = data.subcategories || [];
          setAllSubcategories(fetchedSubcategories);
          setSubcategories(fetchedSubcategories);
        } else {
          setAllSubcategories([]);
          setSubcategories([]);
        }
      } catch (e) {
        setSubcategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryParam, router]);

  const title =
    categoryParam === "cake"
      ? "Cake Subcategories"
      : categoryParam === "pastry"
      ? "Pastry Subcategories"
      : "Subcategories";

  const handleClickSubcategory = (id) => {
    router.push(`/products?subcategory=${id}`);
  };

  // Filter subcategories based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = allSubcategories.filter((sub) =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSubcategories(filtered);
    } else {
      setSubcategories(allSubcategories);
    }
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchQuery, allSubcategories]);

  // Calculate pagination
  const totalPages = Math.ceil(subcategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubcategories = subcategories.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Header />
      <Container>
        <div className="py-12">
          <div className="flex gap-6">
            {/* Sidebar - Only for regular users */}
            {user && user.type === "user" && (
              <div className="hidden lg:block w-56 flex-shrink-0">
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                  <h2 className="text-lg font-bold text-[#5b3a29] mb-4">Menu</h2>
                  <nav className="space-y-2">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#5b3a29] hover:bg-[#fff4ea] transition-colors"
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
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      <span className="font-medium">Dashboard</span>
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#5b3a29] hover:bg-[#fff4ea] transition-colors"
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
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <span className="font-medium">Orders</span>
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#5b3a29] hover:bg-[#fff4ea] transition-colors"
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span className="font-medium">Profile</span>
                    </Link>
                    <Link
                      href="/contact"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#5b3a29] hover:bg-[#fff4ea] transition-colors"
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
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="font-medium">Contact</span>
                    </Link>
                  </nav>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1">
              <h1 className="mb-6 text-3xl font-bold text-[#5b3a29]">{title}</h1>
              <p className="mb-8 text-sm text-[#8a6a52]">
                Choose your favourite {categoryParam} type.
              </p>

              {/* Search Bar */}
            <div className="mb-6 relative w-full max-w-md">
  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5b3a29] h-4 w-4" />

  <input
    type="text"
    placeholder="Search subcategories..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full rounded-lg border border-[#e5d4c4] bg-white pl-10 pr-3 py-2 text-sm text-[#5b3a29] outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
  />
</div>

          {loading ? (
              <Loader />
          ) : subcategories.length === 0 ? (
            <p className="text-center text-[#8a6a52]">
              {searchQuery ? "No subcategories found matching your search." : "No subcategories available."}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {paginatedSubcategories.map((sub) => (
                <button
                  key={sub._id}
                  onClick={() => handleClickSubcategory(sub._id)}
                  className="group overflow-hidden rounded-2xl border border-[#f1e4d8] bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {sub.image && (
                    <img
                      src={sub.image}
                      alt={sub.name}
                      className="h-48 w-full object-cover transition group-hover:scale-105"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="mb-1 text-lg font-semibold text-[#5b3a29]">
                      {sub.name}
                    </h3>
                    <p className="text-xs uppercase tracking-wide text-[#8a6a52]">
                      {sub.category}
                    </p>
                  </div>
                </button>
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
          </div>
        </div>
      </Container>
      
      <Footer/>
    </div>
  );
};

export default CategoryPage;


