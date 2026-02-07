import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Train } from "./pages/Train";
import { Analytics } from "./pages/Analytics";
import { Awards } from "./pages/Awards";
import { Splits } from "./pages/Splits";
import { Profile } from "./pages/Profile";
import { Leaderboard } from "./pages/Leaderboard";
import { Onboarding } from "./pages/Onboarding";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Onboarding - outside main layout */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Main app layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="train" element={<Train />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="awards" element={<Awards />} />
          <Route path="splits" element={<Splits />} />
          <Route path="profile" element={<Profile />} />
          <Route path="leaderboard" element={<Leaderboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

