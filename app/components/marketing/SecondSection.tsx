import Image from "next/image";
import FeatureCard from "./FeatureCard";

const SecondSection = () => {
  return (
    <section className="relative min-h-screen bg-white pt-5 flex flex-col items-center px-4 md:px-0">
      {/* Heading + Description */}
      <div className="flex flex-col items-center text-center">
        <h2 className="mb-4 text-3xl font-bold text-[#D35A0F]">
          Turn tables into tech
        </h2>

        <p className="w-full max-w-2xl leading-relaxed text-gray-700">
          With Scan2Dish, every table becomes a smart menu. Guests scan a QR
          code, browse your dishes, and order instantly — no apps, no fuss.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="mt-10 flex flex-col gap-6 w-full max-w-6xl">
        <div className="flex flex-col md:flex-row gap-6">
          <FeatureCard
            Heading="⚡ Instant Orders"
            Description="The moment a guest confirms their meal, your kitchen gets it — no delays, no miscommunication, no waiting for a waiter."
            gradient="linear-gradient(135deg, #FFE5D0, #FFFFFF)"
          />

          <FeatureCard
            Heading="🧠 Smart Analytics"
            Description="Understand what customers love with easy insights into your best-selling meals and busiest times.."
          />
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <FeatureCard
            Heading="📱 No App Needed"
            Description="No downloads, no sign-ups, no hassle. Just scan, browse, and order—straight from the browser."
          />

          <FeatureCard
            Heading="🪄 Fully Customizable"
            Description="Make changes whenever you want. Add new dishes, adjust prices, or update photos with zero stress."
            gradient="linear-gradient(135deg, #FFE5D0, #FFFFFF)"
          />
        </div>
      </div>
    </section>
  );
};

export default SecondSection;
