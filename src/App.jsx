import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { app, auth, db } from '/src/firebase.js';
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ProfilePage from "./pages/ProfileSettingsPage";
import LinkSettingsPage from "./pages/LinkSettingsPage";
import NotificationsPage from "./pages/NotificationsPage";
import DigitalCardEditor from "./pages/DigitalCardEditor";
import AnalyticsPage from "./pages/AnalyticsPage";
import ContactBookPage from "./pages/ContactBookPage";
import AdminDashboard from "./pages/AdminDashboard";
import PublicCardView from "./components/PublicCardView";
import SubscriptionPage from "./pages/SubscriptionPage";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} /> {/* Default route */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/NotificationsPage" element={<NotificationsPage />} />
        <Route path="/LinkSettingsPage" element={<LinkSettingsPage />} />
        <Route path="/ProfileSettingsPage" element={<ProfilePage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/contacts" element={<ContactBookPage />} />
        {/* Digital Card Editor (multi-card support) */}
        <Route path="/DigitalCardEditor" element={<DigitalCardEditor />} />
        <Route path="/DigitalCardEditor/:cardId" element={<DigitalCardEditor />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/card/:cardId" element={<PublicCardView />} />
    <Route path="/subscription" element={<SubscriptionPage />} />

        {/* Optionally, redirect lower-case "digital-card-editor" to PascalCase */}
        {/* <Route path="/digital-card-editor" element={<Navigate to="/DigitalCardEditor" />} /> */}
        {/* <Route path="/digital-card-editor/:cardId" element={<DigitalCardEditor />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
