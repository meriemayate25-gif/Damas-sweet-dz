import React, { useState, useEffect } from 'react';
import { useOrders } from '../hooks/useOrders';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Select } from '../components/UI';
import { COMMUNES_ALGIERS, BOX_SIZES, STATUS_LABELS, STATUS_COLORS } from '../constants';
import { ArchiveView } from '../components/ArchiveView';
import { Phone, Package, MapPin, User, FileText, DollarSign } from 'lucide-react';

export default function ConfirmatriceDashboard() {
  const { user } = useAuth();
  const { orders, addOrder } = useOrders();
  const [activeTab, setActiveTab] = useState<'orders' | 'archive'>('orders');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyStock, setDailyStock] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    commune: COMMUNES_ALGIERS[0],
    box_size: 'صغير',
    box_count: '1',
    amount: '',
    notes: '',
  });

  useEffect(() => {
    if (activeTab === 'archive') {
      fetch(`/api/stock?date=${selectedDate}`)
        .then((res) => res.json())
        .then(setDailyStock);
    }
  }, [selectedDate, activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addOrder({
        client_name: formData.client_name,
        client_phone: formData.client_phone,
        commune: formData.commune,
        product: 'البوكس الفاخر داماس',
        box_size: formData.box_size as any,
        box_count: Number(formData.box_count) || 1,
        amount: Number(formData.amount),
        notes: formData.notes,
        created_by: user?.id,
      });
      setFormData({
        client_name: '',
        client_phone: '',
        commune: COMMUNES_ALGIERS[0],
        box_size: 'صغير',
        box_count: '1',
        amount: '',
        notes: '',
      });
      alert('تم إضافة الطلب بنجاح');
    } catch (error) {
      alert('حدث خطأ أثناء إضافة الطلب');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#D4AF37]/20 pb-4">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
            activeTab === 'orders' 
              ? 'bg-[#800020] text-white shadow-lg shadow-red-900/20' 
              : 'text-gray-600 hover:bg-[#F5F5DC] hover:text-[#800020]'
          }`}
        >
          إدارة الطلبات
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
            activeTab === 'archive' 
              ? 'bg-[#800020] text-white shadow-lg shadow-red-900/20' 
              : 'text-gray-600 hover:bg-[#F5F5DC] hover:text-[#800020]'
          }`}
        >
          الأرشيف اليومي
        </button>
      </div>

      {activeTab === 'archive' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-[#D4AF37]/20">
            <h2 className="text-xl font-bold text-[#800020] flex items-center gap-2">
              <FileText className="w-6 h-6" />
              الأرشيف اليومي
            </h2>
            <Input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto" 
            />
          </div>
          <ArchiveView 
            orders={orders.filter(o => o.created_at.startsWith(selectedDate))} 
            stock={dailyStock} 
            date={selectedDate} 
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#D4AF37]/20 h-fit sticky top-4">
            <h2 className="text-2xl font-bold text-[#800020] mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <Package className="w-6 h-6" />
              إضافة طلب جديد
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="اسم الزبون"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                required
                placeholder="الاسم الكامل"
              />
              <Input
                label="رقم الهاتف"
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                required
                placeholder="05/06/07..."
                type="tel"
              />
              <Select
                label="البلدية"
                value={formData.commune}
                onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                options={COMMUNES_ALGIERS.map((c) => ({ value: c, label: c }))}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="حجم البوكس"
                  value={formData.box_size}
                  onChange={(e) => setFormData({ ...formData, box_size: e.target.value })}
                  options={BOX_SIZES}
                />
                <Input
                  label="عدد البوكسات"
                  type="number"
                  min="1"
                  value={formData.box_count}
                  onChange={(e) => setFormData({ ...formData, box_count: e.target.value })}
                  required
                  className="text-center"
                />
              </div>

              <Input
                label="المبلغ (دج)"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                placeholder="0.00"
              />
              <Input
                label="ملاحظات"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="أي تفاصيل إضافية..."
              />
              
              <Button type="submit" variant="gold" className="w-full font-bold text-[#800020] text-lg py-4 shadow-lg shadow-yellow-100 mt-4">
                تأكيد الطلب
              </Button>
            </form>
          </div>

          {/* Orders Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden border border-[#D4AF37]/20">
            <div className="p-6 border-b border-[#D4AF37]/10 bg-[#F5F5DC]/30 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#800020]">الطلبات الأخيرة</h2>
              <span className="bg-[#800020] text-white px-3 py-1 rounded-full text-sm font-bold">
                {orders.length} طلب
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 text-gray-600 text-sm font-bold">
                  <tr>
                    <th className="px-6 py-4">رقم الطلب</th>
                    <th className="px-6 py-4">الزبون</th>
                    <th className="px-6 py-4">الهاتف</th>
                    <th className="px-6 py-4">البلدية</th>
                    <th className="px-6 py-4">العدد</th>
                    <th className="px-6 py-4">الحجم</th>
                    <th className="px-6 py-4">المبلغ</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4">المندوب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#F5F5DC]/20 transition-colors">
                      <td className="px-6 py-4 text-gray-900 font-bold">#{order.id}</td>
                      <td className="px-6 py-4 text-gray-700 font-medium">{order.client_name}</td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-sm" dir="ltr">{order.client_phone || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{order.commune}</td>
                      <td className="px-6 py-4 text-gray-900 font-bold text-center">{order.box_count}</td>
                      <td className="px-6 py-4 text-gray-600">{order.box_size}</td>
                      <td className="px-6 py-4 font-mono text-[#800020] font-bold">{order.amount} دج</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${STATUS_COLORS[order.status]}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {order.driver_name || <span className="text-gray-300 italic">غير مسند</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
