import FeatureCard from "./FeatureCard";

const FourthSection = () => {
  return (
    <section className="relative min-h-screen bg-white pt-5 flex flex-col items-center px-4 md:px-0">
      {/* Heading + Description */}
      <div className="flex flex-col items-center text-center">
        <h2 className="mb-4 text-3xl font-bold text-[#D35A0F]">
          Built for restaurants that hate stress.
        </h2>

        <p className="w-full max-w-2xl leading-relaxed text-gray-700">
          From busy cafes to fine dining — Scan2Dish helps you serve faster,
          earn more, and keep guests smiling.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="mt-10 flex flex-col gap-6 w-full max-w-6xl">
        <div className="flex flex-col md:flex-row gap-6">
          <FeatureCard
            Heading="⚡ Faster Orders, Happier Guests"
            Description="No waiting for menus or waiters. Guests order instantly from their table — less chaos, more satisfaction."
            gradient="linear-gradient(135deg, #FFE5D0, #FFFFFF)"
          />

          <FeatureCard
            Heading="📊 Real-Time Dashboard"
            Description="Every order appears instantly with the table ID. No shouting, no missed slips, just smooth operations."
          />
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <FeatureCard
            Heading="🚀 Boost Sales Effortlessly"
            Description="Promote specials, upsell combos, and highlight bestsellers automatically."
          />

          <FeatureCard
            Heading="👉 🧘‍♂️ Zero Tech Headache"
            Description="No downloads. No setup drama. Just print your QR codes and start serving."
            gradient="linear-gradient(135deg, #FFE5D0, #FFFFFF)"
          />
        </div>
      </div>
    </section>
  );
};

export default FourthSection;
