import { useEffect, useState } from 'react';
import { fetchVimeoOembed } from '../lib/vimeo';

const VideoTile = ({ video, onSelect }) => {
  const [oembed, setOembed] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchVimeoOembed(video.vimeoUrl)
      .then((data) => {
        if (!cancelled) {
          setOembed(data);
        }
      })
      .catch((err) => {
        console.error(`Failed to load Vimeo oEmbed for ${video.vimeoUrl}`, err);
      });

    return () => {
      cancelled = true;
    };
  }, [video.vimeoUrl]);

  if (!oembed) {
    return null;
  }

  return (
    <li className="video-grid__item">
      <button
        type="button"
        className="video-grid__button"
        onClick={() => onSelect({ ...video, oembedHtml: oembed.html })}
        aria-label={video.title || 'Play video'}
      >
        <img
          src={oembed.thumbnail_url}
          alt=""
          loading="lazy"
          decoding="async"
        />
        <span className="video-grid__play" aria-hidden="true" />
      </button>
    </li>
  );
};

const VideoGrid = ({ videos, onSelect }) => {
  if (videos.length === 0) {
    return (
      <p className="gallery-empty">
        No videos yet. In Studio, create a <strong>Video</strong> document with a
        Vimeo link, then publish.
      </p>
    );
  }

  return (
    <ul className="video-grid">
      {videos.map((video) => (
        <VideoTile key={video._id} video={video} onSelect={onSelect} />
      ))}
    </ul>
  );
};

export default VideoGrid;
