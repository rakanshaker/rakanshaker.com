import { urlFor } from '../lib/sanity';

function gridImageUrl(image) {
  return urlFor(image).width(800).height(800).fit('crop').auto('format').url();
}

function fullImageUrl(image) {
  return urlFor(image).width(2400).auto('format').url();
}

const PhotoGrid = ({ photos, onSelect }) => {
  if (photos.length === 0) {
    return (
      <p className="gallery-empty">
        No photos yet. In a second terminal, run{' '}
        <code>cd studio</code> then <code>npm run dev</code>, open{' '}
        <a href="http://localhost:3333" target="_blank" rel="noopener noreferrer">
          localhost:3333
        </a>
        , create <strong>Photo</strong> documents, and publish them. Refresh this
        page.
      </p>
    );
  }

  return (
    <ul className="photo-grid">
      {photos.map((photo) => (
        <li key={photo._id} className="photo-grid__item">
          <button
            type="button"
            className="photo-grid__button"
            onClick={() =>
              onSelect({
                ...photo,
                fullUrl: fullImageUrl(photo.image),
              })
            }
            aria-label={photo.alt || photo.title || 'View photo'}
          >
            <img
              src={gridImageUrl(photo.image)}
              alt={photo.alt || photo.title || ''}
              loading="lazy"
              decoding="async"
            />
          </button>
        </li>
      ))}
    </ul>
  );
};

export default PhotoGrid;
