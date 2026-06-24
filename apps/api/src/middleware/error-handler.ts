import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { failure } from "@/lib/api-response";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(StatusCodes.BAD_REQUEST).json(failure("Validation failed", error.flatten()));
  }

  if (error instanceof Error) {
    return res.status(StatusCodes.BAD_REQUEST).json(failure(error.message));
  }

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(failure("Unexpected server error"));
}

