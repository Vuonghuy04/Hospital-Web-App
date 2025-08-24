import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RecordPage from './pages/RecordPage';
import JITRequestPage from './pages/JITRequestPage';
import JITRequestable from './pages/JITRequestable';
import DatabaseViewerPage from './pages/DatabaseViewerPage';
import { AuthProvider } from './contexts/MockAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AnalyticsDashboard from './components/AnalyticsDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="/records/:id" element={
            <ProtectedRoute>
              <RecordPage />
            </ProtectedRoute>
          } />
          <Route path="/jit-request" element={
            <ProtectedRoute>
              <JITRequestPage />
            </ProtectedRoute>
          } />
          <Route path="/jit-requestable" element={
            <ProtectedRoute>
              <JITRequestable />
            </ProtectedRoute>
          } />
          <Route path="/database" element={
            <ProtectedRoute>
              <DatabaseViewerPage />
            </ProtectedRoute>
          } />
        </Routes>
        <AnalyticsDashboard />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
