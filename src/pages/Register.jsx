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
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import emailjs from 'emailjs-com';

const Register = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [form1Data, setForm1Data] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [form2Data, setForm2Data] = useState({
    profilePhoto: null,
    username: "",
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

  const isPasswordStrong = (password) => {
    return (
      /[A-Z]/.test(password) &&  // Uppercase
      /[a-z]/.test(password) &&  // Lowercase
      /\d/.test(password)    &&  // Digit
      /[^A-Za-z0-9]/.test(password) && // Special
      password.length >= 8
    );
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (form1Data.password !== form1Data.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Passwords do not match",
        text: "Please make sure both passwords are the same."
      });
      return;
    }
    if (!isPasswordStrong(form1Data.password)) {
      Swal.fire({
        icon: "error",
        title: "Weak Password",
        html: "Password must be at least 8 characters and include:<ul style='text-align:left;'><li>One uppercase letter</li><li>One lowercase letter</li><li>One number</li><li>One special character</li></ul>"
      });
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!form2Data.username.trim()) {
      Swal.fire({
        icon: "error",
        title: "Username Required",
        text: "Please enter a username."
      });
      return;
    }

    setLoading(true);

    let alertTimer;
    try {
      Swal.fire({
        title: "Registering your account...",
        html:
          '<div style="margin-top:12px;">Please wait. <br/><progress id="register-bar" max="100" value="10" style="width:80%;height:20px;"></progress></div>',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
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
        name: form2Data.username,
         subscription: "free",  // <-- add this line!
        company: form2Data.company || "",
        jobTitle: form2Data.jobTitle || "",
        industry: form2Data.industry || "",
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
        const dashboardUrl = window.location.origin + "/dashboard";
        sendWelcomeEmail({
          name: form2Data.username,
          email: form1Data.email,
          dashboardUrl,
        });
        navigate("/dashboard");
      });

    } catch (err) {
      clearInterval(alertTimer);
      setLoading(false);
      let message = err.message || "Registration failed.";
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

  // EmailJS welcome email
  function sendWelcomeEmail({ name, email, dashboardUrl }) {
    const serviceID = "service_4lsgibr";
    const templateID = "template_0v5334d";
    const userID = "YfkUihvdGPFpqujDy";

    emailjs.send(
      serviceID,
      templateID,
      {
        to_email: email,
        to_name: name || email,
        subject: "Welcome to SB Card!",
        //dashboard_link: dashboardUrl,
      },
      userID
    ).then(
      response => {
        console.log("Email sent:", response);
      },
      error => {
        console.error("EmailJS Error:", error);
      }
    );
  }

  return (
    <div className="min-h-screen bg-login-gradient bg-cover bg-no-repeat flex items-center justify-center">
      <div className="flex flex-col min-h-screen bg-[bg-gradient-to-r from-purple-400 to-pink-500 text-black py-2 px-6 rounded-md shadow hover:opacity-90] overflow-auto">
        {/* Header */}
        <header className="w-full px-6 py-4 bg-[#e8ecfc] shadow-md flex items-center justify-between">
          <img src={logo} alt="Logo" className="h-8" />
          <Link to="/login" className="text-sm font-medium text-black underline hover:text-gray-700">
            Login
          </Link>
        </header>

        {/* Main */}
        <main className="flex-grow flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md min-h-[460px] bg-white p-8 rounded-lg shadow-md flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold text-center mb-1 text-gray-900">
                {step === 1 ? "Add Info You Want to Share" : "Add Your Profile Info"}
              </h2>
              <p className="text-sm text-center text-gray-600 mb-6">
                {step === 1
                  ? "Fill out your basic login details."
                  : "Upload a photo and tell us about your career (optional except username)."}
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
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      required
                      value={form1Data.password}
                      onChange={handleForm1Change}
                      className="w-full border border-gray-300 rounded-md py-2 px-4 pr-12"
                      disabled={loading}
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black focus:outline-none"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        // Eye-slash SVG
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width={22} height={22}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-6-10-7s4.477-7 10-7c2.158 0 4.173.752 5.875 2.025m2.122 2.122A16.978 16.978 0 0122 12.001c0 1-4.477 7-10 7-1.113 0-2.186-.131-3.204-.375m-2.186-2.069A16.978 16.978 0 012 12.001c0-1 4.477-7 10-7 1.113 0 2.186.131 3.204.375" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-4 4m0 0l-4-4m4 4V10" />
                        </svg>
                      ) : (
                        // Eye SVG
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width={22} height={22}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    required
                    value={form1Data.confirmPassword}
                    onChange={handleForm1Change}
                    className="w-full border border-gray-300 rounded-md py-2 px-4"
                    disabled={loading}
                    minLength={8}
                    autoComplete="new-password"
                  />
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
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 21a6 6 0 00-15 0" />
                        </svg>
                      )}
                      <span className="absolute bottom-2 right-2 bg-black text-white text-xs rounded-full px-2 py-1 opacity-80 group-hover:opacity-100 transition">
                        Edit
                      </span>
                      <input
                        id="profilePhoto"
                        type="file"
                        name="profilePhoto"
                        accept="image/*"
                        onChange={handleForm2Change}
                        className="absolute inset-0 opacity-0 cursor-pointer rounded-full z-10"
                        disabled={loading}
                        tabIndex={-1}
                      />
                    </label>
                    <span className="text-xs text-gray-600 mt-1">Profile Photo (optional)</span>
                  </div>
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={form2Data.username}
                    onChange={handleForm2Change}
                    className="w-full border border-gray-300 rounded-md py-2 px-4"
                    required
                    disabled={loading}
                  />
                  <input
                    type="text"
                    name="company"
                    placeholder="Company (optional)"
                    value={form2Data.company}
                    onChange={handleForm2Change}
                    className="w-full border border-gray-300 rounded-md py-2 px-4"
                    disabled={loading}
                  />
                  <input
                    type="text"
                    name="jobTitle"
                    placeholder="Job Title (optional)"
                    value={form2Data.jobTitle}
                    onChange={handleForm2Change}
                    className="w-full border border-gray-300 rounded-md py-2 px-4"
                    disabled={loading}
                  />
                  <input
                    type="text"
                    name="industry"
                    placeholder="Industry (optional)"
                    value={form2Data.industry}
                    onChange={handleForm2Change}
                    className="w-full border border-gray-300 rounded-md py-2 px-4"
                    disabled={loading}
                  />
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
