import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register"; // make sure this file exists
import { app, auth, db } from '/src/firebase.js';
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ProfilePage from "./pages/ProfileSettingsPage";
import LinkSettingsPage from "./pages/LinkSettingsPage"; // make sure this file exists
import NotificationsPage from "./pages/NotificationsPage"; // make sure this file exists
import DigitalCardEditor from "./pages/DigitalCardEditor"; // make sure this file exists



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />         {/* default route */}
        <Route path="/login" element={<Login />} />    {/* login route */}
        <Route path="/register" element={<Register />} /> {/* register route */}
        <Route path="/dashboard" element={<Dashboard />} /> {/* register route */}
        <Route path="/NotificationsPage" element={<NotificationsPage />} />
        <Route path="/LinkSettingsPage" element={<LinkSettingsPage />} />
        <Route path="/ProfileSettingsPage" element={<ProfilePage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
       
        <Route path="/DigitalCardEditor" element={< DigitalCardEditor/>} />
      </Routes>
    </Router>
  );
}

export default App;



