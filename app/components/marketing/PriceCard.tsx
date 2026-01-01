"use client";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PriceCardProps {
  heading: string;
  description: string;
  price: string;
  exampleText: string;
  buttonText: string;
  buttonColor?: string;
  starImageUrl?: string;
  onButtonClick?: () => void;
}

const PriceCard = ({
  heading,
  description,
  price,
  exampleText,
  buttonText,
  buttonColor = "#D65A00",
  starImageUrl,
  onButtonClick,
}: PriceCardProps) => {
  return (
    <Card className="relative w-full max-w-[650px] rounded-3xl border-3 border-[#e35300] p-10 shadow-lg bg-white hover:shadow-2xl transition-all duration-300 hover:scale-105">
      {/* Star Icon (top-right) */}
      {starImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={starImageUrl}
          alt="Star"
          className="absolute top-6 right-6 w-14 opacity-20"
        />
      )}

      <CardHeader className="space-y-4">
        <h2 className="text-4xl font-semibold text-[#d65a00]">{heading}</h2>
        <p className="text-gray-700 text-lg max-w-[90%]">{description}</p>
      </CardHeader>

      <CardContent className="space-y-6 mt-6">
        <div className="flex items-end gap-3">
          <span className="text-5xl font-bold text-[#d65a00]">{price}</span>
          <span className="text-gray-700 text-lg">commission per order</span>
        </div>

        <p className="text-gray-500 text-base">{exampleText}</p>
      </CardContent>

      <CardFooter className="mt-8">
        <Button
          onClick={onButtonClick}
          className="w-full text-white py-6 rounded-xl text-lg hover:opacity-90 transition-all duration-300 hover:scale-105"
          style={{ backgroundColor: buttonColor }}
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PriceCard;
