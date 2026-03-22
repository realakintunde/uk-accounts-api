const db = require('../database/config');
const bcrypt = require('bcryptjs');

// In-memory storage for demo mode
const inMemoryUsers = new Map();
let nextUserId = 1;

class User {
  static async findById(id) {
    if (!db.isConnected()) {
      const user = Array.from(inMemoryUsers.values()).find(u => u.id === id);
      return user ? { ...user } : null;
    }
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    if (!db.isConnected()) {
      const user = inMemoryUsers.get(email);
      return user ? { ...user } : null;
    }
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async create(data) {
    const { email, password, first_name, last_name, role = 'user' } = data;
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!db.isConnected()) {
      const id = nextUserId++;
      const newUser = {
        id,
        email,
        password_hash: hashedPassword,
        first_name,
        last_name,
        role,
        created_at: new Date()
      };
      inMemoryUsers.set(email, newUser);
      return { id, email, first_name, last_name, role, created_at: new Date() };
    }

    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, role, created_at
    `;
    const result = await db.query(query, [
      email,
      hashedPassword,
      first_name,
      last_name,
      role,
    ]);
    return result.rows[0];
  }

  static async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }

  static async update(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.keys(data).forEach((key) => {
      updates.push(`${key} = $${paramCount}`);
      values.push(data[key]);
      paramCount++;
    });

    values.push(id);
    const query = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, role, active
    `;
    const result = await db.query(query, values);
    return result.rows[0];
  }
}

module.exports = User;
