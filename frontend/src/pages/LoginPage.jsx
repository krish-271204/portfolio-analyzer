import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/login', form);
      localStorage.setItem('token', res.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
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
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Login</h2>
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
        <button
          type="submit"
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded mt-2"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {/* Register prompt */}
        <div className="text-center text-gray-300 mt-4 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-orange-400 hover:underline font-semibold">Register now!</Link>
        </div>
      </form>
    </div>
  );
};

export default LoginPage; 