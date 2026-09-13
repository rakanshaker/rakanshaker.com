import { render, screen, fireEvent } from '@testing-library/react';
import VideoLightbox from './VideoLightbox';

const video = {
  title: 'My Reel',
  caption: 'A caption',
  oembedHtml: '<iframe data-testid="vimeo-frame" title="My Reel"></iframe>',
};

afterEach(() => {
  document.body.style.overflow = '';
});

test('renders nothing when video is null', () => {
  const { container } = render(<VideoLightbox video={null} onClose={() => {}} />);
  expect(container).toBeEmptyDOMElement();
});

test('renders the oEmbed html, title, and caption', () => {
  render(<VideoLightbox video={video} onClose={() => {}} />);

  expect(screen.getByTestId('vimeo-frame')).toBeInTheDocument();
  expect(screen.getByText('My Reel')).toBeInTheDocument();
  expect(screen.getByText('A caption')).toBeInTheDocument();
});

test('pressing Escape calls onClose', () => {
  const onClose = jest.fn();
  render(<VideoLightbox video={video} onClose={onClose} />);

  fireEvent.keyDown(window, { key: 'Escape' });

  expect(onClose).toHaveBeenCalledTimes(1);
});

test('clicking the overlay calls onClose, clicking the figure does not', () => {
  const onClose = jest.fn();
  render(<VideoLightbox video={video} onClose={onClose} />);

  fireEvent.click(screen.getByTestId('vimeo-frame'));
  expect(onClose).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('dialog'));
  expect(onClose).toHaveBeenCalledTimes(1);
});
