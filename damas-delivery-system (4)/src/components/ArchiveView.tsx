import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from './UI';
import { Order } from '../hooks/useOrders';
import { STATUS_LABELS, STATUS_COLORS } from '../constants';
import { Printer, Package, Truck, CheckCircle, AlertCircle } from 'lucide-react';

interface ArchiveViewProps {
  orders: Order[];
  stock: any[];
  date: string;
}

export function ArchiveView({ orders, stock, date }: ArchiveViewProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Damas_Report_${date}`,
  });

  // Calculate totals
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const totalAmount = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.amount, 0);

  // Aggregate Stock per Driver
  const driverStats = stock.reduce((acc, entry) => {
    const name = entry.driver_name || 'Unknown';
    if (!acc[name]) {
      acc[name] = { taken: 0, delivered: 0, small: 0, medium: 0, large: 0 };
    }
    acc[name].taken += (entry.quantity_small || 0) + (entry.quantity_medium || 0) + (entry.quantity_large || 0);
    acc[name].small += (entry.quantity_small || 0);
    acc[name].medium += (entry.quantity_medium || 0);
    acc[name].large += (entry.quantity_large || 0);
    return acc;
  }, {} as Record<string, { taken: number; delivered: number; small: number; medium: number; large: number }>);

  // Aggregate Delivered per Driver
  orders.filter(o => o.status === 'delivered').forEach(o => {
    const name = o.driver_name || 'Unknown';
    if (!driverStats[name]) {
      driverStats[name] = { taken: 0, delivered: 0, small: 0, medium: 0, large: 0 };
    }
    driverStats[name].delivered += (o.box_count || 1);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => handlePrint()} variant="gold" className="flex items-center gap-2 text-[#800020]">
          <Printer className="w-5 h-5" />
          <span>طباعة التقرير</span>
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#D4AF37]/20 overflow-hidden">
        <div ref={componentRef} className="p-8 print:p-0 print:shadow-none" dir="rtl">
          {/* Header for Print */}
          <div className="mb-8 text-center border-b-2 border-[#800020] pb-6">
            <h1 className="text-4xl font-bold text-[#800020] mb-2 font-serif">DAMAS</h1>
            <p className="text-[#D4AF37] font-bold text-lg">تقرير يومي - {date}</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-6 mb-10">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center shadow-sm">
              <p className="text-sm text-gray-500 font-bold mb-1">إجمالي الطلبات</p>
              <p className="text-3xl font-bold text-gray-800">{totalOrders}</p>
            </div>
            <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 text-center shadow-sm">
              <p className="text-sm text-emerald-600 font-bold mb-1">تم التوصيل</p>
              <p className="text-3xl font-bold text-emerald-700">{deliveredOrders}</p>
            </div>
            <div className="bg-[#800020]/5 p-6 rounded-xl border border-[#800020]/10 text-center shadow-sm">
              <p className="text-sm text-[#800020] font-bold mb-1">المبلغ الإجمالي</p>
              <p className="text-3xl font-bold text-[#800020]">{totalAmount.toLocaleString()} دج</p>
            </div>
          </div>

          {/* Driver Statistics Table */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-[#800020] mb-4 border-r-4 border-[#D4AF37] pr-3 flex items-center gap-2">
              <Truck className="w-6 h-6" />
              ملخص المندوبين (Stock vs Delivered)
            </h3>
            <div className="overflow-hidden rounded-xl border border-[#D4AF37]/20 shadow-sm">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[#F5F5DC] border-b border-[#D4AF37]/20 text-[#800020]">
                    <th className="px-4 py-3 font-bold">المندوب</th>
                    <th className="px-4 py-3 font-bold text-center">تم أخذه (Stock)</th>
                    <th className="px-4 py-3 font-bold text-center">تم توصيله</th>
                    <th className="px-4 py-3 font-bold text-center">الفرق (المتبقي)</th>
                    <th className="px-4 py-3 font-bold text-center text-xs">تفاصيل (ص/م/ك)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(driverStats).map(([name, stats]: [string, { taken: number; delivered: number; small: number; medium: number; large: number }]) => {
                    const difference = stats.taken - stats.delivered;
                    return (
                      <tr key={name} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-bold text-gray-900">{name}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-blue-600">{stats.taken}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-emerald-600">{stats.delivered}</td>
                        <td className={`px-4 py-3 text-center font-mono font-bold ${difference < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                          {difference}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500 font-mono">
                          {stats.small} / {stats.medium} / {stats.large}
                        </td>
                      </tr>
                    );
                  })}
                  {Object.keys(driverStats).length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">لا توجد بيانات للمندوبين اليوم</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Orders Section */}
          <div>
            <h3 className="text-xl font-bold text-[#800020] mb-4 border-r-4 border-[#D4AF37] pr-3 flex items-center gap-2">
              <Package className="w-6 h-6" />
              تفاصيل الطلبات
            </h3>
            <div className="overflow-hidden rounded-xl border border-[#D4AF37]/20 shadow-sm">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F5F5DC] border-b border-[#D4AF37]/20 text-[#800020]">
                    <th className="px-4 py-3 font-bold">#</th>
                    <th className="px-4 py-3 font-bold">العميل</th>
                    <th className="px-4 py-3 font-bold">الهاتف</th>
                    <th className="px-4 py-3 font-bold">البلدية</th>
                    <th className="px-4 py-3 font-bold">العدد</th>
                    <th className="px-4 py-3 font-bold">الحجم</th>
                    <th className="px-4 py-3 font-bold">المبلغ</th>
                    <th className="px-4 py-3 font-bold">الحالة</th>
                    <th className="px-4 py-3 font-bold">المندوب</th>
                    <th className="px-4 py-3 font-bold">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{order.id}</td>
                      <td className="px-4 py-3 text-gray-700 font-bold">{order.client_name}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs" dir="ltr">{order.client_phone || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{order.commune}</td>
                      <td className="px-4 py-3 text-center font-bold">{order.box_count}</td>
                      <td className="px-4 py-3 text-gray-600">{order.box_size}</td>
                      <td className="px-4 py-3 font-bold text-[#800020] font-mono">{order.amount}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[order.status]}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{order.driver_name || '-'}</td>
                      <td className="px-4 py-3 text-gray-500 italic max-w-[150px] truncate" title={order.driver_notes || ''}>
                        {order.driver_notes || '-'}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500">لا توجد طلبات لهذا اليوم</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer for Print */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between text-sm text-gray-500 print:flex hidden">
            <p>تمت الطباعة بتاريخ: {new Date().toLocaleString('ar-DZ')}</p>
            <p>DAMAS Delivery System</p>
          </div>
        </div>
      </div>
    </div>
  );
}
