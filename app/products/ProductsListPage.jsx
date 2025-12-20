"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Container from "../container";
import Header from "../header/page";
import Pagination from "../components/Pagination";
import Footer from "../footer/page";
import { FaSearch } from "react-icons/fa";
import Loader from "../loader";
const ProductsListPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subcategoryId = searchParams.get("subcategory");

  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState(30);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [sortBy, setSortBy] = useState(""); // "", "price-low", "price-high"
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 9;

  useEffect(() => {
    if (!subcategoryId) {
      setProducts([]);
      setAllProducts([]);
      setLoading(false);
      return;
    }

    // Reset filters when subcategory changes
    setSearchQuery("");
    setMinPrice(30);
    setMaxPrice(100000);
    setSelectedRatings([]);
    setSortBy("");

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/products?subcategory=${encodeURIComponent(subcategoryId)}`
        );
        const data = await res.json();
        if (res.ok) {
          const fetchedProducts = data.products || [];
          setAllProducts(fetchedProducts);
          setProducts(fetchedProducts);
        } else {
          setAllProducts([]);
          setProducts([]);
        }
      } catch (e) {
        setAllProducts([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subcategoryId]);

  const subcategoryName =
    allProducts[0]?.subcategory?.name || "Selected Subcategory";

  const handleViewProduct = (id) => {
    router.push(`/product/${id}`);
  };

  // Filter and sort products
  useEffect(() => {
    if (loading || allProducts.length === 0) {
      return;
    }

    let filtered = [...allProducts];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price range filter
    filtered = filtered.filter((product) => {
      const price = Number(product.price) || 0;
      return price >= minPrice && price <= maxPrice;
    });

    // Rating filter
    if (selectedRatings.length > 0) {
      filtered = filtered.filter((product) => {
        const rating = Math.round(product.averageRating || 0);
        return selectedRatings.includes(rating);
      });
    }

    // Sort products
    if (sortBy === "price-low") {
      filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }

    setProducts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, allProducts, loading, minPrice, maxPrice, selectedRatings, sortBy]);

  // Calculate pagination
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = products.slice(startIndex, endIndex);


  const renderFilters = () => (
    <div className="rounded-lg border border-[#e5d4c4] bg-white p-4 shadow-sm w-full">
      <h2 className="mb-4 text-lg font-semibold text-[#5b3a29]">Filters</h2>
      
      {/* Price Range Filter */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-[#5b3a29]">Price Range</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-[#8a6a52]">Min Price (₹)</label>
            <input
              type="number"
              min="30"
              max="100000"
              value={minPrice}
              onChange={(e) => {
                const val = Math.max(30, Math.min(100000, Number(e.target.value) || 30));
                setMinPrice(val);
                if (val > maxPrice) setMaxPrice(val);
              }}
              className="w-full rounded border border-[#e5d4c4] bg-white px-3 py-2 text-sm text-[#5b3a29] outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#8a6a52]">Max Price (₹)</label>
            <input
              type="number"
              min="30"
              max="100000"
              value={maxPrice}
              onChange={(e) => {
                const val = Math.max(30, Math.min(100000, Number(e.target.value) || 100000));
                setMaxPrice(val);
                if (val < minPrice) setMinPrice(val);
              }}
              className="w-full rounded border border-[#e5d4c4] bg-white px-3 py-2 text-sm text-[#5b3a29] outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
            />
          </div>
          <div className="text-xs text-[#8a6a52]">
            Range: ₹{minPrice} - ₹{maxPrice}
          </div>
        </div>
      </div>

      {/* Star Rating Filter */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-[#5b3a29]">Star Rating</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <label key={rating} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedRatings.includes(rating)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRatings([...selectedRatings, rating]);
                  } else {
                    setSelectedRatings(selectedRatings.filter((r) => r !== rating));
                  }
                }}
                className="w-4 h-4 cursor-pointer text-[#5b3a29] focus:ring-[#5b3a29]"
              />
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`h-4 w-4 ${
                      star <= rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-[#8a6a52]">{rating} Star{rating > 1 ? 's' : ''}</span>
            </label>
          ))}
        </div>
        {selectedRatings.length > 0 && (
          <button
            onClick={() => setSelectedRatings([])}
            className="mt-2 text-xs text-[#5b3a29] hover:text-[#8a6a52] underline"
          >
            Clear ratings
          </button>
        )}
      </div>

      {/* Sort By */}
      <div className="mb-4">
        <h3 className="mb-3 text-sm font-semibold text-[#5b3a29]">Sort By</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full rounded border border-[#e5d4c4] bg-white px-3 py-2 text-sm text-[#5b3a29] outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
        >
          <option value="">Default</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>

      {/* Clear All Filters */}
      {(minPrice !== 30 || maxPrice !== 100000 || selectedRatings.length > 0 || sortBy !== "") && (
        <button
          onClick={() => {
            setMinPrice(30);
            setMaxPrice(100000);
            setSelectedRatings([]);
            setSortBy("");
          }}
          className="w-full rounded bg-[#5b3a29] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3e261a]"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Header />
      <Container>
        <div className="py-8 md:py-12">
          <button
            className="mb-4 text-sm text-[#8a6a52] hover:text-[#5b3a29]"
            onClick={() => router.back()}
          >
            ← Back
          </button>

          <h1 className="mb-2 text-2xl md:text-3xl font-bold text-[#5b3a29]">
            {subcategoryName}
          </h1>
          <p className="mb-6 md:mb-8 text-sm text-[#8a6a52]">
            Explore all products in this subcategory.
          </p>

          {/* Search Bar */}
        <div className="mb-6 relative w-full max-w-md">
  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5b3a29] h-4 w-4" />

  <input
    type="text"
    placeholder="Search products..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full rounded-lg border border-[#e5d4c4] bg-white pl-10 pr-3 py-2 text-sm text-[#5b3a29] outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
  />
</div>

          {/* Main Content with Sidebar */}
          <div className="flex flex-col lg:flex-row gap-5 md:gap-6">
            {/* Left Sidebar - Filters */}
            <div className="w-full lg:w-64 flex-shrink-0 sticky top-24 lg:top-28 h-max order-2 lg:order-1 hidden lg:block">
              {renderFilters()}
            </div>

            {/* Right Side - Products Grid */}
            <div className="flex-1 order-1 lg:order-2">
              <div className="mb-4 flex items-center justify-between lg:hidden">
                <button
                  onClick={() => setShowFilters(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#e5d4c4] bg-white px-4 py-2 text-sm font-semibold text-[#5b3a29] shadow-sm hover:bg-[#fff4ea]"
                >
                  Filters
                </button>
                <span className="text-xs text-[#8a6a52]">{products.length} item(s)</span>
              </div>

              {loading ? (
                <Loader/>
              ) : !subcategoryId ? (
                <p className="text-center text-[#8a6a52]">
                  Please select a subcategory from Cakes or Pastry first.
                </p>
              ) : products.length === 0 ? (
                <p className="text-center text-[#8a6a52]">
                  No products found {searchQuery ? "matching your search" : "for this subcategory"}.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {paginatedProducts.map((product) => {
                const images = Array.isArray(product.images)
                  ? product.images
                  : [];
                const mainImage = images[0];

                return (
                  <button
                    key={product._id}
                    onClick={() => handleViewProduct(product._id)}
                    className="overflow-hidden rounded-2xl border border-[#f1e4d8] bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative h-56 xl:h-64 w-full overflow-hidden bg-[#f1e4d8]">
                      {mainImage ? (
                        <img
                          src={mainImage.url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#8a6a52]">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="mb-1 text-lg font-semibold text-[#5b3a29]">
                        {product.name}
                      </h3>
                      <p className="mb-1 text-lg font-bold text-[#5b3a29]">
                        ₹{product.price}
                      </p>
                      {/* Star Rating */}
                      {product.averageRating > 0 && (
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= Math.round(product.averageRating)
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-xs text-[#8a6a52]">
                            ({product.averageRating}) {product.totalRatings > 0 && `(${product.totalRatings})`}
                          </span>
                        </div>
                      )}
                      {product.tag && (
                        <span className="mb-2 inline-block rounded-full bg-[#5b3a29] px-2 py-1 text-xs text-white">
                          {product.tag}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
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
      {/* Mobile Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden">
          <div className="absolute inset-x-3 top-16 bottom-3 overflow-auto rounded-2xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#5b3a29]">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="rounded-full border border-[#e5d4c4] px-3 py-1 text-sm text-[#5b3a29] hover:bg-[#fff4ea]"
              >
                Close
              </button>
            </div>
            {renderFilters()}
          </div>
        </div>
      )}
      <Footer/>
    </div>
  );
};

export default ProductsListPage;


