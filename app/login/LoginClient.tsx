"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Route from "@/app/constants/Route";

import { createBrowserSupabase } from "@/lib/supabase/client";
import Image from "next/image";

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof LoginSchema>;

export default function LoginClient({ redirectTo }: { redirectTo: string }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginValues) {
    setLoading(true);
    setErrorMsg("");

    try {
      const supabase = createBrowserSupabase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;
      if (!data.session) throw new Error("Login failed");

      // Optional admin blocking logic remains intact
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("id")
        .eq("user_id", data.user?.id)
        .eq("is_active", true)
        .maybeSingle();

      if (adminUser) {
        await supabase.auth.signOut();
        throw new Error("Admin accounts must sign in at /auth/admin/sign-in");
      }

      // ✅ Normal client redirect
      router.replace(redirectTo || Route.DASHBOARD);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Login failed");
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
          <div className="text-center space-y-2 mb-6">
            <Link href={Route.HOME}>
              <h1 className="text-5xl font-bold">
                <span className="text-black">Scan</span>
                <span className="text-[#C84501]">2Dish</span>
              </h1>
            </Link>

            <p className="text-gray-600 text-2xl my-4">
              Welcome back, login to continue
            </p>
          </div>

          <h2 className="text-xl font-semibold mb-4">Login</h2>

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
                className="w-full bg-[#C84501] hover:bg-orange-800 text-white rounded-xl p-5 text-lg"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-gray-600 mt-4">
            Don&apos;t have an account?{" "}
            <Link
              href={Route.SIGNUPPAGE}
              className="text-[#C84501] font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
