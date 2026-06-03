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
        No photos yet. In Studio, create <strong>Photo upload (multiple)</strong>{' '}
        and drag files onto the Photos field, or add a single <strong>Photo</strong>,
        then publish. Run <code>cd studio</code> and <code>npm run dev</code> if
        needed (
        <a href="http://localhost:3333" target="_blank" rel="noopener noreferrer">
          localhost:3333
        </a>
        ).
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
