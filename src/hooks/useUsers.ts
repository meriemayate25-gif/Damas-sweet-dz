import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'confirmatrice' | 'livreur';
  created_at: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { lastMessage } = useSocket();

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'USER_ADDED') {
        setUsers((prev) => [...prev, lastMessage.payload]);
      } else if (lastMessage.type === 'USER_UPDATED') {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === lastMessage.payload.id ? lastMessage.payload : user
          )
        );
      } else if (lastMessage.type === 'USER_DELETED') {
        setUsers((prev) => prev.filter((user) => user.id !== Number(lastMessage.payload.id)));
      }
    }
  }, [lastMessage]);

  const addUser = async (user: Omit<User, 'id' | 'created_at'> & { password?: string }) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error('Failed to add user');
    return res.json();
  };

  const updateUser = async (id: number, user: Partial<User> & { password?: string }) => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
  };

  const deleteUser = async (id: number) => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete user');
    return res.json();
  };

  return { users, loading, addUser, updateUser, deleteUser };
}
