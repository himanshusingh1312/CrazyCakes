// Cart utility functions for localStorage

export const getCart = () => {
  if (typeof window === "undefined") return [];
  try {
    const cart = localStorage.getItem("cart");
    return cart ? JSON.parse(cart) : [];
  } catch (e) {
    console.error("Error reading cart:", e);
    return [];
  }
};

export const addToCart = (item) => {
  if (typeof window === "undefined") return;
  try {
    const cart = getCart();
    // Always add as new item (no quantity merging)
    cart.push({ ...item });
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    return cart;
  } catch (e) {
    console.error("Error adding to cart:", e);
    return [];
  }
};

export const removeFromCart = (index) => {
  if (typeof window === "undefined") return;
  try {
    const cart = getCart();
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    return cart;
  } catch (e) {
    console.error("Error removing from cart:", e);
    return [];
  }
};

export const updateCartItem = (index, updates) => {
  if (typeof window === "undefined") return;
  try {
    const cart = getCart();
    if (cart[index]) {
      cart[index] = { ...cart[index], ...updates };
      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cartUpdated"));
    }
    return cart;
  } catch (e) {
    console.error("Error updating cart:", e);
    return [];
  }
};

export const clearCart = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("cart");
    window.dispatchEvent(new Event("cartUpdated"));
  } catch (e) {
    console.error("Error clearing cart:", e);
  }
};

export const getCartCount = () => {
  const cart = getCart();
  return cart.length;
};

