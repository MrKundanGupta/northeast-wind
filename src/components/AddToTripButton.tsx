import { useStore } from "@nanostores/react";
import {
  $cartItems,
  addToCart,
  removeFromCart,
  type CartPlace,
} from "../stores/trip-cart";
import { $activeTrip, addPlaceToActiveTrip } from "../stores/trip-planner";

interface Props {
  place: CartPlace;
}

export default function AddToTripButton({ place }: Props) {
  const items = useStore($cartItems);
  const activeTrip = useStore($activeTrip);
  const inCart = items.some((p) => p.id === place.id);

  // Check if this place is already in the active trip's itinerary
  const inTrip = activeTrip
    ? activeTrip.days.some(d => d.activities.some(a => a.placeId === place.id))
    : false;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (activeTrip) {
      // Active trip exists — add/indicate already in itinerary
      if (!inTrip) {
        addPlaceToActiveTrip({
          id: place.id,
          name: place.name,
          category: place.category,
          state: place.state,
          googleRating: place.googleRating,
          image: place.image,
        });
      }
    } else {
      // No active trip — use cart as before
      if (inCart) {
        removeFromCart(place.id);
      } else {
        addToCart(place);
      }
    }
  }

  const isActive = activeTrip ? inTrip : inCart;

  return (
    <button
      onClick={handleClick}
      aria-label={isActive ? "Added to trip" : (activeTrip ? "Add to trip itinerary" : "Add to trip")}
      title={activeTrip ? (inTrip ? "Already in itinerary" : "Add to current trip") : (inCart ? "Remove from saved" : "Save place")}
      className={`absolute top-3 right-12 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition ${
        isActive
          ? "bg-emerald-600 text-white hover:bg-emerald-700"
          : "bg-white/90 text-gray-600 hover:bg-white hover:text-emerald-700"
      }`}
    >
      {isActive ? (
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
