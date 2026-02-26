import express from 'express';
import db from '../db';
import { broadcast } from '../socket';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Middleware to check auth (simplified)
const requireAuth = (req: any, res: any, next: any) => {
  // In a real app, verify JWT here. For now rely on cookie presence check in auth route
  // or implement full middleware. Since we use cookies, we can parse them.
  // For simplicity in this demo, we'll trust the frontend to handle access control mostly,
  // but critical operations should be protected.
  next();
};

// --- USERS ---

router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users').all();
  res.json(users);
});

router.post('/users', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!['admin', 'confirmatrice', 'livreur', 'comptable'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
    ).run(name, email, hashedPassword, role);
    
    const newUser = { id: result.lastInsertRowid, name, email, role };
    broadcast('USER_ADDED', newUser);
    res.json(newUser);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/users/:id', (req, res) => {
  const { name, email, role, password } = req.body;
  const { id } = req.params;
  
  try {
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE users SET name = ?, email = ?, role = ?, password = ? WHERE id = ?')
        .run(name, email, role, hashedPassword, id);
    } else {
      db.prepare('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?')
        .run(name, email, role, id);
    }
    
    const updatedUser = { id, name, email, role };
    broadcast('USER_UPDATED', updatedUser);
    res.json(updatedUser);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/users/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    broadcast('USER_DELETED', { id: req.params.id });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- ORDERS ---

router.get('/orders', (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, u.name as driver_name 
    FROM orders o 
    LEFT JOIN users u ON o.driver_id = u.id
    ORDER BY o.created_at DESC
  `).all();
  res.json(orders);
});

router.post('/orders', (req, res) => {
  const { client_name, client_phone, commune, box_size, box_count, amount, notes, created_by } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO orders (client_name, client_phone, commune, box_size, box_count, amount, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(client_name, client_phone, commune, box_size, box_count || 1, amount, notes, created_by);
    
    const newOrder = db.prepare(`
      SELECT o.*, u.name as driver_name 
      FROM orders o 
      LEFT JOIN users u ON o.driver_id = u.id
      WHERE o.id = ?
    `).get(result.lastInsertRowid);

    broadcast('ORDER_ADDED', newOrder);
    res.json(newOrder);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/orders/:id', (req, res) => {
  const { client_name, client_phone, commune, box_size, box_count, amount, notes } = req.body;
  const { id } = req.params;
  try {
    db.prepare(`
      UPDATE orders 
      SET client_name = ?, client_phone = ?, commune = ?, box_size = ?, box_count = ?, amount = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(client_name, client_phone, commune, box_size, box_count, amount, notes, id);
    
    const updatedOrder = db.prepare(`
      SELECT o.*, u.name as driver_name 
      FROM orders o 
      LEFT JOIN users u ON o.driver_id = u.id
      WHERE o.id = ?
    `).get(id);

    broadcast('ORDER_UPDATED', updatedOrder);
    res.json(updatedOrder);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/orders/:id/assign', (req, res) => {
  const { driver_id } = req.body;
  const { id } = req.params;
  try {
    db.prepare(`
      UPDATE orders 
      SET driver_id = ?, status = 'delivering', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(driver_id, id);
    
    const updatedOrder = db.prepare(`
      SELECT o.*, u.name as driver_name 
      FROM orders o 
      LEFT JOIN users u ON o.driver_id = u.id
      WHERE o.id = ?
    `).get(id);

    broadcast('ORDER_UPDATED', updatedOrder);
    res.json(updatedOrder);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/orders/:id/status', (req, res) => {
  const { status, failure_reason } = req.body;
  const { id } = req.params;
  console.log(`[API] Received status update for order ${id}: ${status}`);
  try {
    if (status === 'delivered') {
      console.log(`[API] Setting order ${id} to delivered and admin_confirmed=0`);
      db.prepare(`
        UPDATE orders 
        SET status = ?, admin_confirmed = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, id);
    } else if (status === 'failed') {
      console.log(`[API] Setting order ${id} to failed with reason: ${failure_reason}`);
      db.prepare(`
        UPDATE orders 
        SET status = ?, failure_reason = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, failure_reason, id);
    } else {
      console.log(`[API] Setting order ${id} to ${status}`);
      db.prepare(`
        UPDATE orders 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, id);
    }
    
    const updatedOrder = db.prepare(`
      SELECT o.*, u.name as driver_name 
      FROM orders o 
      LEFT JOIN users u ON o.driver_id = u.id
      WHERE o.id = ?
    `).get(id);

    console.log(`[API] Broadcasting ORDER_UPDATED for order ${id}`);
    broadcast('ORDER_UPDATED', updatedOrder);
    res.json(updatedOrder);
  } catch (error: any) {
    console.error(`[API] Error updating order ${id}:`, error);
    res.status(400).json({ error: error.message });
  }
});

router.patch('/orders/:id/confirm', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare(`
      UPDATE orders 
      SET admin_confirmed = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);
    
    const updatedOrder = db.prepare(`
      SELECT o.*, u.name as driver_name 
      FROM orders o 
      LEFT JOIN users u ON o.driver_id = u.id
      WHERE o.id = ?
    `).get(id);

    broadcast('ORDER_UPDATED', updatedOrder);
    res.json(updatedOrder);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/orders/:id/notes', (req, res) => {
  const { driver_notes } = req.body;
  const { id } = req.params;
  try {
    db.prepare(`
      UPDATE orders 
      SET driver_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(driver_notes, id);
    
    const updatedOrder = db.prepare(`
      SELECT o.*, u.name as driver_name 
      FROM orders o 
      LEFT JOIN users u ON o.driver_id = u.id
      WHERE o.id = ?
    `).get(id);

    broadcast('ORDER_UPDATED', updatedOrder);
    res.json(updatedOrder);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- STOCK ---

router.get('/stock', (req, res) => {
  const { date } = req.query;
  let query = `
    SELECT ds.*, u.name as driver_name 
    FROM daily_stock ds 
    JOIN users u ON ds.driver_id = u.id
  `;
  
  if (date) {
    query += ` WHERE ds.date = '${date}'`;
  }
  
  query += ` ORDER BY ds.created_at DESC`;
  
  const stock = db.prepare(query).all();
  res.json(stock);
});

router.post('/stock', (req, res) => {
  const { driver_id, quantity_small, quantity_medium, quantity_large, date } = req.body;
  try {
    // Always insert a new record for each stock handout
    const result = db.prepare('INSERT INTO daily_stock (driver_id, quantity_small, quantity_medium, quantity_large, date) VALUES (?, ?, ?, ?, ?)')
      .run(driver_id, quantity_small, quantity_medium, quantity_large, date);

    const stockEntry = db.prepare(`
      SELECT ds.*, u.name as driver_name 
      FROM daily_stock ds 
      JOIN users u ON ds.driver_id = u.id
      WHERE ds.id = ?
    `).get(result.lastInsertRowid);

    broadcast('STOCK_UPDATED', stockEntry);
    res.json(stockEntry);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
