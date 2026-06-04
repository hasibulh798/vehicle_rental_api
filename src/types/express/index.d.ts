// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         id: number;
//         name: string;
//         email: string;
//         role: "admin" | "customer";
//       };
//     }
//   }
// }

import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: number;
      name: string;
      email: string;
      role: "admin" | "customer";
    };
  }
}
