import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [form, setForm] = useState({ symbol: '', type: 'buy', quantity: '', price: '', date: '' });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (err) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/orders/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      alert('Failed to delete order');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL your orders? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete('/orders/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders([]);
    } catch (err) {
      alert('Failed to delete all orders');
    }
  };

  const handleAdd = () => {
    setEditingOrder(null);
    setForm({ symbol: '', type: 'buy', quantity: '', price: '', date: '' });
    setShowForm(true);
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setForm({
      symbol: order.symbol,
      type: order.type,
      quantity: order.quantity,
      price: order.price,
      date: order.date ? order.date.slice(0, 10) : '',
    });
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      if (editingOrder) {
        await axios.put(`/orders/update/${editingOrder.id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post('/orders/add', form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowForm(false);
      setEditingOrder(null);
      setForm({ symbol: '', type: 'buy', quantity: '', price: '', date: '' });
      fetchOrders();
    } catch (err) {
      alert('Failed to save order');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-8">
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto mt-4 px-2 sm:px-4">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-white">Orders</h1>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 sm:px-6 rounded shadow"
          onClick={handleAdd}
        >
          Add Order
        </button>
        <button
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 sm:px-6 rounded shadow"
          onClick={handleDeleteAll}
          disabled={orders.length === 0}
        >
          Delete All Orders
        </button>
      </div>
      {/* Table for desktop */}
      <div className="hidden sm:block w-full overflow-x-auto bg-gray-900 rounded-xl">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-gray-300">
              <th className="px-4 py-3 text-left">Symbol</th>
              <th className="px-4 py-3 text-center">Type</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Date</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-700">
                  <td className="px-4 py-2">{order.symbol}</td>
                  <td className={`px-4 py-2 text-center font-semibold ${order.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>{order.type.charAt(0).toUpperCase() + order.type.slice(1)}</td>
                  <td className="px-4 py-2 text-right">{order.quantity}</td>
                  <td className="px-4 py-2 text-right">₹{order.price.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{new Date(order.date).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-2 text-center flex gap-2 justify-center">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                      onClick={() => handleEdit(order)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                      onClick={() => handleDelete(order.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-6">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Cards for mobile */}
      <div className="block sm:hidden space-y-3">
        {orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="bg-gray-900 rounded-xl p-4 flex flex-col gap-2 shadow">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Symbol:</span>
                <span>{order.symbol}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Type:</span>
                <span className={order.type === 'buy' ? 'text-green-400' : 'text-red-400'}>{order.type.charAt(0).toUpperCase() + order.type.slice(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Qty:</span>
                <span>{order.quantity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Price:</span>
                <span>₹{order.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Date:</span>
                <span>{new Date(order.date).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs w-full"
                  onClick={() => handleEdit(order)}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs w-full"
                  onClick={() => handleDelete(order.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-400 py-6">No orders found.</div>
        )}
      </div>
      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <form
            onSubmit={handleFormSubmit}
            className="bg-gray-800 rounded-xl p-8 w-full max-w-md shadow-xl flex flex-col gap-4"
          >
            <h2 className="text-xl font-bold text-white mb-2">{editingOrder ? 'Edit Order' : 'Add Order'}</h2>
            <div className="flex flex-col gap-2">
              <label className="text-gray-300 text-sm">Symbol</label>
              <input
                type="text"
                name="symbol"
                value={form.symbol}
                onChange={handleFormChange}
                className="rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white focus:outline-none"
                placeholder="e.g. INFY.NS"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-gray-300 text-sm">Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleFormChange}
                className="rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white focus:outline-none"
                required
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-gray-300 text-sm">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleFormChange}
                className="rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white focus:outline-none"
                required
                min="0.01"
                step="0.01"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-gray-300 text-sm">Price</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleFormChange}
                className="rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white focus:outline-none"
                required
                min="0.01"
                step="0.01"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-gray-300 text-sm">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleFormChange}
                className="rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white focus:outline-none"
                required
              />
            </div>
            <div className="flex gap-4 justify-end mt-4">
              <button
                type="button"
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                onClick={() => { setShowForm(false); setEditingOrder(null); }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
              >
                {editingOrder ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Orders; 