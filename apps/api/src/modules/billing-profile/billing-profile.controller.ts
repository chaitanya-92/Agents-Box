import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { failure, success } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const billingProfileSchema = z.object({
  companyName:  z.string().max(200).optional(),
  gstin:        z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format").optional().or(z.literal("")),
  pan:          z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format").optional().or(z.literal("")),
  phone:        z.string().min(10).max(15),
  addressLine1: z.string().min(3).max(300),
  addressLine2: z.string().max(300).optional(),
  city:         z.string().min(2).max(100),
  state:        z.string().min(2).max(100),
  pinCode:      z.string().regex(/^[1-9][0-9]{5}$/, "Invalid PIN code"),
});

export async function getBillingProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(StatusCodes.UNAUTHORIZED).json(failure("Authentication required"));
    const profile = await prisma.billingProfile.findUnique({ where: { userId: req.user.id } });
    return res.status(StatusCodes.OK).json(success(profile));
  } catch (err) { next(err); }
}

export async function upsertBillingProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(StatusCodes.UNAUTHORIZED).json(failure("Authentication required"));
    const data = billingProfileSchema.parse(req.body);

    // Normalise optional fields
    const payload = {
      companyName:  data.companyName  || null,
      gstin:        data.gstin        || null,
      pan:          data.pan          || null,
      phone:        data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 || null,
      city:         data.city,
      state:        data.state,
      pinCode:      data.pinCode,
    };

    const profile = await prisma.billingProfile.upsert({
      where:  { userId: req.user.id },
      create: { userId: req.user.id, ...payload },
      update: { ...payload },
    });

    return res.status(StatusCodes.OK).json(success(profile, "Billing profile saved"));
  } catch (err) { next(err); }
}
