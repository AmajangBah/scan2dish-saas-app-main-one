"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import Route from "@/app/constants/Route";
import { createBrowserSupabase } from "@/lib/supabase/client";

// ----------------------
// SCHEMA
// ----------------------
export const SignupFormSchema = z
  .object({
    businessName: z.string().min(1, "Business name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(7, "Phone number must be at least 8 digits"),
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
export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

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

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            business_name: values.businessName,
            phone: values.phone,
          },
        },
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("User creation failed");
      }

      // If session exists → go to onboarding
      if (data.session) {
        router.replace(Route.ONBOARDING);
      } else {
        // Otherwise → go to login
        router.replace(
          `${Route.LOGINPAGE}?email=${encodeURIComponent(values.email)}`,
        );
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Signup failed. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-pink-100 items-center justify-center p-8">
        <Image
          src="/soup.png"
          alt="Delicious food"
          width={400}
          height={400}
          className="object-contain"
          priority
        />
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md flex flex-col">
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
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 flex flex-col"
            >
              {[
                "businessName",
                "email",
                "phone",
                "password",
                "confirmPassword",
              ].map((name) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name as never}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          type={name.includes("password") ? "password" : "text"}
                          placeholder={
                            name === "businessName"
                              ? "Business Name"
                              : name === "confirmPassword"
                                ? "Confirm Password"
                                : name[0].toUpperCase() + name.slice(1)
                          }
                          className="rounded-xl border border-[#C84501] bg-orange-50 p-5"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

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
      </div>
    </div>
  );
}
