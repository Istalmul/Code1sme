import { z } from "zod";

/**
 * One schema per form, shared by the client (inline validation) and the route
 * handler (authoritative check), so the two can never drift apart.
 */

export const emailField = z
  .string()
  .trim()
  .min(1, "Enter your email address")
  .max(254, "That email address is too long")
  .email("That doesn't look like an email address")
  .transform((v) => v.toLowerCase());

export const passwordField = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(200, "That password is too long");

export const nameField = z
  .string()
  .trim()
  .min(1, "Enter your name")
  .max(80, "That name is too long");

export const codeField = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code");

export const signupSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password"),
});

export const verifySchema = z.object({
  challengeId: z.string().min(1),
  code: codeField,
});

export const resendSchema = z.object({ challengeId: z.string().min(1) });

export const forgotSchema = z.object({ email: emailField });

export const resetSchema = z.object({
  challengeId: z.string().min(1),
  password: passwordField,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
