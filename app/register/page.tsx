"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Route from "@/app/constants/Route";

import { createBrowserSupabase } from "@/lib/supabase/client";
import { z } from "zod";

// ----------------------
// ZOD SCHEMA
// ----------------------
export const SignupFormSchema = z
  .object({
    businessName: z.string().min(1, "Business name is required"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    phone: z.string().min(8, "Phone number must be at least 10 digits"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type SignupValues = z.infer<typeof SignupFormSchema>;

// ----------------------
// COMPONENT
// ----------------------
const SignupPage = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<SignupValues>({
    resolver: zodResolver(SignupFormSchema),
    defaultValues: {
      businessName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignupValues) {
    setLoading(true);
    setErrorMsg("");

    try {
      const supabase = createBrowserSupabase();

      // 1️⃣ Sign up user with metadata
      // The database trigger will automatically create a restaurant record
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
          data: {
            business_name: values.businessName,
            phone: values.phone,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("User not created");

      // 2️⃣ Triggers automatically create restaurant and onboarding_progress
      // No need to verify - the database guarantees this happens
      // Trust the trigger and move to confirmation page
      window.location.href = "/register/confirmation";

      form.reset();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Signup failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <div className="text-center space-y-2 mb-10">
        <Link href={Route.HOME}>
          <h1 className="text-4xl font-bold">
            <span className="text-black">Scan</span>
            <span className="text-[#C84501]">2Dish</span>
          </h1>
        </Link>
        <p className="text-gray-600 text-center my-4 text-2xl">
          Welcome, create your account to get started
        </p>
      </div>

      <h2 className="text-xl font-semibold mb-4">Sign Up</h2>

      {errorMsg && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {errorMsg}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Business Name"
                    {...field}
                    className="rounded-xl border border-[#C84501] bg-orange-50 p-5 "
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Email"
                    {...field}
                    className="rounded-xl border border-[#C84501] bg-orange-50 p-5 "
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Phone Number"
                    {...field}
                    className="rounded-xl border border-[#C84501] bg-orange-50 p-5 "
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Password"
                    {...field}
                    className="rounded-xl border border-[#C84501] bg-orange-50 p-5 "
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    {...field}
                    className="rounded-xl border border-[#C84501] bg-orange-50 p-5 "
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-orange-700 hover:bg-orange-800 text-white rounded-xl p-5 text-lg"
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-gray-600 mt-4">
        Already have an account?{" "}
        <Link href={Route.LOGINPAGE} className="text-[#C84501] font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default SignupPage;
