import { Routes, Route } from 'react-router-dom';
import { ChainProvider } from './context/ChainContext';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import MovieDetailPage from './pages/MovieDetailPage';
import ActorDetailPage from './pages/ActorDetailPage';
import ChainPage from './pages/ChainPage';

function App() {
  return (
    <ChainProvider>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chain" element={<ChainPage />} />
          <Route path="/movie/:id" element={<MovieDetailPage />} />
          <Route path="/actor/:id" element={<ActorDetailPage />} />
        </Routes>
      </Layout>
    </ChainProvider>
  );
}

export default App;
