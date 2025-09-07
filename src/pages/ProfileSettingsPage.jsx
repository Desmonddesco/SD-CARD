import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { sendPasswordResetEmail, deleteUser, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import LeftNav from "../components/LeftNav";

const ProfilePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNavKey, setActiveNavKey] = useState("profile");
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    website: "",
    linkedin: "",
    address: "",
    name: "",
    company: "",
    jobTitle: "",
    industry: "",
    profilePhoto: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(""); // Both error and success
  const [feedbackError, setFeedbackError] = useState(false);
  const [profileLink] = useState("link.co/twfcqusj");
  const [emailEditMode, setEmailEditMode] = useState(false);
  const [originalEmail, setOriginalEmail] = useState("");
  const navigate = useNavigate();

  

  // FETCH user data from Firestore on mount
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setFeedback("");
      setFeedbackError(false);

      const curr = auth.currentUser;
      if (!curr) {
        setFormData((f) => ({
          ...f,
          email: "",
        }));
        setOriginalEmail("");
        setLoading(false);
        setFeedback("Not logged in!");
        setFeedbackError(true);
        return;
      }
      try {
        const docRef = doc(db, "users", curr.uid);
        const userSnap = await getDoc(docRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setFormData({
            email: data.email || curr.email || "",
            phone: data.phone || "",
            website: data.website || "",
            linkedin: data.linkedin || "",
            address: data.address || "",
            name: data.displayName || data.name || "",
            company: data.company || "",
            jobTitle: data.jobTitle || "",
            industry: data.industry || "",
            profilePhoto: data.profilePhoto || "",
          });
          setOriginalEmail(data.email || curr.email || "");
        } else {
          setFormData((f) => ({
            ...f,
            email: curr.email || "",
            name: curr.displayName || "",
          }));
          setOriginalEmail(curr.email || "");
        }
      } catch (err) {
        setFeedback("Failed to load profile: " + err.message);
        setFeedbackError(true);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileLink);
    setFeedback("Profile link copied!");
    setFeedbackError(false);
    setTimeout(() => setFeedback(""), 1500);
  };

  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((data) => ({ ...data, [name]: value }));
  };
  const handleEmailEditToggle = () => setEmailEditMode(true);

  const checkEmailExists = async (email, uid) => {
    if (!email) return false;
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.some((docu) => docu.id !== uid);
  };

  const handleSaveUpdates = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback("");
    setFeedbackError(false);

    try {
      const curr = auth.currentUser;
      if (!curr) throw new Error("User not authenticated");
      if (formData.email !== originalEmail) {
        const exists = await checkEmailExists(formData.email, curr.uid);
        if (exists) {
          setFeedback("That user already exists.");
          setFeedbackError(true);
          setSaving(false);
          setTimeout(() => setFeedback(""), 2500);
          return;
        }
      }
      const ref = doc(db, "users", curr.uid);
      await setDoc(
        ref,
        {
          ...formData,
          email: formData.email,
          displayName: formData.name || "",
        },
        { merge: true }
      );
      setFeedback("Profile updated!");
      setFeedbackError(false);
      setEmailEditMode(false);
      setOriginalEmail(formData.email);
    } catch (err) {
      setFeedback("Failed to update: " + err.message);
      setFeedbackError(true);
    }
    setSaving(false);
    setTimeout(() => setFeedback(""), 2000);
  };

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setFeedback("Password reset email sent!");
      setFeedbackError(false);
    } catch (err) {
      setFeedback("Failed to send reset email: " + err.message);
      setFeedbackError(true);
    }
    setTimeout(() => setFeedback(""), 2000);
  };

  // LOGOUT: sign out, feedback, redirect to /login
const handleLogout = async () => {
  const result = await Swal.fire({
    title: 'Are you sure you want to logout?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, log me out',
    cancelButtonText: 'No, stay logged in'
  });

  if (result.isConfirmed) {
    try {
      await signOut(auth);
      await Swal.fire({
        title: 'Logged out',
        text: 'You have been successfully logged out.',
        icon: 'success',
        showConfirmButton: false,
        timer: 1200,
        timerProgressBar: true,
      });
      navigate("/login");
    } catch (err) {
      await Swal.fire({
        title: 'Error',
        text: 'Failed to logout. Please try again.',
        icon: 'error'
      });
    }
  }
  // If result.isDismissed (user clicked "No"), do nothing (stay logged in)
};


  // DELETE account from Firestore + Auth
 const handleDeleteAccount = async () => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "This will permanently delete your data and account.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete my account',
    cancelButtonText: 'No, keep my account'
  });

  if (!result.isConfirmed) {
    return; // User cancelled
  }
    try {
      setFeedback("");
      setFeedbackError(false);
      const curr = auth.currentUser;
      if (!curr) throw new Error("Not authenticated");
      await deleteDoc(doc(db, "users", curr.uid));
      await deleteUser(curr);
      setFeedback("Account deleted. Goodbye!");
      setFeedbackError(false);
      setTimeout(() => {
        setFeedback("");
        navigate("/login");
      }, 2000);
    } catch (err) {
      setFeedback("Failed to delete account: " + (err && err.message));
      setFeedbackError(true);
      setTimeout(() => setFeedback(""), 3000);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <button
        aria-label="Toggle sidebar"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white border border-gray-300 shadow"
        type="button"
      >
        <svg
          className="h-6 w-6 text-gray-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>
      <LeftNav
        activeKey={activeNavKey}
        onChange={setActiveNavKey}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        userName={formData.name}
      />
      <main className="flex-1 p-4 md:p-10 bg-white m-4 md:m-10 ml-0 md:ml-64 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <p className="text-lg font-medium select-none mb-2">Profile</p>
          
          </div>
          {feedback && (
            <div className={`mb-4 p-2 rounded text-sm ${feedbackError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{feedback}</div>
          )}
          {loading ? (
            <div className="text-center py-12 text-gray-700">Loading profile...</div>
          ) : (
            <form onSubmit={handleSaveUpdates} className="space-y-6 bg-white rounded-lg shadow-lg p-6">
              {/* User photo section */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  {formData.profilePhoto ? (
                    <img
                      src={formData.profilePhoto}
                      alt="Profile"
                      className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-4xl select-none">
                      <svg
                        className="w-12 h-12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 21a6 6 0 00-15 0"/>
                      </svg>
                    </div>
                  )}
                  {/* Upload button placeholder */}
                  
                </div>
              </div>
              {/* Display Name */}
              <div>
                <label htmlFor="name" className="block text-xs font-bold mb-1 select-none">
                  Your Display Name <span className="text-red-600">✱</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border border-black rounded px-3 py-2 focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              {/* Email */}
              <div className="relative">
                <label htmlFor="email" className="block text-xs font-bold mb-1 select-none">
                  Email <span className="text-red-600">✱</span>
                </label>
                {emailEditMode ? (
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border border-black rounded px-3 py-2 focus:ring-2 focus:ring-black"
                    autoFocus
                    required
                  />
                ) : (
                  <>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      readOnly
                      className="w-full border border-black rounded px-3 py-2 bg-gray-200 cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={handleEmailEditToggle}
                      className="absolute right-2 top-[29px] bg-black text-white text-xs px-4 py-1 rounded-full"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-xs font-bold mb-1">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 234-567-8900"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full border border-black rounded px-3 py-2 focus:ring-2 focus:ring-black"
                />
              </div>
              {/* Website */}
              <div>
                <label htmlFor="website" className="block text-xs font-bold mb-1">
                  Website
                </label>
                <input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full border border-black rounded px-3 py-2 focus:ring-2 focus:ring-black"
                />
              </div>
              {/* LinkedIn */}
              <div>
                <label htmlFor="linkedin" className="block text-xs font-bold mb-1">
                  LinkedIn
                </label>
                <input
                  id="linkedin"
                  name="linkedin"
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={formData.linkedin}
                  onChange={handleInputChange}
                  className="w-full border border-black rounded px-3 py-2 focus:ring-2 focus:ring-black"
                />
              </div>
              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-xs font-bold mb-1">
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  placeholder="Your address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full border border-black rounded px-3 py-2 focus:ring-2 focus:ring-black resize-y"
                  rows={3}
                />
              </div>
              {/* Company */}
              <div>
                <label htmlFor="company" className="block text-xs font-bold mb-1">
                  Company
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  placeholder="Company Name"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full border border-black rounded px-3 py-2 focus:ring-2 focus:ring-black"
                />
              </div>
              {/* Job Title */}
              <div>
                <label htmlFor="jobTitle" className="block text-xs font-bold mb-1">
                  Job Title
                </label>
                <input
                  id="jobTitle"
                  name="jobTitle"
                  type="text"
                  placeholder="Job Title"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  className="w-full border border-black rounded px-3 py-2 focus:ring-2 focus:ring-black"
                />
              </div>
              {/* Industry */}
              <div>
                <label htmlFor="industry" className="block text-xs font-bold mb-1">
                  Industry
                </label>
                <input
                  id="industry"
                  name="industry"
                  type="text"
                  placeholder="Industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="w-full border border-black rounded px-3 py-2 focus:ring-2 focus:ring-black"
                />
              </div>
              {/* Profile Photo */}
              <div>
                <label htmlFor="profilePhoto" className="block text-xs font-bold mb-1">
                  Profile Photo URL
                </label>
                <input
                  id="profilePhoto"
                  name="profilePhoto"
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={formData.profilePhoto}
                  onChange={handleInputChange}
                  className="w-full border border-black rounded px-3 py-2 focus:ring-2 focus:ring-black"
                />
              </div>
              {/* Password (reset) */}
              <div className="relative">
                <label htmlFor="password" className="block text-xs font-bold mb-1 select-none">
                  Your Password <span className="text-red-600">✱</span>
                </label>
                <input
                  id="password"
                  type="password"
                  value="********"
                  readOnly
                  className="w-full border border-black rounded px-3 py-2 bg-gray-200 cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="absolute right-2 top-[29px] bg-black text-white text-xs px-4 py-1 rounded-full"
                >
                  Reset
                </button>
              </div>
              {/* Delete Account */}
              <div>
                <label className="block text-xs font-bold mb-1 select-none">Delete Your Account</label>
                <p className="text-xs text-gray-500 mb-2">
                  This will permanently delete all your data.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="text-red-600 border border-red-600 px-4 py-2 rounded font-semibold hover:bg-red-600 hover:text-white transition"
                >
                  Delete My Account
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className={`bg-black text-white px-6 py-2 rounded-full font-semibold hover:bg-gray-900 transition 
                    ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  {saving ? "Saving..." : "Save Updates"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;