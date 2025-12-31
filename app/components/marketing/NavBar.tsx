"use client";

import Link from "next/link";
import Route from "../../constants/Route";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const NavBar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NavLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
  ];

  const pathname = usePathname();
  const router = useRouter();

  const handleNavClick = (href: string) => {
    if (href.startsWith("#")) {
      const element = document.getElementById(href.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#D35A0F]/95 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href={Route.HOME} className="shrink-0">
            <Image
              src="/Logo.png"
              alt="Scan2Dish Logo"
              width={150}
              height={50}
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex gap-8 items-center">
            {NavLinks.map((item) => (
              <li key={item.name}>
                {item.href.startsWith("#") ? (
                  <button
                    onClick={() => handleNavClick(item.href)}
                    className={clsx(
                      "transition-all duration-300 hover:scale-105",
                      "text-gray-200 hover:text-white font-medium"
                    )}
                  >
                    {item.name}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={clsx(
                      "transition-all duration-300 hover:scale-105",
                      item.href === "/" && pathname === "/"
                        ? "text-white font-semibold underline underline-offset-8"
                        : "text-gray-200 hover:text-white font-medium"
                    )}
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex gap-3">
            <Button
              onClick={() => router.push(Route.LOGINPAGE)}
              className="bg-transparent border border-white text-white px-5 py-2 hover:bg-white hover:text-[#D35A0F] transition-all duration-300 hover:scale-105"
            >
              Login
            </Button>

            <Button
              onClick={() => router.push(Route.SIGNUPPAGE)}
              className="bg-white text-[#D35A0F] px-5 py-2 hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-md"
            >
              Sign Up Free
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 animate-in slide-in-from-top duration-300">
            {NavLinks.map((item) => (
              <div key={item.name}>
                {item.href.startsWith("#") ? (
                  <button
                    onClick={() => handleNavClick(item.href)}
                    className="block w-full text-left py-2 text-white hover:text-gray-200 transition-colors"
                  >
                    {item.name}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-white hover:text-gray-200 transition-colors"
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}

            <div className="pt-4 space-y-2 border-t border-white/20">
              <Button
                onClick={() => {
                  router.push(Route.LOGINPAGE);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-transparent border border-white text-white hover:bg-white hover:text-[#D35A0F] transition-colors"
              >
                Login
              </Button>

              <Button
                onClick={() => {
                  router.push(Route.SIGNUPPAGE);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-white text-[#D35A0F] hover:bg-gray-100 transition-colors"
              >
                Sign Up Free
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
