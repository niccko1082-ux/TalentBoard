import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { VacanciesPage } from './pages/VacanciesPage';
import { VacancyFormPage } from './pages/VacancyFormPage';
import { VacancyDetailPage } from './pages/VacancyDetailPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { ApplicationDetailPage } from './pages/ApplicationDetailPage';
import { UsersPage } from './pages/UsersPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/vacancies" element={<VacanciesPage />} />
        <Route
          path="/vacancies/new"
          element={
            <ProtectedRoute roles={['ADMIN', 'RECRUITER']}>
              <VacancyFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vacancies/:id/edit"
          element={
            <ProtectedRoute roles={['ADMIN', 'RECRUITER']}>
              <VacancyFormPage />
            </ProtectedRoute>
          }
        />
        <Route path="/vacancies/:id" element={<VacancyDetailPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/applications/:id" element={<ApplicationDetailPage />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
