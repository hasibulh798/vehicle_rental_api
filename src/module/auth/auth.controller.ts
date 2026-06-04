import { Request, Response } from "express";
import { authServices } from "./auth.service";

// Sign up Controller
const signupController = async (req: Request, res: Response) => {
  try {
    const result = await authServices.signupUser(req.body);
    const { password, ...userWithoutPassword } = result.rows[0];
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: userWithoutPassword,
    });
  } catch (err: any) {
    const isValidationError = err.message.includes("required") || 
                              err.message.includes("characters") || 
                              err.message.includes("role") || 
                              err.message.includes("registered");
    return res.status(isValidationError ? 400 : 500).json({
      success: false,
      message: err.message || "Internal server error",
      errors: err.message || "Internal server error",
    });
  }
};

// signin Controller
const signinController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authServices.loginUser(email, password);
    const { password: string, ...userWithoutPassword } = result.user;
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { token: result.token, user: userWithoutPassword },
    });
  } catch (err: any) {
    const isValidationError = err.message.includes("required") || err.message.includes("Credentials");
    return res.status(isValidationError ? 400 : 500).json({
      success: false,
      message: err.message || "Internal server error",
      errors: err.message || "Internal server error",
    });
  }
};

export const authController = {
  signupController,
  signinController,
};
