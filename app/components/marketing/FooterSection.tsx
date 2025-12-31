"use client";
import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  MapPin,
  Globe,
  InstagramIcon,
  FacebookIcon,
  TwitterIcon,
} from "lucide-react";

const footerSections = [
  {
    title: "Product",
    links: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "How it Works", href: "#features" },
      { name: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Get Started",
    links: [
      { name: "Sign Up", href: "/register" },
      { name: "Login", href: "/login" },
      { name: "Dashboard", href: "/dashboard" },
      { name: "Admin", href: "/admin" },
    ],
  },
];

const contactInfo = [
  { icon: Mail, text: "hello@scandish.app" },
  { icon: MapPin, text: "The Gambia, West Africa" },
  { icon: Globe, text: "@ScanDishHQ" },
];

const FooterSection = () => {
  return (
    <footer className="relative bg-[#D35A0F] text-white pt-40 pb-10 overflow-hidden mt-100">
      {/* Top Wave */}
      <div className="absolute -top-20 left-0 right-0 w-full">
        <Image
          src="/wave3.svg"
          alt="Decorative Wave"
          width={1480}
          height={120}
          className="w-full"
          priority
        />
      </div>

      {/* Footer Content */}
      <div className="container mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
        {/* Logo */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Image
              src="/Logo.png"
              alt="Scan2Dish Logo"
              width={150}
              height={50}
            />
          </div>
          <p className="text-sm text-white/80 max-w-xs">
            Serving simplicity, one scan at a time.
          </p>
        </div>

        {/* Dynamic Footer Sections */}
        {footerSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
            <ul className="space-y-2 text-white/80 text-sm">
              {section.links.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="hover:underline hover:text-white"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Contact Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Get in Touch</h3>
          <ul className="space-y-3 text-white/80 text-sm">
            {contactInfo.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon size={18} />
                {text}
              </li>
            ))}
          </ul>

          {/* Socials */}
          <div className="flex items-center gap-4 mt-6 text-white/80">
            <Link href="https://instagram.com/scan2dish" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <InstagramIcon size={20} />
            </Link>

            <Link href="https://facebook.com/scan2dish" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <FacebookIcon size={20} />
            </Link>

            <Link href="https://twitter.com/scan2dish" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <TwitterIcon size={20} />
            </Link>

            <Link href="https://tiktok.com/@scan2dish" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <Image src="/tiktok.svg" alt="TikTok" width={20} height={20} />
            </Link>
          </div>
        </div>
      </div>

      <p className="text-center text-white/70 text-sm mt-10">
        © 2025 ScanDish. All rights reserved.
      </p>
    </footer>
  );
};
export default FooterSection;
