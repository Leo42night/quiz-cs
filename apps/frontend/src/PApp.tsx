// Public Access (hanya akses pertanyaan, tidak ada Input data ke BE)
import './App.css';
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import TestQuestion from './pages/TestQuestion';

const router = createBrowserRouter([
    {
        path: "/test-question/:id",
        element: <TestQuestion />,
    },
    {
        path: "*",
        element: <Navigate to="/test-question/1" replace />,
    },
]);

const App = () => {
    return <RouterProvider router={router} />;
};

export default App;