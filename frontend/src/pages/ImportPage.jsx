import React, { useState } from 'react';
import axios from 'axios';

const ImportPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setSuccess('File imported successfully!');
      setFile(null);
    } catch (err) {
      setError('Failed to import file.');
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
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Import Orders</h2>
        <div className="text-gray-400 text-center mb-2">
          Add a CSV or XLSX file. Download the order history from your broker and upload here. You are ready to go then.
        </div>
        {error && <div className="text-red-400 text-center">{error}</div>}
        {success && <div className="text-green-400 text-center">{success}</div>}
        <input
          type="file"
          accept=".csv, .xlsx"
          onChange={handleFileChange}
          className="rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600"
        />
        <button
          type="submit"
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded mt-2"
          disabled={loading}
        >
          {loading ? 'Importing...' : 'Import'}
        </button>
      </form>
    </div>
  );
};

export default ImportPage; 