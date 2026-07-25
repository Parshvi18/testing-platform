import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import InkFilterDefs from "./components/InkFilterDefs";
import SubmitPage from "./pages/SubmitPage";
import DashboardPage from "./pages/DashboardPage";
import WallPage from "./pages/WallPage";

function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <span className="brand">
          testimonial<span className="brand-mark">.</span>desk
        </span>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Share a story
          </NavLink>
          <NavLink to="/wall" className={({ isActive }) => (isActive ? "active" : "")}>
            The wall
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
            Review desk
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <InkFilterDefs />
      <TopBar />
      <Routes>
        <Route path="/" element={<SubmitPage />} />
        <Route path="/wall" element={<WallPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
