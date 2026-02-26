import React, { useState, useEffect } from 'react';
import { useUsers } from '../hooks/useUsers';
import { Button, Input, Select } from '../components/UI';
import { Package, Truck, Calendar, CheckCircle } from 'lucide-react';

interface StockEntry {
  id: number;
  driver_id: number;
  driver_name: string;
  quantity_small: number;
  quantity_medium: number;
  quantity_large: number;
  date: string;
  created_at: string;
}

export default function FactoryDashboard() {
  const { users } = useUsers();
  const drivers = users.filter(u => u.role === 'livreur');
  
  const [formData, setFormData] = useState({
    driver_id: '',
    quantity_small: '',
    quantity_medium: '',
    quantity_large: '',
  });

  const [stockHistory, setStockHistory] = useState<StockEntry[]>([]);
  const todayStr = new Date().toISOString().split('T')[0];

  const fetchStock = async () => {
    try {
      const res = await fetch(`/api/stock?date=${todayStr}`);
      if (res.ok) {
        const data = await res.json();
        setStockHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch stock', error);
    }
  };

  useEffect(() => {
    fetchStock();
    // Poll for updates every 10 seconds or use socket if available (simplified polling for now)
    const interval = setInterval(fetchStock, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.driver_id) {
      alert('يرجى اختيار السائق');
      return;
    }

    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: Number(formData.driver_id),
          quantity_small: Number(formData.quantity_small) || 0,
          quantity_medium: Number(formData.quantity_medium) || 0,
          quantity_large: Number(formData.quantity_large) || 0,
          date: todayStr,
        }),
      });

      if (res.ok) {
        alert('تم تسجيل خروج البضاعة بنجاح');
        setFormData({
          driver_id: '',
          quantity_small: '',
          quantity_medium: '',
          quantity_large: '',
        });
        fetchStock();
      } else {
        alert('حدث خطأ');
      }
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  // Calculate totals per driver
  const driverTotals = stockHistory.reduce((acc, entry) => {
    if (!acc[entry.driver_name]) {
      acc[entry.driver_name] = { small: 0, medium: 0, large: 0, total: 0 };
    }
    acc[entry.driver_name].small += entry.quantity_small;
    acc[entry.driver_name].medium += entry.quantity_medium;
    acc[entry.driver_name].large += entry.quantity_large;
    acc[entry.driver_name].total += (entry.quantity_small + entry.quantity_medium + entry.quantity_large);
    return acc;
  }, {} as Record<string, { small: number; medium: number; large: number; total: number }>);

  return (
    <div className="space-y-8 pb-20 px-4 md:px-0 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-[#800020] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-1">لوحة تحكم المعمل</h2>
            <p className="text-[#D4AF37] font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {todayStr}
            </p>
          </div>
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20">
            <Package className="w-8 h-8 text-[#D4AF37]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#D4AF37]/20 h-fit">
          <h3 className="text-xl font-bold text-[#800020] mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
            <Truck className="w-6 h-6" />
            تسجيل خروج بضاعة
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <Select
              label="السائق"
              value={formData.driver_id}
              onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
              options={[
                { value: '', label: 'اختر السائق...' },
                ...drivers.map(d => ({ value: String(d.id), label: d.name }))
              ]}
              required
            />

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="صغير"
                type="number"
                value={formData.quantity_small}
                onChange={(e) => setFormData({ ...formData, quantity_small: e.target.value })}
                className="text-center font-mono text-lg"
                placeholder="0"
              />
              <Input
                label="متوسط"
                type="number"
                value={formData.quantity_medium}
                onChange={(e) => setFormData({ ...formData, quantity_medium: e.target.value })}
                className="text-center font-mono text-lg"
                placeholder="0"
              />
              <Input
                label="كبير"
                type="number"
                value={formData.quantity_large}
                onChange={(e) => setFormData({ ...formData, quantity_large: e.target.value })}
                className="text-center font-mono text-lg"
                placeholder="0"
              />
            </div>

            <Button type="submit" variant="gold" className="w-full font-bold text-[#800020] text-lg py-4 shadow-lg shadow-yellow-100">
              <CheckCircle className="w-5 h-5" />
              تأكيد العملية
            </Button>
          </form>
        </div>

        {/* Daily Totals Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#D4AF37]/20">
            <h3 className="text-xl font-bold text-[#800020] mb-4 flex items-center gap-2">
              <Package className="w-6 h-6" />
              مجموع خروج اليوم
            </h3>
            
            <div className="space-y-4">
              {Object.entries(driverTotals).length === 0 ? (
                <p className="text-center text-gray-400 py-8">لم يتم تسجيل أي خروج اليوم</p>
              ) : (
                Object.entries(driverTotals).map(([name, totals]) => (
                  <div key={name} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-gray-800 text-lg">{name}</h4>
                      <span className="bg-[#800020] text-white px-3 py-1 rounded-full text-sm font-bold">
                        {totals.total} بوكس
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="bg-white p-2 rounded border border-gray-100">
                        <span className="block text-gray-400 text-xs">صغير</span>
                        <span className="font-mono font-bold text-gray-700">{totals.small}</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-gray-100">
                        <span className="block text-gray-400 text-xs">متوسط</span>
                        <span className="font-mono font-bold text-gray-700">{totals.medium}</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-gray-100">
                        <span className="block text-gray-400 text-xs">كبير</span>
                        <span className="font-mono font-bold text-gray-700">{totals.large}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Detailed History Log */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#D4AF37]/20">
            <h3 className="text-lg font-bold text-gray-600 mb-4">سجل العمليات بالتفصيل</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {stockHistory.map((entry) => (
                <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm border-r-4 border-[#D4AF37]">
                  <div>
                    <span className="font-bold text-gray-800 block">{entry.driver_name}</span>
                    <span className="text-xs text-gray-400 font-mono">{new Date(entry.created_at).toLocaleTimeString('ar-DZ')}</span>
                  </div>
                  <div className="text-left font-mono text-gray-600">
                    <span className="mx-1">{entry.quantity_small}</span>/
                    <span className="mx-1">{entry.quantity_medium}</span>/
                    <span className="mx-1">{entry.quantity_large}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
