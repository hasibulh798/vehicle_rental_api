import { Router } from "express";
import auth from "../../middleware/auth";
import { bookingController } from "./booking.controller";

const router = Router();

router.post("/", auth("admin", "customer"), bookingController.createBooking);
router.get("/", auth("admin", "customer"), bookingController.getAllBookings);
router.put(
  "/:bookingId",
  auth("admin", "customer"),
  bookingController.updateBookings
);

export const bookingRoutes = router;
