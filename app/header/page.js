"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Container from "../container";
import { getCartCount } from "@/lib/utils/cart";
import { getWishlistCount } from "@/lib/utils/wishlist";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Check if a link is active
  const isActive = (path) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  useEffect(() => {
    // Check if user is logged in
    const checkUser = () => {
      if (typeof window !== "undefined") {
        const userData = localStorage.getItem("user");
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            // Only fetch coupons for users with type "user"
            if (parsedUser.type === "user") {
              fetchAvailableCoupons();
            } else {
              setAvailableCoupons([]);
            }
          } catch (e) {
            console.error("Error parsing user data:", e);
          }
        } else {
          setUser(null);
          setAvailableCoupons([]);
        }
      }
    };

    // Check on mount
    checkUser();

    // Listen for storage changes (when user logs in/out)
    window.addEventListener("storage", checkUser);
    
    // Also listen for custom event for same-tab updates
    window.addEventListener("userUpdated", checkUser);

    return () => {
      window.removeEventListener("storage", checkUser);
      window.removeEventListener("userUpdated", checkUser);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Update cart and wishlist counts
  useEffect(() => {
    const updateCounts = () => {
      setCartCount(getCartCount());
      setWishlistCount(getWishlistCount());
    };

    updateCounts();
    window.addEventListener("cartUpdated", updateCounts);
    window.addEventListener("wishlistUpdated", updateCounts);

    return () => {
      window.removeEventListener("cartUpdated", updateCounts);
      window.removeEventListener("wishlistUpdated", updateCounts);
    };
  }, []);

  const fetchAvailableCoupons = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/coupons", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.coupons) {
        // Filter only available (not used, not expired) coupons
        const now = new Date();
        const available = data.coupons.filter((coupon) => {
          if (coupon.isUsed) return false;
          if (coupon.expiresAt && new Date(coupon.expiresAt) < now) return false;
          return true;
        });
        setAvailableCoupons(available);
      }
    } catch (err) {
      console.error("Error fetching coupons:", err);
    }
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => {
        setCopiedCode(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setAvailableCoupons([]);
    // Dispatch event to update header
    window.dispatchEvent(new Event("userUpdated"));
    router.push("/");
  };

  const navLinks =
    user && user.type === "admin"
      ? [{ href: "/dashboard", label: "Dashboard" }]
      : [
          { href: "/category/cake", label: "Cakes" },
          { href: "/category/pastry", label: "Pastry" },
          { href: "/blog", label: "Blogs" },
        ];

  const userLinks = [
    { href: "/dashboard", label: "Dashboard" },
    ...(user?.type === "user"
      ? [
          { href: "/orders", label: "Orders" },
          { href: "/wishlist", label: "Wishlist" },
        ]
      : []),
    { href: "/profile", label: "Profile" },
  ];

  return (
    <>
      {/* Coupon Messages Banner at Top */}
      {availableCoupons.length > 0 && (
        <div className="bg-gradient-to-r from-[#D2B48C] to-[#C19A6B] py-2 shadow-md">
          <Container>
            <div className="flex flex-wrap items-center justify-center gap-2 text-center">
              {availableCoupons.map((coupon) => (
                <div
                  key={coupon._id}
                  className="flex items-center gap-2 rounded-full bg-white/90 sm:px-4 py-1 sm:text-sm text-xs px-2 sm:font-semibold font-medium text-[#5b3a29] shadow-sm"
                >
                  <span className="text-[#8B4513] text-sm ">🎉</span>
                  <span className="hidden sm:flex">{coupon.message}</span>
                  <span className="sm:font-bold font-semibold text-[#8B4513]">
                    Code: {coupon.code} - {coupon.discountPercent}% OFF
                  </span>
                  <button
                    onClick={() => handleCopyCode(coupon.code)}
                    className="ml-2 rounded p-1 text-[#8B4513] hover:bg-[#8B4513] hover:text-white transition-colors"
                    title={copiedCode === coupon.code ? "Copied!" : "Copy coupon code"}
                  >
                    {copiedCode === coupon.code ? (
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
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
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </Container>
        </div>
      )}
<header
  className="sticky top-0 z-20 text-[#5b3a29] shadow-md"
  style={{
    backgroundImage:
      "linear-gradient(rgba(255,244,234,0.85), rgba(255,244,234,0.85)), url('/headerbg.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}
>

        <Container>
        <div className="flex items-center justify-between py-3 md:py-4 gap-3">
          {/* Left - Logo */}
       <Link href="/" className="flex items-center">
  <img
    src="/cakelogo.png"
    alt="Crazy Cakes Logo"
    className="w-[80px] sm:w-[90px] md:w-[100px] h-auto"
  />
</Link>


          {/* Middle - Nav */}
          <nav className="hidden gap-6 text-sm sm:text-md lg:space-x-4 sm:space-x-2 md:space-x-3 lg:text-lg xl:text-xl  font-medium md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative transition pb-1 ${
                  isActive(link.href)
                    ? "text-[#8B4513] font-semibold"
                    : "text-[#5b3a29] hover:text-[#3e261a]"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B4513]"></span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right - User (email prefix) or Login button */}
          <div className="flex items-center gap-2.5 md:gap-4">
            {/* Hamburger for mobile */}
            <button
              className="flex items-center justify-center border-2 border-[#5b3a29] rounded-md  p-1 sm:p-2 text-[#5b3a29] md:hidden hover:bg-[#fff4ea]"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {user ? (
              <>
              <div className="flex md:hidden items-center gap-3">
                {user.type === "user" && (
                  <>
                    <Link
                      href="/cart"
                      className="relative flex items-center justify-center rounded-full border-2 border-[#5b3a29]  p-2 text-[#5b3a29] hover:bg-[#fff4ea]"
                      title="Cart"
                    > 
                      <svg className="h-3 w-3 sm:h-5 sm:w-5 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {cartCount > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-[#5b3a29] text-[9px] sm:text-[10px] font-bold text-white">
                          {cartCount > 99 ? "99+" : cartCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/wishlist"
                      className="relative flex items-center justify-center rounded-full  border-2 border-[#5b3a29] p-2 text-[#5b3a29] hover:bg-[#fff4ea]"
                      title="Wishlist"
                    >
                      <svg className="h-3 w-3 sm:h-5 sm:w-5 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {wishlistCount > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-[#5b3a29] text-[9px] sm:text-[10px] font-bold text-white">
                          {wishlistCount > 99 ? "99+" : wishlistCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
              </div>
              <div className="relative hidden md:flex items-center gap-4">
                {/* Cart Icon - Only for regular users */}
                {user.type === "user" && (
                  <Link
                    href="/cart"
                    className="relative flex items-center  justify-center text-[#5b3a29] transition hover:text-[#3e261a]"
                    title="Shopping Cart"
                  >
                    <svg
                      className="h-4 w-4 sm:h-6 sm:w-6 xl:h-7 xl:w-7 "
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    {cartCount > 0 && (
                      <span className="absolute -right-1.5 sm:-right-2 -top-1.5 sm:-top-2 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-[#5b3a29] text-[10px] sm:text-xs font-bold text-white">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Wishlist Icon - Only for regular users */}
                {user.type === "user" && (
                  <Link
                    href="/wishlist"
                    className="relative flex items-center justify-center text-[#5b3a29] transition hover:text-[#3e261a]"
                    title="Wishlist"
                  >
                    <svg
                      className="h-5 w-5 sm:h-6 sm:w-6  xl:h-7 xl:w-7"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    {wishlistCount > 0 && (
                      <span className="absolute -right-1.5 sm:-right-2 -top-1.5 sm:-top-2 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-[#5b3a29] text-[10px] sm:text-xs font-bold text-white">
                        {wishlistCount > 99 ? "99+" : wishlistCount}
                      </span>
                    )}
                  </Link>
                )}

                <div className="group relative flex items-center gap-2">
                  {user.type === "admin" && (
                    <span className="rounded-full bg-[#5b3a29] px-2 py-1 text-xs font-semibold text-white">
                      Admin
                    </span>
                  )}<div className="cursor-pointer flex items-center gap-2 transition">
  {user?.photo?.url ? (
    <img
      src={user.photo.url}
      alt={user.name || "User"}
      className="h-8 w-8 rounded-full object-cover border-2 border-[#5b3a29]"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  ) : (
    <div className="h-8 w-8 rounded-full bg-[#5b3a29] flex items-center justify-center border-2 border-[#5b3a29]">
      <span className="text-xs font-semibold text-white">
        {user?.name
          ? user.name.charAt(0).toUpperCase()
          : user?.email
          ? user.email.charAt(0).toUpperCase()
          : "U"}
      </span>
    </div>
  )}

  <span className="text-sm font-medium text-[#5b3a29] hover:text-[#3e261a]">
    {user?.name
      ? user.name.split(" ")[0]
      : user?.email
      ? user.email.split("@")[0]
      : "User"}
  </span>
</div>


                  {/* Hover dropdown with Dashboard, Orders, Profile, and Logout */}
                  <div className="invisible absolute right-0 top-full w-44 rounded-lg border border-[#f1e4d8] bg-white py-1 text-sm shadow-lg opacity-0 transition group-hover:visible group-hover:opacity-100">
                    {userLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block w-full px-3 py-2 text-left text-[#5b3a29] hover:bg-[#fff4ea]"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <button
                      onClick={handleLogout}
                      className="block w-full px-3 py-2 text-left text-[#5b3a29] hover:bg-[#fff4ea]"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
              </>
            ) : (
              <Link
                href="/login"
                className="hidden md:inline-flex rounded-full bg-[#5b3a29] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3e261a]"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileOpen && (
          <div className="md:hidden animate-in fade-in slide-in-from-top-2">
            <div className="mt-2 rounded-lg border border-[#f1e4d8] bg-white shadow-lg">
              <div className="flex flex-col divide-y divide-[#f1e4d8]">
                <div className="px-4 py-3 space-y-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block rounded-md px-3 py-2 text-sm font-medium ${
                        isActive(link.href) ? "bg-[#fff4ea] text-[#8B4513]" : "text-[#5b3a29] hover:bg-[#fff4ea]"
                      }`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                {user ? (
                  <>
                  
                    <div className="px-4 py-3 space-y-2">
                      {userLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="block rounded-md px-3 py-2 text-sm font-medium text-[#5b3a29] hover:bg-[#fff4ea]"
                          onClick={() => setMobileOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileOpen(false);
                        }}
                        className="w-full rounded-md bg-[#5b3a29] px-3 py-2 text-sm font-semibold text-white hover:bg-[#3e261a]"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-3">
                    <Link
                      href="/login"
                      className="block rounded-md bg-[#5b3a29] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-[#3e261a]"
                      onClick={() => setMobileOpen(false)}
                    >
                      Login
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Container>
    </header>
    </>
  );
};

export default Header;
