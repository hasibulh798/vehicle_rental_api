import { Request, Response } from "express";
import { userServices } from "./user.service";

//get all user
const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await userServices.getAllUsers();
    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: result.rows,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: "Internal server error!",
      errors: err.message || "Internal server error!",
    });
  }
};

// update user
const updateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await userServices.updateUser(
      req.body,
      userId as string,
      req.user as Record<string, any>
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
        errors: "User not found!",
      });
    }

    const { password, ...userWithoutPassword } = result.rows[0];

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: userWithoutPassword,
    });
  } catch (err: any) {
    let statusCode = 500;
    const msg = err.message || "";
    if (msg.includes("own profile") || msg.includes("change role")) {
      statusCode = 403;
    } else if (msg.includes("not found")) {
      statusCode = 404;
    } else if (msg.includes("required") || msg.includes("characters") || msg.includes("registered") || msg.includes("Role must be")) {
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      message: err.message || "Internal server error!",
      errors: err.message || "Internal server error!",
    });
  }
};

//delete user
const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await userServices.deleteUser(userId as string);
    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err: any) {
    let statusCode = 500;
    const msg = err.message || "";
    if (msg.includes("not found")) {
      statusCode = 404;
    } else if (msg.includes("active bookings")) {
      statusCode = 400;
    }
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Internal server error!",
      errors: err.message || "Internal server error!",
    });
  }
};
export const userController = {
  getAllUsers,
  updateUser,
  deleteUser,
};
