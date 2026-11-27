import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import "./index.css";
import { token } from "./lib/api";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/Login";
import { DashboardPage } from "./pages/Dashboard";
import { EnquiriesPage } from "./pages/Enquiries";
import { HomesPage } from "./pages/Homes";
import { CalendarPage } from "./pages/Calendar";
import { HolidaysPage } from "./pages/Holidays";
import { ImagesPage } from "./pages/Images";
import { LocationsPage } from "./pages/Locations";
import { MessagesPage } from "./pages/Messages";

function RequireAuth({ children }: { children: React.ReactNode }) {
  return token.get() ? children : <Navigate to="/login" replace />;
}

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "enquiries", element: <EnquiriesPage /> },
      { path: "homes", element: <HomesPage /> },
      { path: "locations", element: <LocationsPage /> },
      { path: "calendar", element: <CalendarPage /> },
      { path: "holidays", element: <HolidaysPage /> },
      { path: "messages", element: <MessagesPage /> },
      { path: "images", element: <ImagesPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
