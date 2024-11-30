import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import userModal, { IUserFatchResponse } from "../model/models";
import { comparePassword, hashPassword } from "../utils/auth";

export const register = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { userName, email, password, confirmPassword } = req.body;

    const userValidation = z
      .object({
        userName: z
          .string()
          .min(2, { message: "Name must be at least 2 characters" }),
        email: z.string().email("Please provide a valid email"),
        password: z
          .string()
          .min(6, "Password must be at least 6 characters")
          .max(100, "passwords can not be that long"),
        confirmPassword: z
          .string()
          .min(6, "Confirm Password must be at least 6 characters"),
      })
      .superRefine(({ confirmPassword, password }, ctx) => {
        if (confirmPassword !== password) {
          ctx.addIssue({
            code: "custom",
            message: "The passwords did not match",
            path: ["confirmPassword"],
          });
        }
      });

    userValidation.parse(req.body);

    const existingUser = await userModal.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already in use" });
    }

    const hashedPassword = await hashPassword(password);
    await userModal.create({
      email: email,
      userName: userName,
      password: hashedPassword,
    });

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    // @ts-ignore
    if (error.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        // @ts-ignore
        issues: error.errors?.map((item, index) => item.message),
      });
    }
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(500).json({ error: errorMessage });
  }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    z.object({
      email: z.string().email("invalid crediantials"),
      password: z
        .string()
        .min(4, "invalid crediantials")
        .max(100, "invalid crediantials"),
    });
    const userTologin = (await userModal.findOne({
      email: email,
    })) as IUserFatchResponse;
    if (!userTologin) {
      return res.status(400).json({ error: "User does not exist" });
    }

    const isPasswordCorrect = await comparePassword(
      password,
      userTologin.password
    );
    if (!isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: userTologin._id },
      process.env.JSON_SECRET as string,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({ data: token });
  } catch (error) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(500).json({ error: errorMessage });
  }
};