import { useStore } from "@nanostores/react";
import { $favouriteIds, toggleFavourite, type FavouritePlace } from "../stores/favourites";

interface Props {
  place: FavouritePlace;
}

export default function FavouriteButton({ place }: Props) {
  const ids  = useStore($favouriteIds);
  const isFav = ids.has(place.id);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleFavourite(place);
  }

  return (
    <button
      onClick={handleClick}
      aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
      className={`absolute top-3 right-12 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition ${
        isFav
          ? "bg-rose-500 text-white hover:bg-rose-600"
          : "bg-white/90 text-gray-400 hover:bg-white hover:text-rose-500"
      }`}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>
  );
}
