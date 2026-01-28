import { z } from "zod";

export const loginFormSchema = z.object({
  email_or_phone_number: z.union([
    z.string().email({ message: "Invalid email address" }).toLowerCase(),
    z
      .string()
      .regex(/^[0-9]{10}$/, { message: "Invalid phone number" })
      .length(10, "Phone number must be 10 digits"),
  ]),
  password: z.string().max(30, "Password must be less than 30 characters"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

