import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import RaceCondition from "./pages/RaceCondition";
import ProducerConsumer from "./pages/ProducerConsumer";
import DiningPhilosophers from "./pages/DiningPhilosophers";
import ReadersWriters from "./pages/ReadersWriters";
import Results from "./pages/Results";
import "./styles/global.css";
import "./styles/problem-pages.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="app-main">
          <Navbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/race-condition" element={<RaceCondition />} />
            <Route path="/producer-consumer" element={<ProducerConsumer />} />
            <Route path="/dining-philosophers" element={<DiningPhilosophers />} />
            <Route path="/readers-writers" element={<ReadersWriters />} />
            <Route path="/results" element={<Results />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
