import { Card, CardHeader } from "@/components/ui/card";

interface FeatureCardProps {
  Heading: string;
  Description: string;
  gradient?: string; // optional background gradient
}

const FeatureCard = ({ Heading, Description, gradient }: FeatureCardProps) => {
  const cardStyle = gradient ? { background: gradient } : undefined;

  return (
    <Card
      style={cardStyle}
      className="w-full rounded-lg border border-[#D35A0F] shadow-lg"
    >
      <CardHeader className="flex flex-col gap-4 p-6">
        <h3 className="text-2xl font-bold leading-relaxed text-[#D35A0F]">
          {Heading}
        </h3>

        <p className="leading-relaxed text-gray-700">{Description}</p>
      </CardHeader>
    </Card>
  );
};

export default FeatureCard;
