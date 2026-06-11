// Public Access (hanya akses pertanyaan, tidak ada Input data ke BE)
import './App.css';
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import TestQuestion from './pages/TestQuestion';

const router = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/1" replace />,
    },
    {
        path: "/:id",
        element: <TestQuestion />,
    },
]);

const App = () => {
    return <RouterProvider router={router} />;
};

export default App;