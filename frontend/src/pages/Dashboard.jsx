import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4D4F'];

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(0);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [loadingPayment, setLoadingPayment] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    loadRazorpayScript();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Connect specifically configured explicit backend aggregation pipeline queries in parallel!
      const [txRes, totalRes, catRes, monthRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/analytics/total'),
        api.get('/analytics/category'),
        api.get('/analytics/monthly')
      ]);
      setTransactions(txRes.data.data);
      setAnalytics(totalRes.data.totalSpending);
      
      // Structure dynamic Pie Chart data points exactly to match Rechart object mapping parameters
      const mapCat = catRes.data.data.map((c) => ({
        name: c._id,
        value: c.totalAmount
      }));
      setCategoryData(mapCat);

      // Extract grouped historical aggregations onto a linear layout for sequential Bar plotting
      const mapMonthly = monthRes.data.data.map((m) => ({
        name: `${m._id.month}/${m._id.year}`,
        Amount: m.totalAmount
      }));
      setMonthlyData(mapMonthly);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      if (error.response && error.response.status === 401) {
        handleLogout();
      }
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) return alert('Enter a valid amount');

    setLoadingPayment(true);
    try {
      const [{ data: orderData }, { data: keyData }] = await Promise.all([
        api.post('/payments/order', {
          amount: Number(amount),
          currency: 'INR',
          receipt: `receipt_${Date.now()}`
        }),
        api.get('/payments/key')
      ]);

      if (!orderData.success) {
        setLoadingPayment(false);
        return alert('Failed to create Razorpay Order');
      }

      const options = {
        key: keyData.key, // Dynamically fetched from backend securely!
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Expense Tracker Pro',
        description: `Adding an expense to ${category}`,
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: Number(amount),
              currency: 'INR',
              category
            });

            if (verifyRes.data.success) {
              setAmount('');
              fetchDashboardData(); // Automatically reflect Analytics visual updates globally instantly!
            }
          } catch (error) {
            console.error('Validation failed', error);
            alert('Failed validation.');
          }
        },
        prefill: {
          name: JSON.parse(localStorage.getItem('user'))?.name || 'User',
          email: JSON.parse(localStorage.getItem('user'))?.email || 'user@example.com'
        },
        theme: { color: '#3a7bd5' }
      };

      if (!window.Razorpay) {
         setLoadingPayment(false);
         return alert("Razorpay SDK Failed to load context.");
      }
      
      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (res) {
        alert(res.error.description);
      });
      paymentObject.open();

    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout initiation error.');
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Analytics Dashboard</h1>
        <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Sign Out
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginTop: '30px', flexWrap: 'wrap' }}>
        {/* Total Spending Stat Card */}
        <div style={{ flex: '1', minWidth: '250px', padding: '30px', background: 'linear-gradient(135deg, #1d976c, #93f9b9)', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: 0, fontWeight: '500' }}>Total Spendings</h2>
          <h1 style={{ fontSize: '3rem', margin: '10px 0 0 0' }}>₹{analytics || 0}</h1>
        </div>
        
        {/* Payment Entry Form */}
        <div style={{ flex: '1', minWidth: '300px', padding: '30px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #eaeaea' }}>
          <h2 style={{ margin: '0 0 15px 0', color: '#333' }}>Record Expense</h2>
          <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="number" 
              placeholder="Amount (₹)" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required 
              style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }}
            />
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }}
              required
            >
              <option value="Groceries">Groceries</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Utilities">Utilities</option>
              <option value="Rent">Rent</option>
              <option value="Travel">Travel</option>
              <option value="Other">Other</option>
            </select>
            <button 
              type="submit" 
              disabled={loadingPayment}
              style={{ padding: '14px', background: 'linear-gradient(45deg, #00d2ff, #3a7bd5)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loadingPayment ? 'Processing Gateway...' : 'Pay with Razorpay'}
            </button>
          </form>
        </div>
      </div>

      {/* Analytics Recharts Graphics Display */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '30px', flexWrap: 'wrap' }}>
        {/* Monthly Trend Chart */}
        <div style={{ flex: '2', minWidth: '400px', background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
           <h3>Monthly Spending Trends</h3>
           {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Bar dataKey="Amount" fill="#3a7bd5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
           ) : (
             <p style={{ color: '#888', marginTop: '20px' }}>Not enough data to map trends.</p>
           )}
        </div>

        {/* Category Pie Chart */}
        <div style={{ flex: '1', minWidth: '300px', background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
           <h3>Category Breakdown</h3>
           {categoryData.length > 0 ? (
             <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
             </ResponsiveContainer>
           ) : (
             <p style={{ color: '#888', marginTop: '20px' }}>No categories found.</p>
           )}
        </div>
      </div>

      {/* Historic Logs Listing */}
      <div style={{ marginTop: '40px', background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <h3>History ({transactions.length} Records)</h3>
        {transactions.length === 0 ? (
          <p style={{ color: '#888', marginTop: '10px' }}>No recorded transactions yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
            <thead>
              <tr style={{ background: '#fafafa', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px' }}>Date</th>
                <th style={{ padding: '12px' }}>Category</th>
                <th style={{ padding: '12px' }}>Amount</th>
                <th style={{ padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{new Date(tx.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>{tx.category}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>₹{tx.amount}</td>
                  <td style={{ padding: '12px', color: tx.status === 'success' ? '#52c41a' : '#f5222d' }}>
                    {tx.status.toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
