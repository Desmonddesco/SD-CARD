import React, { useState } from 'react';
import { FaGoogle, FaApple } from 'react-icons/fa';
import logo from "../assets/SB-Card-Logo.png";
import { Link, useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, db } from '/src/firebase.js';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Footer from "../components/Footer";

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password.");
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          phone: "",
          website: "",
          linkedin: "",
          address: "",
          name: user.displayName || "",
          company: "",
          jobTitle: "",
          industry: "",
          profilePhoto: user.photoURL || "",
          createdAt: new Date().toISOString(),
        });
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setError("Something went wrong during sign-in.");
    }
  };

  return (
    <div className="min-h-screen bg-login-gradient bg-cover bg-no-repeat flex items-center justify-center">
    <div className="flex flex-col min-h-screen bg-[bg-gradient-to-r from-purple-400 to-pink-500 text-black py-2 px-6 rounded-md shadow hover:opacity-90
] overflow-auto">
      {/* Header */}
      <header className="w-full px-6 py-4 bg-[#e8ecfc] shadow-md flex items-center justify-between">
        <img src={logo} alt="Logo" className="h-8" />
        <Link to="/register" className="text-sm font-medium text-black underline hover:text-gray-700">
          Create Account
        </Link>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center mb-1 text-gray-900">Welcome Back!</h2>
          <p className="text-sm text-center text-gray-600 mb-6">Sign in to access your dashboard.</p>

          {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
            <div className="relative">
  <input
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="Password"
    className="w-full border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-black pr-12"
    required
  />
  <button
    type="button"
    onClick={() => setShowPassword(p => !p)}
    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black focus:outline-none"
    tabIndex={-1}
    aria-label={showPassword ? "Hide password" : "Show password"}
  >
    {showPassword ? (
      // Eye-slash SVG icon
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width={22} height={22}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-6-10-7s4.477-7 10-7c2.158 0 4.173.752 5.875 2.025m2.122 2.122A16.978 16.978 0 0122 12.001c0 1-4.477 7-10 7-1.113 0-2.186-.131-3.204-.375m-2.186-2.069A16.978 16.978 0 012 12.001c0-1 4.477-7 10-7 1.113 0 2.186.131 3.204.375" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-4 4m0 0l-4-4m4 4V10" />
      </svg>
    ) : (
      // Eye SVG icon
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width={22} height={22}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z" />
      </svg>
    )}
  </button>
</div>
           

            <p className="text-right text-sm">
             <Link to="/forgot-password" className="underline text-gray-600 hover:text-black">
            Forgot Password?
            </Link>
            </p>


            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-full hover:opacity-90 transition"
            >
              Sign in
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gray-300"></div>
            <span className="px-3 text-sm text-gray-500">Or continue with</span>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              className="w-full py-2 bg-black text-white rounded-full flex items-center justify-center space-x-3 hover:opacity-90"
            >
              <FaGoogle />
              <span>Sign in with Google</span>
            </button>

            <button
              disabled
              className="w-full border border-gray-300 py-2 rounded-full flex items-center justify-center space-x-3 bg-gray-100 text-gray-400 cursor-not-allowed"
            >
              <FaApple />
              <span>Sign in with Apple</span>
            </button>
          </div>

          <p className="text-xs text-center text-gray-500 mt-8 leading-snug">
            By signing in, you agree to our{' '}
            <span className="underline">Terms of Service</span> and{' '}
            <span className="underline">Privacy Policy</span>. <br />
            This site is protected by reCAPTCHA and the Google{' '}
            <span className="underline">Terms of Service</span> and{' '}
            <span className="underline">Privacy Policy</span> apply.
          </p>
        </div>
      </main>

      <Footer />
    </div>
    </div>
  );
};

export default LoginForm;
