"use client";

import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";

export default function Header() {
  const navigationItems = [
    { name: "Store", href: "/store" },
    { name: "Mac", href: "/mac" },
    { name: "iPad", href: "/ipad" },
    { name: "iPhone", href: "/iphone" },
    { name: "Watch", href: "/watch" },
    { name: "AirPods", href: "/airpods" },
    { name: "Home", href: "/home" },
    { name: "Entertainment", href: "/entertainment" },
    { name: "Accessories", href: "/accessories" },
    { name: "Support", href: "/support" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FFFFFF] backdrop-blur-xl border-b border-white/10">
      <nav className="mx-auto max-w-[980px] px-6">
        <div className="flex h-11 items-center justify-between">
          {/* Apple Logo */}
          <Link
            href="/"
            className="flex items-center text-dark"
            aria-label="Homepage"
          >
            <svg
              width="16"
              height="20"
              viewBox="0 0 16 20"
              fill="currentColor"
              className="opacity-80"
            >
              <path d="M13.9681 9.6499C13.9469 7.3499 15.8431 6.2374 15.9306 6.1812C14.8656 4.6624 13.2206 4.4624 12.6494 4.4437C11.2744 4.3062 9.94313 5.2874 9.24438 5.2874C8.53313 5.2874 7.44563 4.4562 6.28313 4.4812C4.78313 4.5062 3.38938 5.3937 2.61438 6.7624C1.03313 9.5374 2.20813 13.6499 3.72063 15.9124C4.47063 17.0187 5.35813 18.2562 6.51813 18.2124C7.65563 18.1624 8.08813 17.4499 9.45563 17.4499C10.8106 17.4499 11.2181 18.2124 12.4056 18.1812C13.6294 18.1624 14.3906 17.0687 15.1156 15.9499C15.9806 14.6749 16.3244 13.4249 16.3369 13.3624C16.3056 13.3499 13.9931 12.4374 13.9681 9.6499ZM11.4556 2.9437C12.0644 2.2062 12.4869 1.1999 12.3681 0.1812C11.5119 0.2187 10.4556 0.7812 9.82063 1.5062C9.26063 2.1374 8.75188 3.1749 8.88313 4.1562C9.84563 4.2312 10.8344 3.6687 11.4556 2.9437Z" />
            </svg>
          </Link>

          {/* Navigation Links */}
          <ul className="flex items-center gap-8">
            {navigationItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="text-xs font-normal text-dark"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            <button
              aria-label="Search"
              className="text-dark"
            >
              <Search size={16} strokeWidth={1.5} />
            </button>
            <button
              aria-label="Shopping bag"
              className="text-dark"
            >
              <ShoppingBag size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
