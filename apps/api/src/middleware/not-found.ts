import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { failure } from "@/lib/api-response";

export function notFoundHandler(_req: Request, res: Response) {
  return res.status(StatusCodes.NOT_FOUND).json(failure("Route not found"));
}

