// Wishlist utility functions for localStorage

export const getWishlist = () => {
  if (typeof window === "undefined") return [];
  try {
    const wishlist = localStorage.getItem("wishlist");
    return wishlist ? JSON.parse(wishlist) : [];
  } catch (e) {
    console.error("Error reading wishlist:", e);
    return [];
  }
};

export const addToWishlist = (product) => {
  if (typeof window === "undefined") return;
  try {
    const wishlist = getWishlist();
    const exists = wishlist.some((item) => item.productId === product.productId || item._id === product._id);
    
    if (!exists) {
      wishlist.push({
        productId: product.productId || product._id,
        _id: product._id,
        name: product.name,
        price: product.price,
        images: product.images,
        specification: product.specification,
        tag: product.tag,
      });
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
      window.dispatchEvent(new Event("wishlistUpdated"));
    }
    return wishlist;
  } catch (e) {
    console.error("Error adding to wishlist:", e);
    return [];
  }
};

export const removeFromWishlist = (productId) => {
  if (typeof window === "undefined") return;
  try {
    const wishlist = getWishlist();
    const filtered = wishlist.filter(
      (item) => item.productId !== productId && item._id !== productId
    );
    localStorage.setItem("wishlist", JSON.stringify(filtered));
    window.dispatchEvent(new Event("wishlistUpdated"));
    return filtered;
  } catch (e) {
    console.error("Error removing from wishlist:", e);
    return [];
  }
};

export const isInWishlist = (productId) => {
  const wishlist = getWishlist();
  return wishlist.some((item) => item.productId === productId || item._id === productId);
};

export const getWishlistCount = () => {
  return getWishlist().length;
};

