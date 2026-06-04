import { pool } from "../../database/db";

const formatDate = (date: any) => {
  if (!date) return date;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

//Create bookings
export const createBooking = async (payload: Record<string, unknown>) => {
  const { customer_id, vehicle_id, rent_start_date, rent_end_date } = payload;

  if (!customer_id || !vehicle_id || !rent_start_date || !rent_end_date) {
    throw new Error("All fields are required!");
  }

  // 1. Check if customer exists
  const customerResult = await pool.query(
    `SELECT id FROM users WHERE id=$1`,
    [customer_id]
  );
  if (customerResult.rows.length === 0) {
    throw new Error("Customer not found");
  }

  // 2. Check if vehicle exists
  const vehicleResult = await pool.query(
    `SELECT vehicle_name, daily_rent_price, availability_status FROM vehicles WHERE id=$1`,
    [vehicle_id]
  );
  if (vehicleResult.rows.length === 0) {
    throw new Error("Vehicle not found");
  }

  const vehicle = vehicleResult.rows[0];
  if (vehicle.availability_status !== "available") {
    throw new Error("Vehicle not available");
  }

  // 3. Date validation & price calculation
  const start = new Date(rent_start_date as string);
  const end = new Date(rent_end_date as string);
  if (end <= start) {
    throw new Error("Rent end date must be after rent start date!");
  }

  const number_of_days = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const total_price = vehicle.daily_rent_price * number_of_days;

  const bookingResult = await pool.query(
    `INSERT INTO bookings
      (customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status)
     VALUES ($1,$2,$3,$4,$5,'active') RETURNING *`,
    [customer_id, vehicle_id, rent_start_date, rent_end_date, total_price]
  );

  // 4. Update vehicle status
  await pool.query(
    `UPDATE vehicles SET availability_status='booked' WHERE id=$1`,
    [vehicle_id]
  );

  const booking = bookingResult.rows[0];
  booking.rent_start_date = formatDate(booking.rent_start_date);
  booking.rent_end_date = formatDate(booking.rent_end_date);
  booking.vehicle = {
    vehicle_name: vehicle.vehicle_name,
    daily_rent_price: vehicle.daily_rent_price,
  };

  return booking;
};

//get All bookings
export const getAllBookings = async (user: any) => {
  if (user.role === "admin") {
    const query = `
      SELECT 
        b.id, b.customer_id, b.vehicle_id, b.rent_start_date, b.rent_end_date, b.total_price, b.status,
        u.name as customer_name, u.email as customer_email,
        v.vehicle_name, v.registration_number
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN vehicles v ON b.vehicle_id = v.id
      ORDER BY b.id ASC
    `;
    const res = await pool.query(query);
    const data = res.rows.map((row) => ({
      id: row.id,
      customer_id: row.customer_id,
      vehicle_id: row.vehicle_id,
      rent_start_date: formatDate(row.rent_start_date),
      rent_end_date: formatDate(row.rent_end_date),
      total_price: row.total_price,
      status: row.status,
      customer: {
        name: row.customer_name,
        email: row.customer_email,
      },
      vehicle: {
        vehicle_name: row.vehicle_name,
        registration_number: row.registration_number,
      },
    }));
    return { adminView: data, customerView: [] };
  } else {
    const query = `
      SELECT 
        b.id, b.vehicle_id, b.rent_start_date, b.rent_end_date, b.total_price, b.status,
        v.vehicle_name, v.registration_number, v.type
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.customer_id = $1
      ORDER BY b.id ASC
    `;
    const res = await pool.query(query, [user.id]);
    const data = res.rows.map((row) => ({
      id: row.id,
      vehicle_id: row.vehicle_id,
      rent_start_date: formatDate(row.rent_start_date),
      rent_end_date: formatDate(row.rent_end_date),
      total_price: row.total_price,
      status: row.status,
      vehicle: {
        vehicle_name: row.vehicle_name,
        registration_number: row.registration_number,
        type: row.type,
      },
    }));
    return { adminView: [], customerView: data };
  }
};

//update booking
export const updateBookings = async (
  body: Record<string, unknown>,
  bookingId: string,
  currentUser: Record<string, any>
) => {
  const { status } = body;

  // 1. Fetch booking details
  const bookingRes = await pool.query(`SELECT * FROM bookings WHERE id=$1`, [
    bookingId,
  ]);
  if (bookingRes.rows.length === 0) throw new Error("Booking not found");

  const booking = bookingRes.rows[0];
  const vehicleId = booking.vehicle_id;

  // Role-based validation
  if (status === "cancelled") {
    if (currentUser.role !== "customer") {
      throw new Error("Only customers can cancel bookings");
    }
    if (booking.customer_id !== currentUser.id) {
      throw new Error("You can cancel only your own bookings");
    }
    if (booking.status !== "active") {
      throw new Error(`Booking is already ${booking.status}`);
    }
  } else if (status === "returned") {
    if (currentUser.role !== "admin") {
      throw new Error("Only admin can mark booking as returned");
    }
    if (booking.status !== "active") {
      throw new Error(`Booking is already ${booking.status}`);
    }
  } else {
    throw new Error("Invalid status update!");
  }

  // 2. Update booking status
  const result = await pool.query(
    `UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *`,
    [status, bookingId]
  );

  // 3. If cancelled or returned → vehicle available
  if (status === "cancelled" || status === "returned") {
    await pool.query(
      `UPDATE vehicles SET availability_status='available' WHERE id=$1`,
      [vehicleId]
    );
  }

  const updateResult = result.rows[0];
  updateResult.rent_start_date = formatDate(updateResult.rent_start_date);
  updateResult.rent_end_date = formatDate(updateResult.rent_end_date);

  const vehicle = await pool.query(
    `SELECT availability_status FROM vehicles WHERE id=$1`,
    [vehicleId]
  );
  const updateVehicle = vehicle.rows[0];
  return { updateResult, updateVehicle };
};

export const bookingServices = {
  createBooking,
  getAllBookings,
  updateBookings,
};
