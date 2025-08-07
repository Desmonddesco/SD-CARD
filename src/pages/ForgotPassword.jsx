import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Link } from 'react-router-dom';
import logo from '../assets/SB-Card-Logo.png';
import Footer from "../components/Footer";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('A password reset link has been sent to your email.');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with that email.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else {
        setError('Something went wrong. Please try again later.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-login-gradient bg-cover bg-no-repeat flex items-center justify-center">
    <div className="flex flex-col min-h-screen bg-[bg-gradient-to-r from-purple-400 to-pink-500 text-black py-2 px-6 rounded-md shadow hover:opacity-90] overflow-auto">
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
          <h2 className="text-2xl font-bold text-center mb-1 text-gray-900">Reset Password</h2>
          <p className="text-sm text-center text-gray-600 mb-6">Enter your email to receive a reset link.</p>

          {message && <p className="text-green-600 text-sm mb-4 text-center">{message}</p>}
          {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-black"
              required
            />

            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-full hover:opacity-90 transition"
            >
              Send Reset Link
            </button>
          </form>

          <p className="text-sm text-center mt-6">
            <Link to="/" className="text-gray-600 underline hover:text-black">Back to Login</Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
    </div>
  );
};

export default ForgotPassword;
