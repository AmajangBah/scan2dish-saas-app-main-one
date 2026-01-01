import { Card } from "@/components/ui/card";

interface TestimonialSectionProps {
  comment: string;
  businessOwnerName: string;
  businessOwnerRole: string;
  businessOwnerImageUrl: string;
  bgColor?: string;
}

const TestimonialSectionCard = ({
  comment,
  businessOwnerName,
  businessOwnerImageUrl,
  businessOwnerRole,
  bgColor,
}: TestimonialSectionProps) => {
  return (
    <Card
      style={bgColor ? { background: bgColor } : undefined}
      className="
        w-[90%] 
        max-w-2xl 
        rounded-3xl 
        bg-white 
        shadow-xl 
        border 
        p-8
        flex 
        flex-col 
        gap-6
      "
    >
      {/* Comment */}
      <p className="text-xl text-gray-800 font-medium leading-relaxed">
        {comment}
      </p>

      {/* Owner Info */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 text-base">
            {businessOwnerName}
          </span>

          <span className="text-sm text-gray-500">{businessOwnerRole}</span>
        </div>

        {/* Profile Image */}
        <div className="h-14 w-14 rounded-full overflow-hidden shadow-md border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={businessOwnerImageUrl}
            alt={businessOwnerName}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </Card>
  );
};

export default TestimonialSectionCard;
