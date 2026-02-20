import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $cartCount, toggleSidebar, loadFromStorage } from "../stores/trip-cart";

export default function CartToggleButton() {
  const count = useStore($cartCount);

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <button
      onClick={toggleSidebar}
      className="relative inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
      </svg>
      My Trip
      {count > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
