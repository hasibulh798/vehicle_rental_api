import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config";
import { pool } from "../database/db";

const secret = config.secret;

const auth = (...roles: ("admin" | "customer")[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Token not provided!",
          errors: "Token not provided!",
        });
      }

      let decoded: JwtPayload;

      try {
        decoded = jwt.verify(token, secret as string) as JwtPayload;
      } catch (err: any) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token!",
          errors: err.message || "Invalid or expired token!",
        });
      }

      // Find user in DB
      const userResult = await pool.query(
        `SELECT id, name, email, role FROM users WHERE email=$1`,
        [decoded.email]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found!",
          errors: "User not found!",
        });
      }

      const user = userResult.rows[0];

      // attach logged-in user to req
      req.user = user;

      // Role authorization check
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied!",
          errors: "Access denied!",
        });
      }

      next();
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Authentication failed!",
        errors: error.message || "Authentication failed!",
      });
    }
  };
};

export default auth;
