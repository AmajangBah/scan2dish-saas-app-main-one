"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";

const faqs = [
  {
    question: "How does Scan2Dish work?",
    answer:
      "Customers scan a QR code, view your digital menu, and place orders instantly. You receive the orders in real-time on your dashboard.",
  },
  {
    question: "Do I need new hardware or tablets?",
    answer:
      "Nope! Your existing phone, tablet, or laptop is enough to receive orders.",
  },
  {
    question: "Can I customize my restaurant’s menu?",
    answer:
      "Yes. Add images, descriptions, prices, availability statuses, and more.",
  },
  {
    question: "How much does it cost?",
    answer:
      "Scan2Dish uses a pay-as-you-serve model — you only pay when customers order.",
  },
  {
    question: "Can customers pay online?",
    answer: "Yes. We support card, mobile money, and online payment options.",
  },
  {
    question: "How do I get my restaurant on Scan2Dish?",
    answer:
      "Click 'Get Started' and complete the setup — it only takes a few minutes.",
  },
];

const FAQs = () => {
  return (
    <section className="bg-[#D35A0F] py-24 px-4 rounded-t-[40px] relative ">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-white text-sm opacity-70 mb-2 tracking-wide">FAQs</p>
        <h2 className="text-white text-3xl md:text-4xl font-semibold">
          Got Questions? We&apos;ve Got Answers.
        </h2>
      </div>

      {/* FAQ Accordion */}
      <div className="max-w-3xl mx-auto  space-y-4">
        <Accordion type="single" collapsible>
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-white/10 border border-white/20 rounded-xl px-4 my-5"
            >
              <AccordionTrigger className="text-left text-white hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>

              <AccordionContent className="text-white/80 pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <Image
        src="/wave2.svg"
        alt="Wave"
        width={1440}
        height={100}
        className="absolute bottom-[-200px] left-0 right-0"
      />
    </section>
  );
};

export default FAQs;
