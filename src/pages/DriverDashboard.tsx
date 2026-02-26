import React, { useState, useMemo } from 'react';
import { useOrders, Order } from '../hooks/useOrders';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Select, Modal } from '../components/UI';
import { STATUS_LABELS, STATUS_COLORS } from '../constants';
import { CheckCircle, XCircle, Package, History, Calendar, Truck } from 'lucide-react';

export default function DriverDashboard() {
  const { user } = useAuth();
  const { orders, updateStatus } = useOrders();
  const [stock, setStock] = useState({ small: '', medium: '', large: '' });
  const [notes, setNotes] = useState<{ [key: number]: string }>({});
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [failureReason, setFailureReason] = useState('');
  const [customFailureReason, setCustomFailureReason] = useState('');

  // Filter orders for this driver
  const myOrders = useMemo(() => orders.filter((o) => o.driver_id === user?.id), [orders, user?.id]);

  // Today's Date String YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Active Orders (Delivering)
  const activeOrders = myOrders.filter(o => o.status === 'delivering');

  // Today's History (Delivered or Failed TODAY)
  const todayHistory = myOrders.filter(o => {
    const orderDate = o.updated_at ? o.updated_at.split('T')[0] : '';
    return (o.status === 'delivered' || o.status === 'failed') && orderDate === todayStr;
  });

  // Calculate Total Boxes Delivered Today
  const totalBoxesDelivered = todayHistory
    .filter(o => o.status === 'delivered')
    .reduce((acc, curr) => acc + (curr.box_count || 1), 0);

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: user?.id,
          quantity_small: Number(stock.small),
          quantity_medium: Number(stock.medium),
          quantity_large: Number(stock.large),
          date: todayStr,
        }),
      });
      if (res.ok) {
        alert('تم إرسال الكمية بنجاح');
        setStock({ small: '', medium: '', large: '' });
      }
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  const handleDeliveredClick = (order: Order) => {
    setSelectedOrder(order);
    setIsConfirmModalOpen(true);
  };

  const confirmDelivery = async () => {
    if (!selectedOrder) return;
    try {
      await updateStatus(selectedOrder.id, 'delivered');
      setIsConfirmModalOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      alert('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const openFailureModal = (order: Order) => {
    setSelectedOrder(order);
    setFailureReason('');
    setCustomFailureReason('');
    setIsModalOpen(true);
  };

  const confirmFailure = async () => {
    if (!selectedOrder) return;
    const reason = failureReason === 'other' ? customFailureReason : failureReason;
    if (!reason) {
      alert('يرجى تحديد سبب عدم الاستلام');
      return;
    }

    try {
      await updateStatus(selectedOrder.id, 'failed', reason);
      setIsModalOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      alert('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const handleNoteChange = (id: number, value: string) => {
    setNotes(prev => ({ ...prev, [id]: value }));
  };

  const saveNote = async (id: number) => {
    try {
      await fetch(`/api/orders/${id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_notes: notes[id] }),
      });
      alert('تم حفظ الملاحظة');
    } catch (error) {
      alert('فشل حفظ الملاحظة');
    }
  };

  return (
    <div className="space-y-6 pb-24 px-2 md:px-0">
      {/* Header Stats */}
      <div className="bg-[#800020] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-1">مرحباً، {user?.name}</h2>
            <p className="text-[#D4AF37] font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {todayStr}
            </p>
          </div>
          <div className="text-center bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20">
            <p className="text-xs text-gray-200 mb-1">تم توصيل</p>
            <p className="text-3xl font-bold text-[#D4AF37]">{totalBoxesDelivered}</p>
            <p className="text-[10px] text-gray-300">بوكس اليوم</p>
          </div>
        </div>
      </div>

      {/* Daily Stock Input */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-[#D4AF37]/20">
        <h3 className="text-lg font-bold text-[#800020] mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          استلام من المعمل
        </h3>
        <form onSubmit={handleStockSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="صغير"
              type="number"
              value={stock.small}
              onChange={(e) => setStock({ ...stock, small: e.target.value })}
              className="text-center font-mono text-lg"
            />
            <Input
              label="متوسط"
              type="number"
              value={stock.medium}
              onChange={(e) => setStock({ ...stock, medium: e.target.value })}
              className="text-center font-mono text-lg"
            />
            <Input
              label="كبير"
              type="number"
              value={stock.large}
              onChange={(e) => setStock({ ...stock, large: e.target.value })}
              className="text-center font-mono text-lg"
            />
          </div>
          <Button type="submit" variant="gold" className="w-full font-bold text-[#800020]">
            تأكيد الاستلام
          </Button>
        </form>
      </div>

      {/* Active Orders List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-[#800020] flex items-center gap-2 px-2">
          <Truck className="w-6 h-6" />
          الطلبات الجارية ({activeOrders.length})
        </h3>
        
        {activeOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-300">
            <p className="text-gray-500">لا توجد طلبات قيد التوصيل حالياً</p>
          </div>
        ) : (
          activeOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#D4AF37]/20 animate-in slide-in-from-bottom-2 duration-300">
              {/* Card Header */}
              <div className="bg-[#F5F5DC]/30 p-4 border-b border-[#D4AF37]/10 flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-100">#{order.id}</span>
                  <h4 className="font-bold text-gray-900 text-lg mt-1">{order.client_name}</h4>
                  {order.client_phone && (
                    <p className="text-sm text-gray-600 font-mono mt-0.5" dir="ltr">{order.client_phone}</p>
                  )}
                </div>
                <div className="text-left">
                  <span className="block font-mono text-xl font-bold text-[#800020]">{order.amount} دج</span>
                  <span className="text-xs text-gray-500">{order.box_count} بوكس ({order.box_size})</span>
                </div>
              </div>
              
              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-2 text-gray-700 bg-gray-50 p-3 rounded-xl">
                  <span className="text-lg">📍</span>
                  <div>
                    <p className="font-bold text-sm text-gray-500">العنوان</p>
                    <p className="font-medium">{order.commune}</p>
                  </div>
                </div>

                {order.notes && (
                  <div className="text-sm bg-yellow-50 text-yellow-800 p-3 rounded-xl border border-yellow-100">
                    <span className="font-bold block mb-1">📝 ملاحظات الإدارة:</span>
                    {order.notes}
                  </div>
                )}

                {/* Driver Notes Input */}
                <div className="flex gap-2 pt-2">
                  <Input 
                    placeholder="ملاحظاتك الخاصة..." 
                    value={notes[order.id] || order.driver_notes || ''} 
                    onChange={(e) => handleNoteChange(order.id, e.target.value)}
                    className="text-sm flex-1 !py-2"
                  />
                  <Button onClick={() => saveNote(order.id)} variant="secondary" className="px-3 !py-2 text-sm">حفظ</Button>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button 
                    type="button"
                    variant="success" 
                    onClick={() => handleDeliveredClick(order)}
                    className="w-full shadow-lg shadow-emerald-100"
                  >
                    <CheckCircle className="w-5 h-5" />
                    تم التسليم
                  </Button>
                  <Button 
                    type="button"
                    variant="danger" 
                    onClick={() => openFailureModal(order)}
                    className="w-full shadow-lg shadow-red-100"
                  >
                    <XCircle className="w-5 h-5" />
                    لم يتم
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Daily History */}
      <div className="space-y-4 pt-4 border-t-2 border-dashed border-gray-200">
        <h3 className="text-xl font-bold text-gray-600 flex items-center gap-2 px-2">
          <History className="w-6 h-6" />
          سجل اليوم ({todayHistory.length})
        </h3>
        
        <div className="space-y-3 opacity-80">
          {todayHistory.length === 0 ? (
            <p className="text-center text-gray-400 py-4">لا يوجد سجل لهذا اليوم</p>
          ) : (
            todayHistory.map(order => (
              <div key={order.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{order.client_name}</span>
                    <span className="text-xs font-mono text-gray-400">#{order.id}</span>
                  </div>
                  <p className="text-sm text-gray-500">{order.commune} - {order.amount} دج</p>
                  {order.status === 'failed' && (
                    <p className="text-xs text-red-500 mt-1">السبب: {order.failure_reason}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[order.status]}`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delivery Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="تأكيد التسليم"
      >
        <div className="space-y-4">
          <p className="text-gray-600 font-medium text-lg text-center">
            هل أنت متأكد من تسليم الطلب للزبون <span className="text-[#800020] font-bold">{selectedOrder?.client_name}</span>؟
          </p>
          <div className="flex gap-3 pt-4">
            <Button onClick={() => setIsConfirmModalOpen(false)} variant="secondary" className="flex-1">
              إلغاء
            </Button>
            <Button onClick={confirmDelivery} variant="success" className="flex-1">
              نعم، تم التسليم
            </Button>
          </div>
        </div>
      </Modal>

      {/* Failure Reason Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="سبب عدم الاستلام"
      >
        <div className="space-y-4">
          <Select
            label="اختر السبب"
            value={failureReason}
            onChange={(e) => setFailureReason(e.target.value)}
            options={[
              { value: '', label: 'اختر...' },
              { value: 'client_unreachable', label: 'الزبون لا يرد' },
              { value: 'client_refused', label: 'الزبون رفض الطلب' },
              { value: 'wrong_address', label: 'العنوان خاطئ' },
              { value: 'postponed', label: 'تأجيل الموعد' },
              { value: 'other', label: 'سبب آخر' },
            ]}
          />
          
          {failureReason === 'other' && (
            <Input
              label="اكتب السبب"
              value={customFailureReason}
              onChange={(e) => setCustomFailureReason(e.target.value)}
              placeholder="وضح السبب هنا..."
            />
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={() => setIsModalOpen(false)} variant="secondary" className="flex-1">
              إلغاء
            </Button>
            <Button onClick={confirmFailure} variant="danger" className="flex-1">
              تأكيد
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
