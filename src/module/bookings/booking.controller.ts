import { Request, Response } from "express";
import { bookingServices } from "./booking.service";

const createBooking = async (req: Request, res: Response) => {
  try {
    const bookingResult = await bookingServices.createBooking(req.body);

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: bookingResult,
    });
  } catch (err: any) {
    let statusCode = 500;
    const msg = err.message || "";
    if (msg.includes("not found")) {
      statusCode = 404;
    } else if (msg.includes("required") || msg.includes("after rent start date") || msg.includes("not available")) {
      statusCode = 400;
    }
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Internal server error",
      errors: err.message || "Internal server error",
    });
  }
};

//get all bookings
const getAllBookings = async (req: Request, res: Response) => {
  try {
    const result = await bookingServices.getAllBookings(req.user);

    if (req.user?.role === "admin") {
      return res.status(200).json({
        success: true,
        message: "Bookings retrieved successfully",
        data: result.adminView,
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "Your bookings retrieved successfully",
        data: result.customerView,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errors: err.message || "Internal server error",
    });
  }
};

//update booking
const updateBookings = async (req: Request, res: Response) => {
  try {
    const result = await bookingServices.updateBookings(
      req.body,
      req.params.bookingId as string,
      req.user as Record<string, any>
    );
    if (req.user?.role === "customer") {
      return res.status(200).json({
        success: true,
        message: "Booking cancelled successfully",
        data: result.updateResult,
      });
    } else if (req.user?.role === "admin") {
      return res.status(200).json({
        success: true,
        message: "Booking marked as returned. Vehicle is now available",
        data: { ...result.updateResult, vehicle: result.updateVehicle },
      });
    } else {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
        errors: "Forbidden",
      });
    }
  } catch (err: any) {
    let statusCode = 500;
    const msg = err.message || "";
    if (msg.includes("not found")) {
      statusCode = 404;
    } else if (msg.includes("own bookings") || msg.includes("Only admin") || msg.includes("Only customers")) {
      statusCode = 403;
    } else if (msg.includes("already") || msg.includes("Invalid status")) {
      statusCode = 400;
    }
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Internal server error",
      errors: err.message || "Internal server error",
    });
  }
};
export const bookingController = {
  createBooking,
  getAllBookings,
  updateBookings,
};
