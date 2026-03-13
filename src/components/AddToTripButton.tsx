import { useStore } from "@nanostores/react";
import {
  $cartItems,
  addToCart,
  removeFromCart,
  type CartPlace,
} from "../stores/trip-cart";

interface Props {
  place: CartPlace;
}

export default function AddToTripButton({ place }: Props) {
  const items = useStore($cartItems);
  const inCart = items.some((p) => p.id === place.id);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) {
      removeFromCart(place.id);
    } else {
      addToCart(place);
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label={inCart ? "Remove from trip" : "Add to trip"}
      className={`absolute top-3 right-12 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition ${
        inCart
          ? "bg-emerald-600 text-white hover:bg-emerald-700"
          : "bg-white/90 text-gray-600 hover:bg-white hover:text-emerald-700"
      }`}
    >
      {inCart ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      )}
    </button>
  );
}
