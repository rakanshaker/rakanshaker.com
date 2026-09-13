import { useEffect, useCallback } from 'react';

const VideoLightbox = ({ video, onClose }) => {
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

  if (!video) {
    return null;
  }

  const label = video.title;

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={label ? `Video: ${label}` : 'Video player'}
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
        className="lightbox__figure video-lightbox__figure"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="video-lightbox__player"
          dangerouslySetInnerHTML={{ __html: video.oembedHtml }}
        />
        {(video.title || video.caption) && (
          <figcaption className="lightbox__caption">
            {video.title && <strong>{video.title}</strong>}
            {video.caption && <span>{video.caption}</span>}
          </figcaption>
        )}
      </figure>
    </div>
  );
};

export default VideoLightbox;
