import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  createUserWithEmailAndPassword
} from "firebase/auth";
import {
  doc,
  setDoc
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";
import { app, auth, db, storage } from '/src/firebase.js';
import logo from "../assets/SB-Card-Logo.png";
import Footer from "../components/Footer";
import Swal from 'sweetalert2'; // Make sure sweetalert2 is installed
import 'sweetalert2/dist/sweetalert2.min.css';

const Register = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form1Data, setForm1Data] = useState({
    email: "",
    phone: "",
    website: "",
    linkedin: "",
    address: "",
    password: "",
  });

  const [form2Data, setForm2Data] = useState({
    profilePhoto: null,
    name: "",
    company: "",
    jobTitle: "",
    industry: "",
  });

  const handleForm1Change = (e) => {
    setForm1Data({ ...form1Data, [e.target.name]: e.target.value });
  };

  const handleForm2Change = (e) => {
    if (e.target.name === "profilePhoto") {
      setForm2Data({ ...form2Data, profilePhoto: e.target.files[0] });
    } else {
      setForm2Data({ ...form2Data, [e.target.name]: e.target.value });
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission

    setLoading(true);

    let alertTimer;
    try {
      // Show loading swal
      Swal.fire({
        title: "Registering your account...",
        html:
          '<div style="margin-top:12px;">Please wait. <br/><progress id="register-bar" max="100" value="10" style="width:80%;height:20px;"></progress></div>',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
          // Animate progress
          let val = 10;
          alertTimer = setInterval(() => {
            val = Math.min(val + 6 + Math.random() * 7, 94);
            const bar = Swal.getHtmlContainer().querySelector('#register-bar');
            if (bar && val <= 95) bar.value = val;
          }, 200);
        }
      });

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form1Data.email,
        form1Data.password
      );
      const user = userCredential.user;

      let photoURL = null;
      if (form2Data.profilePhoto) {
        const photoRef = ref(storage, `profilePhotos/${user.uid}/${form2Data.profilePhoto.name}`);
        await uploadBytes(photoRef, form2Data.profilePhoto);
        photoURL = await getDownloadURL(photoRef);
      }

      await setDoc(doc(db, "users", user.uid), {
        email: form1Data.email,
        phone: form1Data.phone,
        website: form1Data.website,
        linkedin: form1Data.linkedin,
        address: form1Data.address,
        name: form2Data.name,
        company: form2Data.company,
        jobTitle: form2Data.jobTitle,
        industry: form2Data.industry,
        profilePhoto: photoURL,
        createdAt: new Date().toISOString(),
      });

      clearInterval(alertTimer);
Swal.fire({
  title: "Registration Successful!",
  html: '<div style="margin-top:12px;">Redirecting to dashboard...<br/><progress id="register-bar" max="100" value="100" style="width:80%;height:20px;"></progress></div>',
  icon: "success",
  allowOutsideClick: false,
  timer: 2000,
  timerProgressBar: true
}).then(() => {
  navigate("/dashboard");
});


    } catch (err) {
      clearInterval(alertTimer);
      setLoading(false);
      let message = err.message || "Registration failed.";
      // Custom friendly message for duplicate email
      if (
        message.includes('auth/email-already-in-use') ||
        message.includes('already in use')
      ) {
        message = "That email is already registered. Please use a different email or login.";
      }
      Swal.fire({
        icon: 'error',
        title: 'Registration failed',
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-login-gradient bg-cover bg-no-repeat flex items-center justify-center">
      <div className="flex flex-col min-h-screen bg-[bg-gradient-to-r from-purple-400 to-pink-500 text-black py-2 px-6 rounded-md shadow hover:opacity-90
] overflow-auto">
      {/* Header */}
      <header className="w-full px-6 py-4 bg-[#e8ecfc] shadow-md flex items-center justify-between">
        <img src={logo} alt="Logo" className="h-8" />
        <Link to="/login" className="text-sm font-medium text-black underline hover:text-gray-700">
          Login
        </Link>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md min-h-[580px] bg-white p-8 rounded-lg shadow-md flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold text-center mb-1 text-gray-900">
              {step === 1 ? "Add Info You Want to Share" : "Add Your Profile Info"}
            </h2>
            <p className="text-sm text-center text-gray-600 mb-6">
              {step === 1
                ? "Fill out your basic contact and login details."
                : "Upload a photo and tell us about your career."}
            </p>

            {step === 1 ? (
              <form onSubmit={handleNext} className="space-y-4">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  value={form1Data.email}
                  onChange={handleForm1Change}
                  className="w-full border border-gray-300 rounded-md py-2 px-4"
                  disabled={loading}
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  required
                  value={form1Data.password}
                  onChange={handleForm1Change}
                  className="w-full border border-gray-300 rounded-md py-2 px-4"
                  disabled={loading}
                />
                {["phone", "website", "linkedin", "address"].map((field) => (
                  <input
                    key={field}
                    type="text"
                    name={field}
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    required
                    value={form1Data[field]}
                    onChange={handleForm1Change}
                    className="w-full border border-gray-300 rounded-md py-2 px-4"
                    disabled={loading}
                  />
                ))}
                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-sm text-gray-600 underline"
                    disabled={loading}
                  >
                    Back to Login
                  </button>
                  <button
                    type="submit"
                    className="bg-black text-white px-6 py-2 rounded-full hover:opacity-90 disabled:opacity-80"
                    disabled={loading}
                  >
                    Next
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center mb-4">
  <label
    htmlFor="profilePhoto"
    className="relative h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-4xl select-none cursor-pointer hover:bg-gray-400 transition group"
    style={{ position: "relative" }}
  >
    {/* Show preview if selected, else show SVG */}
    {form2Data.profilePhoto ? (
      <img
        src={URL.createObjectURL(form2Data.profilePhoto)}
        alt="Profile Preview"
        className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
        style={{ objectFit: "cover" }}
      />
    ) : (
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
    )}
    {/* Visual "edit photo" overlay */}
    <span className="absolute bottom-2 right-2 bg-black text-white text-xs rounded-full px-2 py-1 opacity-80 group-hover:opacity-100 transition">
      Edit
    </span>
    {/* Hidden input for file selection */}
    <input
      id="profilePhoto"
      type="file"
      name="profilePhoto"
      accept="image/*"
      required
      onChange={handleForm2Change}
      className="absolute inset-0 opacity-0 cursor-pointer rounded-full z-10"
      disabled={loading}
      tabIndex={-1} // visually hidden, but accessible via label click
    />
  </label>
  <span className="text-xs text-gray-600 mt-1">Profile Photo</span>
</div>

                {["name", "company", "jobTitle", "industry"].map((field) => (
                  <input
                    key={field}
                    type="text"
                    name={field}
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    required
                    value={form2Data[field]}
                    onChange={handleForm2Change}
                    className="w-full border border-gray-300 rounded-md py-2 px-4"
                    disabled={loading}
                  />
                ))}
                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm text-gray-600 underline"
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="bg-black text-white px-6 py-2 rounded-full hover:opacity-90 disabled:opacity-80"
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="text-xs text-center text-gray-500 mt-6 leading-snug">
            By signing up, you agree to our{" "}
            <span className="underline">Terms of Service</span> and{" "}
            <span className="underline">Privacy Policy</span>. <br />
            This site is protected by reCAPTCHA and the Google{" "}
            <span className="underline">Terms of Service</span> and{" "}
            <span className="underline">Privacy Policy</span> apply.
          </p>
        </div>
      </main>

      <Footer />
    </div>
    </div>
  );
};

export default Register;
