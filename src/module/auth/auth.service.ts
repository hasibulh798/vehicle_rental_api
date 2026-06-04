import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../../config";
import { pool } from "../../database/db";

const secret = config.secret;

const signupUser = async (payload: Record<string, unknown>) => {
  const { name, email, password, phone, role } = payload;
  if (!name || !email || !password || !phone || !role) {
    throw new Error("All fields are required!");
  }

  const normalizedEmail = (email as string).toLowerCase();

  if (typeof password !== "string" || password.length < 6) {
    throw new Error("Password must be at least 6 characters long!");
  }

  if (role !== "admin" && role !== "customer") {
    throw new Error("Role must be either 'admin' or 'customer'!");
  }

  const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
  if (existingUser.rows.length > 0) {
    throw new Error("Email is already registered!");
  }

  const hashPassword = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `INSERT INTO users (name, email, password, phone, role) VALUES($1, $2, $3, $4, $5) RETURNING *`,
    [name, normalizedEmail, hashPassword, phone, role]
  );
  return result;
};

const loginUser = async (email: string, password: string) => {
  if (!email || !password) {
    throw new Error("Email and password are required!");
  }

  const normalizedEmail = email.toLowerCase();
  const user = await pool.query(`SELECT * FROM users WHERE email=$1`, [normalizedEmail]);

  if (user.rows.length === 0) {
    throw new Error("Invalid Credentials!");
  }
  const matchPassword = await bcrypt.compare(password, user.rows[0].password);

  if (!matchPassword) {
    throw new Error("Invalid Credentials!");
  }
  const jwtPayload = {
    id: user.rows[0].id,
    name: user.rows[0].name,
    email: user.rows[0].email,
    role: user.rows[0].role,
  };

  const token = jwt.sign(jwtPayload, secret as string, { expiresIn: "7d" });

  return { token, user: user.rows[0] };
};

export const authServices = {
  signupUser,
  loginUser,
};
