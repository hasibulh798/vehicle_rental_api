import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { vehicleServices } from "./vehicle.service";

const createVehicle = async (req: Request, res: Response) => {
  try {
    const result = await vehicleServices.createVehicle(
      req.body,
      req.user as JwtPayload
    );

    return res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: result.rows[0],
    });
  } catch (err: any) {
    let statusCode = 500;
    const msg = err.message || "";
    if (msg.includes("required") || msg.includes("positive number") || msg.includes("registered") || msg.includes("must be one of")) {
      statusCode = 400;
    }
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Internal server error",
      errors: err.message || "Internal server error",
    });
  }
};

//Get All vehicles
const getAllVehicles = async (req: Request, res: Response) => {
  try {
    const result = await vehicleServices.getAllVehicles();
    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No vehicles found",
        data: [],
      });
    }
    return res.status(200).json({
      success: true,
      message: "Vehicles retrieved successfully",
      data: result.rows,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errors: err.message || "Internal server error",
    });
  }
};

//Get vehicle by id
const getVehicleById = async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;
    const result = await vehicleServices.getVehicleById(vehicleId as string);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found!",
        errors: "Vehicle not found!",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Vehicle retrieved successfully",
      data: result.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errors: err.message || "Internal server error",
    });
  }
};

//update vehicle
const updateVehicle = async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;

    const result = await vehicleServices.updateVehicle(
      req.body,
      vehicleId as string
    );
    return res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      data: result.rows[0],
    });
  } catch (err: any) {
    let statusCode = 500;
    const msg = err.message || "";
    if (msg.includes("not found")) {
      statusCode = 404;
    } else if (msg.includes("positive number") || msg.includes("registered") || msg.includes("must be one of")) {
      statusCode = 400;
    }
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Internal server error",
      errors: err.message || "Internal server error",
    });
  }
};

//Delete vehicle
const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;

    await vehicleServices.deleteVehicle(vehicleId as string);
    return res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (err: any) {
    let statusCode = 500;
    const msg = err.message || "";
    if (msg.includes("not found")) {
      statusCode = 404;
    } else if (msg.includes("Active bookings") || msg.includes("booked")) {
      statusCode = 400;
    }
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Internal server error",
      errors: err.message || "Internal server error",
    });
  }
};

export const vehicleControllers = {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
};
