import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VideoGrid from './VideoGrid';
import { fetchVimeoOembed } from '../lib/vimeo';

jest.mock('../lib/vimeo');

const video = {
  _id: 'v1',
  title: 'My Reel',
  vimeoUrl: 'https://vimeo.com/123',
  caption: 'A caption',
};

afterEach(() => {
  jest.resetAllMocks();
});

test('shows the empty state when there are no videos', () => {
  render(<VideoGrid videos={[]} onSelect={() => {}} />);
  expect(screen.getByText(/no videos yet/i)).toBeInTheDocument();
});

test('renders a tile with the fetched thumbnail', async () => {
  fetchVimeoOembed.mockResolvedValue({
    thumbnail_url: 'https://i.vimeocdn.com/thumb.jpg',
    html: '<iframe title="My Reel"></iframe>',
  });

  render(<VideoGrid videos={[video]} onSelect={() => {}} />);

  const img = await screen.findByRole('img');
  expect(img).toHaveAttribute('src', 'https://i.vimeocdn.com/thumb.jpg');
});

test('clicking a tile calls onSelect with the video plus oembedHtml', async () => {
  fetchVimeoOembed.mockResolvedValue({
    thumbnail_url: 'https://i.vimeocdn.com/thumb.jpg',
    html: '<iframe title="My Reel"></iframe>',
  });
  const onSelect = jest.fn();

  render(<VideoGrid videos={[video]} onSelect={onSelect} />);

  const button = await screen.findByRole('button');
  fireEvent.click(button);

  expect(onSelect).toHaveBeenCalledWith({
    ...video,
    oembedHtml: '<iframe title="My Reel"></iframe>',
  });
});

test('omits a tile whose oEmbed request fails, without crashing', async () => {
  fetchVimeoOembed.mockRejectedValue(new Error('boom'));
  jest.spyOn(console, 'error').mockImplementation(() => {});

  render(<VideoGrid videos={[video]} onSelect={() => {}} />);

  await waitFor(() => {
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
