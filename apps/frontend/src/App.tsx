import './App.css';
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import QuestionPage from '@/pages/QuestionPages';
import MainLayout from '@/layouts/MainLayout';
import TestQuestion from '@/pages/TestQuestion';
import KelolaSoalLayout from '@/kelola_soal/Index';
import DaftarSoalPage from './kelola_soal/page/DaftarSoalPage';
import FormPage from './kelola_soal/page/FormPage';
import ExportCurlPage from './kelola_soal/page/ExportCurlPage';
import HomePage from './pages/HomePage';

// Ambil status env
const isDevelopment = import.meta.env.VITE_ENV === 'development';

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "question",
        element: <QuestionPage />,
      }
    ],
  },
  // Rute Kelola Soal dengan Proteksi Environment
  {
    path: "kelola-soal",
    element: isDevelopment ? <KelolaSoalLayout /> : <Navigate to="/" replace />,
    children: [
      { index: true, element: <DaftarSoalPage /> },
      { path: "new", element: <FormPage /> },
      { path: ":id", element: <FormPage /> },
      { path: "curl", element: <ExportCurlPage /> },
    ],
  },
  {
    // tanda ? berati opsional
    path: "test-question/:id?",
    element: isDevelopment ? (
      <TestQuestion />
    ) : (
      // Jika bukan production, arahkan ke Home atau tampilkan 404
      <Navigate to="/" replace />
    ),
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);

function App() {
  // add data user
  return <RouterProvider router={router} />;
}

export default App;