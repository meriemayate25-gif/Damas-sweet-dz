import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

export interface Order {
  id: number;
  client_name: string;
  client_phone?: string;
  commune: string;
  product: string;
  box_size: 'صغير' | 'متوسط' | 'كبير';
  box_count: number;
  amount: number;
  status: 'pending' | 'delivering' | 'delivered' | 'failed';
  failure_reason?: string;
  driver_id: number | null;
  driver_name?: string;
  notes: string;
  driver_notes?: string;
  admin_confirmed?: number;
  created_by?: number;
  created_at: string;
  updated_at?: string;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { lastMessage } = useSocket();

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'ORDER_ADDED') {
        setOrders((prev) => {
          if (prev.some(o => o.id === lastMessage.payload.id)) return prev;
          return [lastMessage.payload, ...prev];
        });
      } else if (lastMessage.type === 'ORDER_UPDATED') {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === lastMessage.payload.id ? lastMessage.payload : order
          )
        );
      }
    }
  }, [lastMessage]);

  const addOrder = async (order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'status' | 'driver_id'>) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!res.ok) throw new Error('Failed to add order');
    const newOrder = await res.json();
    setOrders((prev) => {
      if (prev.some((o) => o.id === newOrder.id)) return prev;
      return [newOrder, ...prev];
    });
    return newOrder;
  };

  const updateStatus = async (id: number, status: string, failureReason?: string) => {
    console.log(`[useOrders] updateStatus called for order ${id} with status ${status}`);
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, failure_reason: failureReason }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[useOrders] Failed to update status: ${res.status} ${res.statusText}`, errorText);
      throw new Error(`Failed to update status: ${res.statusText}`);
    }
    const updatedOrder = await res.json();
    console.log('[useOrders] Status updated successfully, received:', updatedOrder);
    setOrders((prev) => prev.map((o) => (o.id === id ? updatedOrder : o)));
    return updatedOrder;
  };

  const assignDriver = async (id: number, driverId: number) => {
    const res = await fetch(`/api/orders/${id}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driver_id: driverId }),
    });
    if (!res.ok) throw new Error('Failed to assign driver');
    const updatedOrder = await res.json();
    setOrders((prev) => prev.map((o) => (o.id === id ? updatedOrder : o)));
    return updatedOrder;
  };

  const confirmDelivery = async (id: number) => {
    const res = await fetch(`/api/orders/${id}/confirm`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to confirm delivery');
    const updatedOrder = await res.json();
    setOrders((prev) => prev.map((o) => (o.id === id ? updatedOrder : o)));
    return updatedOrder;
  };

  return { orders, loading, addOrder, updateStatus, assignDriver, confirmDelivery };
}
