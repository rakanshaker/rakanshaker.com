import { useEffect, useCallback } from 'react';

const Lightbox = ({ photo, onClose }) => {
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  if (!photo) {
    return null;
  }

  const label = photo.title || photo.alt;

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={label ? `Photo: ${label}` : 'Photo viewer'}
      onClick={onClose}
    >
      <button
        type="button"
        className="lightbox__close"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
      <figure
        className="lightbox__figure"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          className="lightbox__image"
          src={photo.fullUrl}
          alt={photo.alt || photo.title || ''}
        />
        {(photo.title || photo.caption) && (
          <figcaption className="lightbox__caption">
            {photo.title && <strong>{photo.title}</strong>}
            {photo.caption && <span>{photo.caption}</span>}
          </figcaption>
        )}
      </figure>
    </div>
  );
};

export default Lightbox;
