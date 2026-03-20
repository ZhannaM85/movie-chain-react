import { Routes, Route } from 'react-router-dom';
import { MovieApiProvider } from './context/MovieApiContext';
import { ChainProvider } from './context/ChainContext';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import MovieDetailPage from './pages/MovieDetailPage';
import ActorDetailPage from './pages/ActorDetailPage';
import ChainPage from './pages/ChainPage';
import AboutPage from './pages/AboutPage';

/**
 * Root application component that wires up providers, layout, and routes.
 *
 * @returns {JSX.Element} The routed application tree.
 */
function App() {
  return (
    <MovieApiProvider>
      <ChainProvider>
        <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chain" element={<ChainPage />} />
          <Route path="/movie/:id" element={<MovieDetailPage />} />
          <Route path="/actor/:id" element={<ActorDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Layout>
    </ChainProvider>
    </MovieApiProvider>
  );
}

export default App;
