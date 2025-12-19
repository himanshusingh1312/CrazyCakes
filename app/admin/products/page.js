"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Container from "../../container";
import Header from "../../header/page";

const ProductsPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    subcategory: "",
    name: "",
    price: "",
    specification: "",
    tag: "",
  });
  const [imageFiles, setImageFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    // Check if user is admin
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userData);
      if (user.type !== "admin") {
        router.push("/");
        return;
      }
    } catch (e) {
      router.push("/login");
      return;
    }

    fetchSubcategories();
    fetchProducts();
  }, [router]);

  const fetchSubcategories = async () => {
    try {
      const response = await fetch("/api/subcategory");
      const data = await response.json();

      if (response.ok) {
        setSubcategories(data.subcategories || []);
      }
    } catch (err) {
      console.error("Failed to fetch subcategories");
    }
  };

  const fetchProducts = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch("/api/products");
      const data = await response.json();

      if (response.ok) {
        setProducts(data.products || []);
      } else {
        toast.error("Failed to fetch products");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && files.length !== 4) {
      toast.error("Please select exactly 4 images");
      setImageFiles([]);
      return;
    }
    setImageFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingId) {
      // Update existing product
      if (
        !imageFiles ||
        (imageFiles.length > 0 && imageFiles.length !== 4)
      ) {
        if (imageFiles.length > 0) {
          toast.error("Please select exactly 4 images or leave empty to keep current");
          return;
        }
      }

      setLoading(true);

      try {
        const form = new FormData();
        form.append("id", editingId);
        form.append("subcategory", formData.subcategory);
        form.append("name", formData.name);
        form.append("price", formData.price);
        form.append("specification", formData.specification);
        form.append("tag", formData.tag);
        if (imageFiles.length === 4) {
          imageFiles.forEach((file) => form.append("images", file));
        }

        const response = await fetch("/api/products", {
          method: "PUT",
          body: form,
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || "Failed to update product");
          setLoading(false);
          return;
        }

        toast.success("Product updated successfully!");
        setFormData({
          subcategory: "",
          name: "",
          price: "",
          specification: "",
          tag: "",
        });
        setImageFiles([]);
        setEditingId(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        fetchProducts();
      } catch (err) {
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    } else {
      // Create new product
      if (!imageFiles || imageFiles.length !== 4) {
        toast.error("Please select exactly 4 images");
        return;
      }

      setLoading(true);

      try {
        const form = new FormData();
        form.append("subcategory", formData.subcategory);
        form.append("name", formData.name);
        form.append("price", formData.price);
        form.append("specification", formData.specification);
        form.append("tag", formData.tag);
        imageFiles.forEach((file) => form.append("images", file));

        const response = await fetch("/api/products", {
          method: "POST",
          body: form,
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || "Failed to create product");
          setLoading(false);
          return;
        }

        toast.success("Product created successfully!");
        setFormData({
          subcategory: "",
          name: "",
          price: "",
          specification: "",
          tag: "",
        });
        setImageFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        fetchProducts();
      } catch (err) {
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setFormData({
      subcategory: product.subcategory?._id || product.subcategory || "",
      name: product.name || "",
      price: product.price || "",
      specification: product.specification || "",
      tag: product.tag || "",
    });
    setImageFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      subcategory: "",
      name: "",
      price: "",
      specification: "",
      tag: "",
    });
    setImageFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to delete product");
        setLoading(false);
        return;
      }

      toast.success("Product deleted successfully!");
      setDeleteConfirm(null);
      fetchProducts();
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Header />
      <ToastContainer position="top-right" autoClose={2000} theme="colored" />
      <Container>
        <div className="py-8 md:py-12">
          <h1 className="mb-6 md:mb-8 text-2xl md:text-3xl font-bold text-[#5b3a29]">
            Manage Products
          </h1>

          {/* Add/Edit Product Form */}
          <div className="mb-10 md:mb-12 rounded-2xl bg-white p-6 md:p-8 shadow-lg border border-[#f1e4d8]">
            <h2 className="mb-4 md:mb-6 text-lg md:text-xl font-semibold text-[#5b3a29]">
              {editingId ? "Edit Product" : "Add New Product"}
            </h2>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-2"
              encType="multipart/form-data"
            >
              <div>
                <label
                  htmlFor="subcategory"
                  className="mb-1 block text-sm font-medium text-[#5b3a29]"
                >
                  Subcategory
                </label>
                <select
                  id="subcategory"
                  required
                  value={formData.subcategory}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                >
                  <option value="">Select subcategory</option>
                  {subcategories.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name} ({sub.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-[#5b3a29]"
                >
                  Product Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                  placeholder="e.g. Chocolate Fudge Cake"
                />
              </div>

              <div>
                <label
                  htmlFor="price"
                  className="mb-1 block text-sm font-medium text-[#5b3a29]"
                >
                  Price
                </label>
                <input
                  id="price"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label
                  htmlFor="images"
                  className="mb-1 block text-sm font-medium text-[#5b3a29]"
                >
                  Images (exactly 4) {editingId ? "(Optional - leave empty to keep current)" : ""}
                </label>
                <input
                  id="images"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  required={!editingId}
                  onChange={handleImageChange}
                  className="w-full text-sm text-[#5b3a29] file:mr-3 file:rounded-full file:border-0 file:bg-[#5b3a29] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#3e261a]"
                />
              </div>

              <div>
                <label
                  htmlFor="tag"
                  className="mb-1 block text-sm font-medium text-[#5b3a29]"
                >
                  Tag (Optional)
                </label>
                <input
                  id="tag"
                  type="text"
                  value={formData.tag}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                  placeholder="e.g. Best Seller"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="specification"
                  className="mb-1 block text-sm font-medium text-[#5b3a29]"
                >
                  Specification
                </label>
                <textarea
                  id="specification"
                  required
                  value={formData.specification}
                  onChange={handleChange}
                  rows={5}
                  className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                  placeholder="Enter each specification on a new line. Each line will be displayed as a bullet point.&#10;Example:&#10;Fresh ingredients&#10;Made daily&#10;Customizable"
                />
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-2 md:gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-[#5b3a29] px-5 md:px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#3e261a] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? editingId
                      ? "Updating..."
                      : "Creating..."
                    : editingId
                    ? "Update Product"
                    : "Add Product"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={loading}
                    className="rounded-full border border-[#5b3a29] px-5 md:px-6 py-2 text-sm font-semibold text-[#5b3a29] transition hover:bg-[#fff4ea] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Products List */}
          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-lg border border-[#f1e4d8]">
            <h2 className="mb-5 md:mb-6 text-lg md:text-xl font-semibold text-[#5b3a29]">
              All Products
            </h2>

            {fetchLoading ? (
              <p className="text-center text-[#8a6a52]">Loading...</p>
            ) : products.length === 0 ? (
              <p className="text-center text-[#8a6a52]">No products yet</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className="rounded-lg border border-[#e5d4c4] p-4"
                  >
                    {product.images && product.images[0] && (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="mb-3 h-28 md:h-32 w-full rounded-lg object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                    <h3 className="mb-2 font-semibold text-[#5b3a29]">
                      {product.name}
                    </h3>
                    <p className="mb-2 text-sm text-[#8a6a52]">
                      <span className="font-medium">Subcategory:</span>{" "}
                      {product.subcategory?.name || "N/A"}
                    </p>
                    <p className="mb-2 text-sm text-[#8a6a52]">
                      <span className="font-medium">Price:</span> ₹
                      {product.price}
                    </p>
                    <div className="mb-2 text-sm text-[#8a6a52]">
                      <span className="font-medium">Specification:</span>
                      <ul className="mt-1 ml-4 list-disc space-y-1">
                        {product.specification
                          ?.split("\n")
                          .filter((line) => line.trim())
                          .map((line, idx) => (
                            <li key={idx} className="text-xs">
                              {line.trim()}
                            </li>
                          ))}
                      </ul>
                    </div>
                    {product.tag && (
                      <span className="inline-block rounded-full bg-[#5b3a29] px-2 py-1 text-xs text-white mb-2">
                        {product.tag}
                      </span>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEdit(product)}
                        disabled={loading || editingId === product._id}
                        className="flex-1 rounded-full bg-[#5b3a29] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#3e261a] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product._id)}
                        disabled={loading || deleteConfirm === product._id}
                        className="flex-1 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </div>
                    {deleteConfirm === product._id && (
                      <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-xs text-red-800 mb-2">
                          Are you sure you want to delete this product?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(product._id)}
                            disabled={loading}
                            className="flex-1 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                          >
                            Yes, Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            disabled={loading}
                            className="flex-1 rounded-full border border-red-600 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ProductsPage;

