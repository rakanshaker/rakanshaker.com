import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PortfolioPage from './PortfolioPage';
import { fetchPhotos, fetchVideos } from '../portfolio/lib/sanity';
import { fetchVimeoOembed } from '../portfolio/lib/vimeo';

jest.mock('../portfolio/lib/sanity');
jest.mock('../portfolio/lib/vimeo');

function renderPage() {
  return render(
    <MemoryRouter>
      <PortfolioPage />
    </MemoryRouter>
  );
}

afterEach(() => {
  jest.resetAllMocks();
});

test('defaults to the Photos tab and loads photos', async () => {
  Object.defineProperty(require('../portfolio/lib/sanity'), 'isSanityConfigured', { value: true });
  fetchPhotos.mockResolvedValue([]);
  fetchVideos.mockResolvedValue([]);

  renderPage();

  expect(screen.getByRole('tab', { name: /photos/i })).toHaveAttribute('aria-selected', 'true');
  await waitFor(() => expect(fetchPhotos).toHaveBeenCalled());
});

test('switching to the Videos tab loads and shows videos', async () => {
  Object.defineProperty(require('../portfolio/lib/sanity'), 'isSanityConfigured', { value: true });
  fetchPhotos.mockResolvedValue([]);
  fetchVideos.mockResolvedValue([
    { _id: 'v1', title: 'Reel', vimeoUrl: 'https://vimeo.com/1', caption: '' },
  ]);
  fetchVimeoOembed.mockResolvedValue({
    thumbnail_url: 'https://i.vimeocdn.com/thumb.jpg',
    html: '<iframe title="Reel"></iframe>',
  });

  renderPage();

  fireEvent.click(screen.getByRole('tab', { name: /videos/i }));

  await waitFor(() => expect(fetchVideos).toHaveBeenCalled());
  expect(screen.getByRole('tab', { name: /videos/i })).toHaveAttribute('aria-selected', 'true');
});
