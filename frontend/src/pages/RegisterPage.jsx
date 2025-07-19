import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/register', { email: form.email, password: form.password });
      navigate('/login');
    } catch (err) {
      setError('Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 rounded-xl p-8 w-full max-w-md shadow-xl flex flex-col gap-6"
      >
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Register</h2>
        {error && <div className="text-red-400 text-center">{error}</div>}
        <div className="flex flex-col gap-2">
          <label className="text-gray-300 text-sm">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white focus:outline-none"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-gray-300 text-sm">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white focus:outline-none"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-gray-300 text-sm">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            className="rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white focus:outline-none"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded mt-2"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default RegisterPage; 