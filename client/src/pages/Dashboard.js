import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { company } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/reports/dashboard').then(res => {
      if (res.success) setData(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;

  const cards = [
    { label: 'Today Sales', value: `₹${(data?.todaySales?.total || 0).toFixed(0)}`, count: `${data?.todaySales?.count || 0} bills`, color: 'bg-blue-500', icon: 'cash-register' },
    { label: 'This Month Sales', value: `₹${(data?.monthSales?.total || 0).toFixed(0)}`, count: `${data?.monthSales?.count || 0} bills`, color: 'bg-green-500', icon: 'chart-line' },
    { label: 'Month Purchases', value: `₹${(data?.monthPurchases?.total || 0).toFixed(0)}`, color: 'bg-orange-500', icon: 'truck' },
    { label: 'Month Expenses', value: `₹${(data?.monthExpenses || 0).toFixed(0)}`, color: 'bg-red-500', icon: 'wallet' },
    { label: 'Medicines', value: data?.totalMedicines || 0, color: 'bg-purple-500', icon: 'capsules', link: '/medicines' },
    { label: 'Customers', value: data?.totalCustomers || 0, color: 'bg-teal-500', icon: 'users', link: '/customers' },
    { label: 'Suppliers', value: data?.totalSuppliers || 0, color: 'bg-indigo-500', icon: 'truck-loading', link: '/suppliers' },
    { label: 'Outstanding', value: `₹${(data?.outstandingReceivable || 0).toFixed(0)}`, color: 'bg-rose-500', icon: 'hand-holding-usd' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="text-sm text-gray-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <Link key={i} to={card.link || '#'} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                <i className={`fas fa-${card.icon} text-white`}></i>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
            {card.count && <p className="text-xs text-gray-400 mt-1">{card.count}</p>}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i className="fas fa-clock text-orange-500"></i> Expiring Soon (30 days)
          </h2>
          {data?.expiringBatches?.length > 0 ? (
            <div className="space-y-2">
              {data.expiringBatches.map((b, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{b.medicine?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">Batch: {b.batchNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-orange-600">{Math.ceil((new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))} days</p>
                    <p className="text-xs text-gray-500">{new Date(b.expiryDate).toLocaleDateString('en-IN')} | Qty: {b.qty}</p>
                  </div>
                </div>
              ))}
              <Link to="/expiry" className="block text-center text-sm text-blue-600 hover:underline mt-2">View All Expiring</Link>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No items expiring in 30 days</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i className="fas fa-rocket text-blue-500"></i> Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/sales/new" className="p-4 bg-blue-50 rounded-xl text-center hover:bg-blue-100 transition-colors">
              <i className="fas fa-cash-register text-blue-600 text-xl mb-2"></i>
              <p className="text-sm font-medium text-blue-700">New Sale</p>
            </Link>
            <Link to="/purchases/new" className="p-4 bg-green-50 rounded-xl text-center hover:bg-green-100 transition-colors">
              <i className="fas fa-truck text-green-600 text-xl mb-2"></i>
              <p className="text-sm font-medium text-green-700">New Purchase</p>
            </Link>
            <Link to="/medicines/new" className="p-4 bg-purple-50 rounded-xl text-center hover:bg-purple-100 transition-colors">
              <i className="fas fa-capsules text-purple-600 text-xl mb-2"></i>
              <p className="text-sm font-medium text-purple-700">Add Medicine</p>
            </Link>
            <Link to="/customers/new" className="p-4 bg-teal-50 rounded-xl text-center hover:bg-teal-100 transition-colors">
              <i className="fas fa-user text-teal-600 text-xl mb-2"></i>
              <p className="text-sm font-medium text-teal-700">Add Customer</p>
            </Link>
            <Link to="/prescriptions/new" className="p-4 bg-amber-50 rounded-xl text-center hover:bg-amber-100 transition-colors">
              <i className="fas fa-prescription text-amber-600 text-xl mb-2"></i>
              <p className="text-sm font-medium text-amber-700">Add Prescription</p>
            </Link>
            <Link to="/reports/profit-loss" className="p-4 bg-rose-50 rounded-xl text-center hover:bg-rose-100 transition-colors">
              <i className="fas fa-chart-pie text-rose-600 text-xl mb-2"></i>
              <p className="text-sm font-medium text-rose-700">P&L Report</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
