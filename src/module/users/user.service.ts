import bcrypt from "bcrypt";
import { pool } from "../../database/db";

// Get all user
const getAllUsers = async () => {
  const result = await pool.query(`
    SELECT id, name,email, phone, role FROM users`);
  return result;
};

//update user
const updateUser = async (
  payload: Record<string, unknown>,
  id: string,
  currentUser: Record<string, any>
) => {
  const { name, email, password, phone, role } = payload;

  // 1. Check if user exists
  const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [id]);
  if (userCheck.rows.length === 0) {
    throw new Error("User not found!");
  }

  // 2. Authorization checks
  if (currentUser.role !== "admin") {
    if (currentUser.id !== Number(id)) {
      throw new Error("You can update only your own profile");
    }

    if (role) {
      throw new Error("You are not allowed to change role");
    }
  }

  // 3. Email validation & duplicate check
  let normalizedEmail = undefined;
  if (email) {
    normalizedEmail = (email as string).toLowerCase();
    const checkEmail = await pool.query("SELECT id FROM users WHERE email = $1 AND id != $2", [normalizedEmail, id]);
    if (checkEmail.rows.length > 0) {
      throw new Error("Email is already registered!");
    }
  }

  // 4. Password validation & hashing
  let hashPassword = undefined;
  if (password) {
    if (typeof password !== "string" || password.length < 6) {
      throw new Error("Password must be at least 6 characters long!");
    }
    hashPassword = await bcrypt.hash(password, 12);
  }

  // 5. Role check
  if (role && role !== "admin" && role !== "customer") {
    throw new Error("Role must be either 'admin' or 'customer'!");
  }

  const result = await pool.query(
    `
    UPDATE users
    SET
      name = COALESCE($1, name),
      email = COALESCE($2, email),
      password = COALESCE($3, password),
      phone = COALESCE($4, phone),
      role = COALESCE($5, role)
    WHERE id = $6
    RETURNING *;
    `,
    [
      name || null,
      normalizedEmail || null,
      hashPassword || null,
      phone || null,
      role || null,
      id
    ]
  );
  return result;
};

//delete user
const deleteUser = async (id: string) => {
  // 1. Check if user exists
  const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [id]);
  if (userCheck.rows.length === 0) {
    throw new Error("User not found!");
  }

  // 2. Check for active bookings
  const booking = await pool.query(
    `SELECT id FROM bookings WHERE customer_id=$1 AND status='active'`,
    [id]
  );

  if (booking.rows.length > 0) {
    throw new Error("Cannot delete user with active bookings");
  }

  const result = await pool.query(
    `
    DELETE FROM users WHERE id=$1
    `,
    [id]
  );
  return result;
};
export const userServices = {
  getAllUsers,
  updateUser,
  deleteUser,
};
