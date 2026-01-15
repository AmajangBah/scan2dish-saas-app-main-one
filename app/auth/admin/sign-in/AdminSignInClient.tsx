"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createBrowserSupabase } from "@/lib/supabase/client";

const AdminLoginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AdminLoginValues = z.infer<typeof AdminLoginSchema>;

export default function AdminSignInClient({ redirect }: { redirect?: string }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const form = useForm<AdminLoginValues>({
    resolver: zodResolver(AdminLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: AdminLoginValues) {
    setLoading(true);
    setErrorMsg("");

    try {
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;
      if (!data.user) throw new Error("Login failed");

      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("id, is_active")
        .eq("user_id", data.user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (!adminUser) {
        await supabase.auth.signOut();
        throw new Error("Not an admin account. Please sign in at /login.");
      }

      // Use router.replace() to redirect to admin dashboard
      router.replace(redirect || "/admin");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-10 flex flex-col justify-center">
      <div className="text-center space-y-2 mb-6">
        <Link href="/">
          <h1 className="text-4xl font-bold">
            <span className="text-black">Scan</span>
            <span className="text-[#C84501]">2Dish</span>
          </h1>
        </Link>
        <p className="text-gray-600 text-lg mt-2">Admin sign-in</p>
      </div>

      {errorMsg && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {errorMsg}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Email"
                    {...field}
                    className="rounded-xl border border-orange-600 bg-orange-50 p-5"
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
                    className="rounded-xl border border-orange-600 bg-orange-50 p-5"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-[#111827] hover:bg-black text-white rounded-xl p-5 text-lg"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-gray-600 mt-4 text-sm">
        Restaurant owner?{" "}
        <Link href="/login" className="text-[#C84501] font-medium">
          Sign in here
        </Link>
      </p>
    </div>
  );
}
