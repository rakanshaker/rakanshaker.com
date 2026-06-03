import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PhotoGrid from '../portfolio/components/PhotoGrid';
import Lightbox from '../portfolio/components/Lightbox';
import { fetchPhotos, isSanityConfigured } from '../portfolio/lib/sanity';
import '../portfolio/Portfolio.css';

const PortfolioPage = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isSanityConfigured) {
        setLoading(false);
        setError('missing-config');
        return;
      }

      try {
        const data = await fetchPhotos();
        if (!cancelled) {
          setPhotos(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError('fetch-failed');
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
  }, []);

  return (
    <div className="portfolio">
      <header className="portfolio-header">
        <h1>Rakan Shaker</h1>
        <p>Photography</p>
        <Link className="portfolio-header__link" to="/">
          rakanshaker.com
        </Link>
      </header>

      <main className="portfolio-main">
        {loading && <p className="gallery-status">Loading…</p>}

        {error === 'missing-config' && (
          <p className="gallery-status gallery-status--error">
            Set <code>REACT_APP_SANITY_PROJECT_ID</code> in <code>.env</code>{' '}
            to connect Sanity. See <code>studio/README.md</code>.
          </p>
        )}

        {error === 'fetch-failed' && (
          <p className="gallery-status gallery-status--error">
            Could not load photos. Check your Sanity project ID, dataset, and
            CORS settings.
            {process.env.NODE_ENV === 'development' && errorDetail && (
              <>
                <br />
                <small>{errorDetail}</small>
              </>
            )}
            <br />
            <small>
              In Sanity → API → CORS, add <code>http://localhost:3000</code>{' '}
              (and your production URLs). Then restart <code>npm start</code>.
            </small>
          </p>
        )}

        {!loading && !error && (
          <PhotoGrid photos={photos} onSelect={setSelected} />
        )}
      </main>

      <Lightbox photo={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default PortfolioPage;
