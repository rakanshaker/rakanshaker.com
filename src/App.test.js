import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the home page', () => {
  render(<App />);
  const nameElement = screen.getByText(/rakan shaker/i);
  expect(nameElement).toBeInTheDocument();
});
