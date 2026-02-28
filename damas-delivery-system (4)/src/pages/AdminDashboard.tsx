import React, { useState, useEffect, useMemo } from 'react';
import { useOrders } from '../hooks/useOrders';
import { STATUS_LABELS, STATUS_COLORS } from '../constants';
import { Button, Input, Select } from '../components/UI';
import { ArchiveView } from '../components/ArchiveView';
import { LayoutDashboard, Users, Archive, Edit, Trash2, CheckCircle, Filter, Package } from 'lucide-react';

export default function AdminDashboard() {
  const { orders, assignDriver, confirmDelivery } = useOrders();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [confirmatrices, setConfirmatrices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [dailyStock, setDailyStock] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'archive'>('dashboard');
  
  // Filters
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedConfirmatrice, setSelectedConfirmatrice] = useState('');

  // User Form State
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'livreur' });
  const [isEditingUser, setIsEditingUser] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchDailyStock();
  }, [selectedDate]);

  const fetchUsers = () => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setDrivers(data.filter((u: any) => u.role === 'livreur'));
        setConfirmatrices(data.filter((u: any) => u.role === 'confirmatrice'));
      });
  };

  const fetchDailyStock = () => {
    fetch(`/api/stock?date=${selectedDate}`)
      .then((res) => res.json())
      .then(setDailyStock);
  };

  const handleAssign = async (orderId: number, driverId: string) => {
    if (!driverId) return;
    try {
      await assignDriver(orderId, Number(driverId));
    } catch (error) {
      alert('Failed to assign driver');
    }
  };

  const handleConfirmDelivery = async (orderId: number) => {
    if (window.confirm('تأكيد استلام الطلب؟')) {
      try {
        await confirmDelivery(orderId);
      } catch (error) {
        alert('Failed to confirm delivery');
      }
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditingUser ? `/api/users/${isEditingUser}` : '/api/users';
    const method = isEditingUser ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });
      
      if (res.ok) {
        fetchUsers();
        setUserForm({ name: '', email: '', password: '', role: 'livreur' });
        setIsEditingUser(null);
        alert(isEditingUser ? 'تم تحديث المستخدم' : 'تم إضافة المستخدم');
      } else {
        const data = await res.json();
        alert(data.error || 'Error');
      }
    } catch (error) {
      alert('Error submitting user');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesDriver = selectedDriver ? o.driver_id === Number(selectedDriver) : true;
      const matchesConfirmatrice = selectedConfirmatrice ? o.created_by === Number(selectedConfirmatrice) : true;
      // For dashboard view, we might want to show all orders or filter by date?
      // Usually dashboard shows current state. Let's keep it all orders but filtered by dropdowns.
      return matchesDriver && matchesConfirmatrice;
    });
  }, [orders, selectedDriver, selectedConfirmatrice]);

  // Stats
  const totalOrders = filteredOrders.length;
  const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered').length;
  const failedOrders = filteredOrders.filter(o => o.status === 'failed').length;
  const pendingOrders = filteredOrders.filter(o => o.status === 'pending').length;
  const totalBoxesUsed = filteredOrders.filter(o => o.status === 'delivered').reduce((acc, o) => acc + (o.box_count || 1), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#D4AF37]/20 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 whitespace-nowrap ${
            activeTab === 'dashboard' 
              ? 'bg-[#800020] text-white shadow-lg shadow-red-900/20' 
              : 'text-gray-600 hover:bg-[#F5F5DC] hover:text-[#800020]'
          }`}
        >
          لوحة التحكم
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 whitespace-nowrap ${
            activeTab === 'users' 
              ? 'bg-[#800020] text-white shadow-lg shadow-red-900/20' 
              : 'text-gray-600 hover:bg-[#F5F5DC] hover:text-[#800020]'
          }`}
        >
          إدارة المستخدمين
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 whitespace-nowrap ${
            activeTab === 'archive' 
              ? 'bg-[#800020] text-white shadow-lg shadow-red-900/20' 
              : 'text-gray-600 hover:bg-[#F5F5DC] hover:text-[#800020]'
          }`}
        >
          الأرشيف (Archive)
        </button>
      </div>

      {activeTab === 'archive' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-[#D4AF37]/20">
            <h2 className="text-xl font-bold text-[#800020] flex items-center gap-2">
              <Archive className="w-6 h-6" />
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
      )}

      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Filters */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#D4AF37]/20 flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/3">
              <Select
                label="تصفية حسب السائق"
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                options={[
                  { value: '', label: 'الكل' },
                  ...drivers.map(d => ({ value: String(d.id), label: d.name }))
                ]}
              />
            </div>
            <div className="w-full md:w-1/3">
              <Select
                label="تصفية حسب المؤكدة"
                value={selectedConfirmatrice}
                onChange={(e) => setSelectedConfirmatrice(e.target.value)}
                options={[
                  { value: '', label: 'الكل' },
                  ...confirmatrices.map(c => ({ value: String(c.id), label: c.name }))
                ]}
              />
            </div>
            <div className="w-full md:w-1/3 pb-1">
               <Button 
                 variant="secondary" 
                 onClick={() => {setSelectedDriver(''); setSelectedConfirmatrice('');}}
                 className="w-full"
               >
                 إعادة تعيين
               </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#D4AF37]/20 text-center">
              <p className="text-gray-500 font-bold text-sm mb-1">إجمالي الطلبات</p>
              <p className="text-3xl font-bold text-[#800020]">{totalOrders}</p>
            </div>
            <div className="bg-emerald-50 p-6 rounded-2xl shadow-sm border border-emerald-100 text-center">
              <p className="text-emerald-600 font-bold text-sm mb-1">تم التوصيل</p>
              <p className="text-3xl font-bold text-emerald-700">{deliveredOrders}</p>
            </div>
            <div className="bg-red-50 p-6 rounded-2xl shadow-sm border border-red-100 text-center">
              <p className="text-red-600 font-bold text-sm mb-1">لم يتم التوصيل</p>
              <p className="text-3xl font-bold text-red-700">{failedOrders}</p>
            </div>
            <div className="bg-[#F5F5DC] p-6 rounded-2xl shadow-sm border border-[#D4AF37]/20 text-center">
              <p className="text-[#800020] font-bold text-sm mb-1">بوكسات مستخدمة</p>
              <p className="text-3xl font-bold text-[#800020]">{totalBoxesUsed}</p>
            </div>
          </div>

          {/* Main Orders Table */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-[#D4AF37]/20">
            <div className="p-6 border-b border-[#D4AF37]/10 bg-[#F5F5DC]/30">
              <h2 className="text-xl font-bold text-[#800020]">لوحة التحكم بالطلبات</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 text-gray-600 text-sm font-bold">
                  <tr>
                    <th className="px-6 py-4">رقم الطلب</th>
                    <th className="px-6 py-4">الزبون</th>
                    <th className="px-6 py-4">البلدية</th>
                    <th className="px-6 py-4">التفاصيل</th>
                    <th className="px-6 py-4">المبلغ</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4">تعيين سائق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#F5F5DC]/20 transition-colors">
                      <td className="px-6 py-4 text-gray-900 font-bold">#{order.id}</td>
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {order.client_name}
                        <div className="text-xs text-gray-400 font-mono mt-1" dir="ltr">{order.client_phone}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{order.commune}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <span className="font-bold">{order.box_count}</span> x {order.box_size}
                        <div className="text-xs text-gray-400 mt-1">{order.product}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-[#800020] font-bold">{order.amount} دج</td>
                      <td className="px-6 py-4">
                        {order.status === 'delivered' && order.admin_confirmed === 0 ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 animate-pulse">
                            بانتظار التأكيد
                          </span>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[order.status]}`}>
                            {STATUS_LABELS[order.status]}
                          </span>
                        )}
                        {order.status === 'failed' && (
                          <div className="text-xs text-red-500 mt-1 font-medium">{order.failure_reason}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {order.status === 'delivered' && order.admin_confirmed === 0 ? (
                          <Button 
                            onClick={() => handleConfirmDelivery(order.id)}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1 shadow-emerald-100"
                          >
                            <CheckCircle className="w-3 h-3" />
                            تأكيد الاستلام
                          </Button>
                        ) : (
                          <select
                            className="bg-white border border-[#D4AF37]/30 text-gray-700 text-sm rounded-xl focus:ring-[#D4AF37] focus:border-[#D4AF37] block w-full p-2.5"
                            value={order.driver_id || ''}
                            onChange={(e) => handleAssign(order.id, e.target.value)}
                            disabled={order.status === 'delivered' || order.status === 'failed'}
                          >
                            <option value="">اختر سائق...</option>
                            {drivers.map((driver) => (
                              <option key={driver.id} value={driver.id}>
                                {driver.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
          {/* User Form */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#D4AF37]/20 h-fit sticky top-4">
            <h2 className="text-xl font-bold text-[#800020] mb-6 flex items-center gap-2">
              <Users className="w-6 h-6" />
              {isEditingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
            </h2>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <Input
                label="الاسم الكامل"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                required
              />
              <Input
                label="البريد الإلكتروني"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                required
              />
              <Input
                label={isEditingUser ? "كلمة المرور (اتركها فارغة للإبقاء على الحالية)" : "كلمة المرور"}
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                required={!isEditingUser}
              />
              <Select
                label="الدور"
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                options={[
                  { value: 'admin', label: 'Super Admin' },
                  { value: 'confirmatrice', label: 'Confirmatrice' },
                  { value: 'livreur', label: 'Livreur' },
                  { value: 'comptable', label: 'Comptable' },
                  { value: 'factory', label: 'المعمل (Factory)' },
                ]}
              />
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1">
                  {isEditingUser ? 'حفظ التغييرات' : 'إضافة المستخدم'}
                </Button>
                {isEditingUser && (
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => {
                      setIsEditingUser(null);
                      setUserForm({ name: '', email: '', password: '', role: 'livreur' });
                    }}
                  >
                    إلغاء
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Users List */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden border border-[#D4AF37]/20">
            <div className="p-6 border-b border-[#D4AF37]/10 bg-[#F5F5DC]/30">
              <h2 className="text-xl font-bold text-[#800020]">قائمة المستخدمين</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 text-gray-600 text-sm font-bold">
                  <tr>
                    <th className="px-6 py-4">الاسم</th>
                    <th className="px-6 py-4">البريد الإلكتروني</th>
                    <th className="px-6 py-4">الدور</th>
                    <th className="px-6 py-4">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F5F5DC]/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 text-gray-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'confirmatrice' ? 'bg-pink-100 text-pink-800' :
                          u.role === 'comptable' ? 'bg-emerald-100 text-emerald-800' :
                          u.role === 'factory' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {u.role === 'admin' ? 'مسؤول' : 
                           u.role === 'confirmatrice' ? 'تأكيد الطلبات' : 
                           u.role === 'comptable' ? 'محاسبة' : 
                           u.role === 'factory' ? 'المعمل' : 'سائق'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => {
                            setIsEditingUser(u.id);
                            setUserForm({ name: u.name, email: u.email, password: '', role: u.role });
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-bold"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-bold"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
