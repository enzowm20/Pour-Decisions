import { BrowserRouter, Routes, Route } from "react-router-dom"
import { DataProvider } from "./context/DataContext"
import StaffGate from "./components/StaffGate"
import Layout from "./components/Layout"
import HomePage from "./pages/HomePage"
import StockPage from "./pages/StockPage"
import VenuesPage from "./pages/VenuesPage"
import VenueDetailPage from "./pages/VenueDetailPage"
import ExperimentLabPage from "./pages/ExperimentLabPage"
import ArchivePage from "./pages/ArchivePage"
import MyMenuPage from "./pages/MyMenuPage"
import PublicMenuPage from "./pages/PublicMenuPage"

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          {/* Staff-only — gated behind a password screen. */}
          <Route element={<StaffGate />}>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/stock" element={<StockPage />} />
              <Route path="/venues" element={<VenuesPage />} />
              <Route path="/venues/:venueId" element={<VenueDetailPage />} />
              <Route path="/lab" element={<ExperimentLabPage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/menu" element={<MyMenuPage />} />
            </Route>
          </Route>

          {/* Public — no password, no staff nav, view-only. */}
          <Route path="/public-menu" element={<PublicMenuPage />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  )
}
