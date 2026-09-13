import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PhotoGrid from "../portfolio/components/PhotoGrid";
import Lightbox from "../portfolio/components/Lightbox";
import VideoGrid from "../portfolio/components/VideoGrid";
import VideoLightbox from "../portfolio/components/VideoLightbox";
import { fetchPhotos, fetchVideos, isSanityConfigured } from "../portfolio/lib/sanity";
import "../portfolio/Portfolio.css";

function useSanityCollection(fetcher) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isSanityConfigured) {
        setLoading(false);
        setError("missing-config");
        return;
      }

      try {
        const data = await fetcher();
        if (!cancelled) {
          setItems(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError("fetch-failed");
          setErrorDetail(err?.message || String(err));
          console.error(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fetcher]);

  return { items, loading, error, errorDetail };
}

function GalleryStatus({ loading, error, errorDetail }) {
  if (loading) {
    return <p className="gallery-status">Loading…</p>;
  }

  if (error === "missing-config") {
    return (
      <p className="gallery-status gallery-status--error">
        Set <code>REACT_APP_SANITY_PROJECT_ID</code> in <code>.env</code> to
        connect Sanity. See <code>studio/README.md</code>.
      </p>
    );
  }

  if (error === "fetch-failed") {
    return (
      <p className="gallery-status gallery-status--error">
        Could not load content. In{" "}
        <a
          href="https://www.sanity.io/manage/project/fnbgcar3/api"
          target="_blank"
          rel="noopener noreferrer"
        >
          Sanity → API → CORS origins
        </a>
        , add this exact origin (credentials <strong>off</strong>):{" "}
        <code>{window.location.origin}</code>. If visitors use both www and
        non-www, add both origins.
        {errorDetail && (
          <>
            <br />
            <small>{errorDetail}</small>
          </>
        )}
        {process.env.NODE_ENV === "development" && (
          <>
            <br />
            <small>After saving CORS, restart npm start.</small>
          </>
        )}
      </p>
    );
  }

  return null;
}

const PortfolioPage = () => {
  const [activeTab, setActiveTab] = useState("photos");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const photos = useSanityCollection(fetchPhotos);
  const videos = useSanityCollection(fetchVideos);

  return (
    <div className="portfolio">
      <header className="portfolio-header">
        <h1>Rakan Shaker</h1>
        <p>Creative</p>
        <Link className="portfolio-header__link" to="/">
          rakanshaker.com
        </Link>
      </header>

      <div className="portfolio-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "photos"}
          className={`portfolio-tabs__button${
            activeTab === "photos" ? " portfolio-tabs__button--active" : ""
          }`}
          onClick={() => setActiveTab("photos")}
        >
          Photos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "videos"}
          className={`portfolio-tabs__button${
            activeTab === "videos" ? " portfolio-tabs__button--active" : ""
          }`}
          onClick={() => setActiveTab("videos")}
        >
          Videos
        </button>
      </div>

      <main className="portfolio-main">
        {activeTab === "photos" ? (
          <>
            <GalleryStatus {...photos} />
            {!photos.loading && !photos.error && (
              <PhotoGrid photos={photos.items} onSelect={setSelectedPhoto} />
            )}
          </>
        ) : (
          <>
            <GalleryStatus {...videos} />
            {!videos.loading && !videos.error && (
              <VideoGrid videos={videos.items} onSelect={setSelectedVideo} />
            )}
          </>
        )}
      </main>

      <Lightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      <VideoLightbox video={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </div>
  );
};

export default PortfolioPage;
