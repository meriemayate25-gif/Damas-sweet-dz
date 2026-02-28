import React, { useState, useEffect } from 'react';
import { useOrders } from '../hooks/useOrders';
import { ArchiveView } from '../components/ArchiveView';
import { Button, Input } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { Calendar, LogOut, User } from 'lucide-react';

export default function ComptableDashboard() {
  const { orders } = useOrders();
  const [stock, setStock] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { logout, user } = useAuth();

  useEffect(() => {
    fetch(`/api/stock?date=${date}`)
      .then((res) => res.json())
      .then(setStock);
  }, [date]);

  const filteredOrders = orders.filter(o => o.created_at.startsWith(date));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-3 bg-[#800020]/10 rounded-xl">
            <Calendar className="w-6 h-6 text-[#800020]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">لوحة تحكم المحاسبة</h2>
            <p className="text-sm text-gray-500">متابعة الأرشيف والتقارير المالية</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className="w-full md:w-auto"
          />
          <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            </div>
            <Button variant="secondary" onClick={logout} className="p-2 aspect-square flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <ArchiveView orders={filteredOrders} stock={stock} date={date} />
    </div>
  );
}
