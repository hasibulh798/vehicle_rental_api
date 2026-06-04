import { pool } from "../../database/db";

const createVehicle = async (
  payload: Record<string, unknown>,
  user: Record<string, any>
) => {
  const {
    vehicle_name,
    type,
    registration_number,
    daily_rent_price,
    availability_status,
  } = payload;

  if (
    !vehicle_name ||
    !type ||
    !registration_number ||
    !daily_rent_price ||
    !availability_status
  ) {
    throw new Error("All fields are required!");
  }

  if (user.role !== "admin") {
    throw new Error("Admin only");
  }

  if (!["car", "bike", "van", "SUV"].includes(type as string)) {
    throw new Error("Type must be one of 'car', 'bike', 'van', 'SUV'!");
  }

  if (typeof daily_rent_price !== "number" || daily_rent_price <= 0) {
    throw new Error("Daily rent price must be a positive number!");
  }

  if (!["available", "booked"].includes(availability_status as string)) {
    throw new Error("Availability status must be either 'available' or 'booked'!");
  }

  const checkReg = await pool.query("SELECT id FROM vehicles WHERE registration_number = $1", [registration_number]);
  if (checkReg.rows.length > 0) {
    throw new Error("Registration number is already registered!");
  }

  const result = await pool.query(
    `INSERT INTO vehicles (vehicle_name, type, registration_number, daily_rent_price, availability_status) VALUES($1, $2, $3, $4, $5) RETURNING *`,
    [
      vehicle_name,
      type,
      registration_number,
      daily_rent_price,
      availability_status,
    ]
  );
  return result;
};

// Get all vehicles
const getAllVehicles = async () => {
  const result = await pool.query(`
    SELECT * FROM vehicles`);
  return result;
};

//Get Vehicle by ID
const getVehicleById = async (id: string) => {
  const result = await pool.query(
    `
    SELECT * FROM vehicles WHERE id=$1
    `,
    [id]
  );
  return result;
};

//update vehicle
const updateVehicle = async (payload: Record<string, unknown>, id: string) => {
  const {
    vehicle_name,
    type,
    registration_number,
    daily_rent_price,
    availability_status,
  } = payload;

  const checkVehicle = await pool.query("SELECT id FROM vehicles WHERE id = $1", [id]);
  if (checkVehicle.rows.length === 0) {
    throw new Error("Vehicle not found");
  }

  if (type && !["car", "bike", "van", "SUV"].includes(type as string)) {
    throw new Error("Type must be one of 'car', 'bike', 'van', 'SUV'!");
  }

  if (daily_rent_price !== undefined && (typeof daily_rent_price !== "number" || daily_rent_price <= 0)) {
    throw new Error("Daily rent price must be a positive number!");
  }

  if (availability_status && !["available", "booked"].includes(availability_status as string)) {
    throw new Error("Availability status must be either 'available' or 'booked'!");
  }

  if (registration_number) {
    const checkReg = await pool.query("SELECT id FROM vehicles WHERE registration_number = $1 AND id != $2", [registration_number, id]);
    if (checkReg.rows.length > 0) {
      throw new Error("Registration number is already registered!");
    }
  }

  const result = await pool.query(
    `
    UPDATE vehicles SET vehicle_name=COALESCE($1, vehicle_name), type=COALESCE($2, type), registration_number=COALESCE($3,registration_number), daily_rent_price=COALESCE($4,daily_rent_price), availability_status=COALESCE($5,availability_status) WHERE id=$6 RETURNING *`,
    [
      vehicle_name || null,
      type || null,
      registration_number || null,
      daily_rent_price !== undefined ? daily_rent_price : null,
      availability_status || null,
      id,
    ]
  );
  return result;
};

//delete vehicle
const deleteVehicle = async (id: string) => {
  const vehicle = await pool.query(
    `SELECT availability_status FROM vehicles WHERE id=$1`,
    [id]
  );

  if (vehicle.rows.length === 0) {
    throw new Error("Vehicle not found");
  }

  const activeBookings = await pool.query(
    `SELECT id FROM bookings WHERE vehicle_id=$1 AND status='active'`,
    [id]
  );
  if (activeBookings.rows.length > 0) {
    throw new Error("Cannot delete. Active bookings exist for this vehicle.");
  }

  const result = await pool.query(
    `
    DELETE FROM vehicles WHERE id=$1
    `,
    [id]
  );
  return result;
};
export const vehicleServices = {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
};
