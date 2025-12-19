"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Container from "../../container";
import Header from "../../header/page";

const SubcategoryPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    category: "cake",
  });
  const [imageFile, setImageFile] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
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
  }, [router]);

  const fetchSubcategories = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch("/api/subcategory");
      const data = await response.json();

      if (response.ok) {
        setSubcategories(data.subcategories || []);
      } else {
        toast.error("Failed to fetch subcategories");
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
    const file = e.target.files?.[0];
    setImageFile(file || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingId) {
      // Update existing subcategory
      if (!imageFile && !formData.name && !formData.category) {
        toast.error("Please provide at least one field to update");
        return;
      }

      setLoading(true);

      try {
        const form = new FormData();
        form.append("id", editingId);
        form.append("name", formData.name);
        form.append("category", formData.category);
        if (imageFile) {
          form.append("image", imageFile);
        }

        const response = await fetch("/api/subcategory", {
          method: "PUT",
          body: form,
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || "Failed to update subcategory");
          setLoading(false);
          return;
        }

        toast.success("Subcategory updated successfully!");
        setFormData({ name: "", category: "cake" });
        setImageFile(null);
        setEditingId(null);
        fetchSubcategories();
      } catch (err) {
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    } else {
      // Create new subcategory
      if (!imageFile) {
        toast.error("Please select an image");
        return;
      }

      setLoading(true);

      try {
        const form = new FormData();
        form.append("name", formData.name);
        form.append("category", formData.category);
        form.append("image", imageFile);

        const response = await fetch("/api/subcategory", {
          method: "POST",
          body: form,
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || "Failed to create subcategory");
          setLoading(false);
          return;
        }

        toast.success("Subcategory created successfully!");
        setFormData({ name: "", category: "cake" });
        setImageFile(null);
        fetchSubcategories();
      } catch (err) {
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (subcategory) => {
    setEditingId(subcategory._id);
    setFormData({
      name: subcategory.name,
      category: subcategory.category,
    });
    setImageFile(null);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: "", category: "cake" });
    setImageFile(null);
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/subcategory?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to delete subcategory");
        setLoading(false);
        return;
      }

      toast.success("Subcategory deleted successfully!");
      setDeleteConfirm(null);
      fetchSubcategories();
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
            Manage Subcategories
          </h1>

          {/* Add/Edit Subcategory Form */}
          <div className="mb-10 md:mb-12 rounded-2xl bg-white p-6 md:p-8 shadow-lg border border-[#f1e4d8]">
            <h2 className="mb-4 md:mb-6 text-lg md:text-xl font-semibold text-[#5b3a29]">
              {editingId ? "Edit Subcategory" : "Add New Subcategory"}
            </h2>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-3"
              encType="multipart/form-data"
            >
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-[#5b3a29]"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                  placeholder="e.g. Chocolate Cake"
                />
              </div>

              <div>
                <label
                  htmlFor="image"
                  className="mb-1 block text-sm font-medium text-[#5b3a29]"
                >
                  Image {editingId ? "(Optional - leave empty to keep current)" : ""}
                </label>
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  required={!editingId}
                  onChange={handleImageChange}
                  className="w-full text-sm text-[#5b3a29] file:mr-3 file:rounded-full file:border-0 file:bg-[#5b3a29] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#3e261a]"
                />
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="mb-1 block text-sm font-medium text-[#5b3a29]"
                >
                  Category
                </label>
                <select
                  id="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                >
                  <option value="cake">Cake</option>
                  <option value="pastry">Pastry</option>
                </select>
              </div>

              <div className="md:col-span-3 flex flex-wrap gap-2 md:gap-3">
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
                    ? "Update Subcategory"
                    : "Add Subcategory"}
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

          {/* Subcategories List */}
          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-lg border border-[#f1e4d8]">
            <h2 className="mb-5 md:mb-6 text-lg md:text-xl font-semibold text-[#5b3a29]">
              All Subcategories
            </h2>

            {fetchLoading ? (
              <p className="text-center text-[#8a6a52]">Loading...</p>
            ) : subcategories.length === 0 ? (
              <p className="text-center text-[#8a6a52]">No subcategories yet</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
                {subcategories.map((sub) => (
                  <div
                    key={sub._id}
                    className="rounded-lg border border-[#e5d4c4] p-4 relative"
                  >
                    <img
                      src={sub.image}
                      alt={sub.name}
                      className="mb-3 h-32 w-full rounded-lg object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <h3 className="font-semibold text-[#5b3a29]">{sub.name}</h3>
                    <p className="text-xs text-[#8a6a52] capitalize mb-3">
                      {sub.category}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEdit(sub)}
                        disabled={loading || editingId === sub._id}
                        className="flex-1 rounded-full bg-[#5b3a29] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#3e261a] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(sub._id)}
                        disabled={loading || deleteConfirm === sub._id}
                        className="flex-1 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </div>
                    {deleteConfirm === sub._id && (
                      <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-xs text-red-800 mb-2">
                          Are you sure you want to delete this subcategory?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(sub._id)}
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

export default SubcategoryPage;

