import './App.css';
import KelolaSoal from '@/kelola_soal/Index';
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import QuestionPage from '@/pages/QuestionPages';
import MainLayout from '@/layouts/MainLayout';

// Ambil status env
const isDevelopment = import.meta.env.VITE_ENV === 'development';

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <QuestionPage />,
      }
    ],
  },
  // Rute Kelola Soal dengan Proteksi Environment
  {
    path: "kelola-soal",
    element: isDevelopment ? (
      <KelolaSoal />
    ) : (
      // Jika bukan production, arahkan ke Home atau tampilkan 404
      <Navigate to="/" replace /> 
    ),
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;