import './App.css';
import KelolaSoal from '@/kelola_soal/Index';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import QuestionPage from './pages/QuestionPages';
import MainLayout from '@/layouts/MainLayout';
// import ViewQuestionPage from './pages/ViewQuestionPage';

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />, // Layout utama
    children: [
      {
        index: true, // Ini akan muncul di path "/"
        element: <QuestionPage />,
      },
      {
        path: "kelola-soal",
        element: <KelolaSoal />,
      },
      // {
      //   path: "view-question/:id",
      //   element: <ViewQuestionPage />,
      // },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;