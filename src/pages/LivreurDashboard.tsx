import React, { useState, useEffect } from 'react';
import { useOrders } from '../hooks/useOrders';
import { Button, Input } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function LivreurDashboard() {
  const { orders, updateStatus } = useOrders();
  const { user } = useAuth();
  const [stockCount, setStockCount] = useState('');
  const [stockSubmitted, setStockSubmitted] = useState(false);

  const myOrders = orders.filter(o => o.driver_id === user?.id && (o.status === 'delivering' || o.status === 'delivered' || o.status === 'failed'));

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: user?.id,
          quantity: Number(stockCount),
          date: new Date().toISOString().split('T')[0]
        }),
      });
      if (res.ok) {
        setStockSubmitted(true);
        alert('تم تسجيل المخزون بنجاح');
      }
    } catch (err) {
      alert('فشل في تسجيل المخزون');
    }
  };

  const handleStatusUpdate = async (id: number, status: 'delivered' | 'failed') => {
    try {
      await updateStatus(id, status);
    } catch (err) {
      alert('فشل تحديث الحالة');
    }
  };

  return (
    <div className="space-y-8">
      {/* Daily Stock Input */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-[#800020] mb-4 text-center">ما تم استلامه من المعمل</h2>
        {!stockSubmitted ? (
          <form onSubmit={handleStockSubmit} className="space-y-4">
            <Input
              type="number"
              label="عدد البوكسات"
              value={stockCount}
              onChange={(e) => setStockCount(e.target.value)}
              required
              className="w-full text-center text-lg"
            />
            <Button type="submit" className="w-full py-3">إرسال</Button>
          </form>
        ) : (
          <div className="text-center text-emerald-600 font-medium py-4 bg-emerald-50 rounded-xl">
            تم تسجيل {stockCount} بوكس لهذا اليوم
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">الطلبات المسندة إليك</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-600 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">رقم الطلب</th>
                <th className="px-6 py-4 font-medium">العميل</th>
                <th className="px-6 py-4 font-medium">البلدية</th>
                <th className="px-6 py-4 font-medium">المنتج</th>
                <th className="px-6 py-4 font-medium">الحجم</th>
                <th className="px-6 py-4 font-medium">المبلغ</th>
                <th className="px-6 py-4 font-medium text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-900 font-medium">#{order.id}</td>
                  <td className="px-6 py-4 text-gray-600">{order.client_name}</td>
                  <td className="px-6 py-4 text-gray-600">{order.commune}</td>
                  <td className="px-6 py-4 text-gray-600">{order.product}</td>
                  <td className="px-6 py-4 text-gray-600">{order.box_size}</td>
                  <td className="px-6 py-4 text-gray-900 font-bold">{order.amount} دج</td>
                  <td className="px-6 py-4">
                    {order.status === 'delivering' ? (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'delivered')}
                          className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-200 transition-colors font-medium text-sm"
                        >
                          تم الاستلام
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'failed')}
                          className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
                        >
                          لم يتم الاستلام
                        </button>
                      </div>
                    ) : (
                      <div className={`text-center px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {order.status === 'delivered' ? 'تم التسليم' : 'فشل التسليم'}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {myOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    لا توجد طلبات مسندة حالياً
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
