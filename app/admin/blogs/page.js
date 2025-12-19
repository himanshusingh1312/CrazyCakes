"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Container from "../../container";
import Header from "../../header/page";

const BlogsPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Cake",
  });
  const [imageFile, setImageFile] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const fileInputRef = useRef(null);

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

    fetchBlogs();
  }, [router]);

  const fetchBlogs = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch("/api/blogs");
      const data = await response.json();

      if (response.ok) {
        setBlogs(data.blogs || []);
      } else {
        toast.error("Failed to fetch blogs");
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
      // Update existing blog
      setLoading(true);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please login again");
          router.push("/login");
          return;
        }

        const form = new FormData();
        form.append("id", editingId);
        form.append("title", formData.title);
        form.append("description", formData.description);
        form.append("category", formData.category);
        if (imageFile) {
          form.append("image", imageFile);
        }

        const response = await fetch("/api/blogs", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || "Failed to update blog");
          setLoading(false);
          return;
        }

        toast.success("Blog updated successfully!");
        setFormData({
          title: "",
          description: "",
          category: "Cake",
        });
        setImageFile(null);
        setEditingId(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        fetchBlogs();
      } catch (err) {
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    } else {
      // Create new blog
      if (!imageFile) {
        toast.error("Please select an image");
        return;
      }

      setLoading(true);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please login again");
          router.push("/login");
          return;
        }

        const form = new FormData();
        form.append("title", formData.title);
        form.append("description", formData.description);
        form.append("category", formData.category);
        form.append("image", imageFile);

        const response = await fetch("/api/blogs", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || "Failed to create blog");
          setLoading(false);
          return;
        }

        toast.success("Blog created successfully!");
        setFormData({
          title: "",
          description: "",
          category: "Cake",
        });
        setImageFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        fetchBlogs();
      } catch (err) {
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (blog) => {
    setEditingId(blog._id);
    setFormData({
      title: blog.title || "",
      description: blog.description || "",
      category: blog.category || "Cake",
    });
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      category: "Cake",
    });
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login again");
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/blogs?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to delete blog");
        setLoading(false);
        return;
      }

      toast.success("Blog deleted successfully!");
      setDeleteConfirm(null);
      fetchBlogs();
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
          <h1 className="mb-6 md:mb-8 text-2xl md:text-3xl font-bold text-[#5b3a29]">Manage Blogs</h1>

          {/* Add/Edit Blog Form */}
          <div className="mb-10 md:mb-12 rounded-2xl bg-white p-6 md:p-8 shadow-lg border border-[#f1e4d8]">
            <h2 className="mb-4 md:mb-6 text-lg md:text-xl font-semibold text-[#5b3a29]">
              {editingId ? "Edit Blog" : "Add New Blog"}
            </h2>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              encType="multipart/form-data"
            >
              <div>
                <label
                  htmlFor="title"
                  className="mb-1 block text-sm font-medium text-[#5b3a29]"
                >
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#e5d4c4] bg-white px-4 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                  placeholder="Enter blog title"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-1 block text-sm font-medium text-[#5b3a29]"
                >
                  Description *
                </label>
                <textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  className="w-full rounded-lg border border-[#e5d4c4] bg-white px-4 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                  placeholder="Enter blog description"
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
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#e5d4c4] bg-white px-4 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                >
                  <option value="Cake">Cake</option>
                  <option value="Pastry">Pastry</option>
                  <option value="Recipe">Recipe</option>
                  <option value="Tips">Tips</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="image"
                  className="mb-1 block text-sm font-medium text-[#5b3a29]"
                >
                  Image {!editingId && "*"}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  required={!editingId}
                  className="w-full rounded-lg border border-[#e5d4c4] bg-white px-4 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                />
                {editingId && (
                  <p className="mt-1 text-xs text-[#8a6a52]">
                    Leave empty to keep current image
                  </p>
                )}
                {imageFile && (
                  <div className="mt-2">
                    <p className="text-sm text-[#5b3a29]">Preview:</p>
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="Preview"
                      className="mt-2 h-32 w-32 rounded-lg object-cover border border-[#e5d4c4]"
                    />
                  </div>
                )}
              </div>

                <div className="flex flex-wrap gap-2 md:gap-3">
                <button
                  type="submit"
                  disabled={loading}
                    className="rounded-full bg-[#5b3a29] px-5 md:px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#3e261a] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "Saving..."
                    : editingId
                    ? "Update Blog"
                    : "Create Blog"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                      className="rounded-full border border-[#5b3a29] px-5 md:px-6 py-2 text-sm font-semibold text-[#5b3a29] transition hover:bg-[#fff4ea]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Blogs List */}
          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-lg border border-[#f1e4d8]">
            <h2 className="mb-5 md:mb-6 text-lg md:text-xl font-semibold text-[#5b3a29]">
              All Blogs
            </h2>

            {fetchLoading ? (
              <div className="py-12 text-center text-[#8a6a52]">
                Loading blogs...
              </div>
            ) : blogs.length === 0 ? (
              <div className="py-12 text-center text-[#8a6a52]">
                No blogs found. Create your first blog!
              </div>
            ) : (
              <div className="grid gap-5 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {blogs.map((blog) => (
                  <div
                    key={blog._id}
                    className="rounded-lg border border-[#e5d4c4] bg-white overflow-hidden hover:shadow-md transition"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={blog.image}
                        alt={blog.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <div className="mb-2">
                        <span className="inline-block rounded-full bg-[#5b3a29] px-3 py-1 text-xs text-white">
                          {blog.category}
                        </span>
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-[#5b3a29] line-clamp-2">
                        {blog.title}
                      </h3>
                      <p className="mb-3 text-sm text-[#8a6a52] line-clamp-3">
                        {blog.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-[#8a6a52] mb-3">
                        <span>By {blog.author}</span>
                        <span>
                          {new Date(blog.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(blog)}
                          className="flex-1 rounded-lg bg-[#5b3a29] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#3e261a]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(blog._id)}
                          className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-[#5b3a29]">
              Confirm Delete
            </h3>
            <p className="mb-6 text-sm text-[#8a6a52]">
              Are you sure you want to delete this blog? This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-lg border border-[#5b3a29] px-4 py-2 text-sm font-semibold text-[#5b3a29] transition hover:bg-[#fff4ea]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={loading}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogsPage;

