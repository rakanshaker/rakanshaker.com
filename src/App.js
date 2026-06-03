import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PortfolioPage from './pages/PortfolioPage';

const isPortfolioHost = () =>
  window.location.hostname.startsWith('portfolio.');

const App = () => {
  if (isPortfolioHost()) {
    return <PortfolioPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
