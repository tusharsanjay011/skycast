/**
 * Displays saved favourite cities as clickable chips on the home screen.
 * Clicking a chip loads that city's weather; clicking × removes it.
 */
export default function Favourites({
  favourites,
  activeCityId,
  onSelectCity,
  onRemoveCity,
}) {
  if (!favourites || favourites.length === 0) {
    return (
      <section className="favourites-bar" aria-label="Favourite locations">
        <p className="favourites-empty">
          ★ Star any city to save it here for one-click access.
        </p>
      </section>
    );
  }

  return (
    <section className="favourites-bar" aria-label="Favourite locations">
      <span className="favourites-label">Favourites:</span>
      <div className="favourites-chips">
        {favourites.map((city) => {
          const isActive = city.id === activeCityId;
          return (
            <div
              key={city.id}
              className={`fav-chip ${isActive ? "is-active" : ""}`}
            >
              <button
                type="button"
                className="fav-chip-select"
                onClick={() => onSelectCity(city)}
                aria-current={isActive ? "location" : undefined}
              >
                <span aria-hidden="true">★</span>
                <span>{city.name}</span>
                {city.country && (
                  <span className="fav-chip-country">{city.country}</span>
                )}
              </button>
              <button
                type="button"
                className="fav-chip-remove"
                onClick={() => onRemoveCity(city.id)}
                aria-label={`Remove ${city.name} from favourites`}
                title={`Remove ${city.name}`}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

