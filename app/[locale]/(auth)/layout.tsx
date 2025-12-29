import Image from "next/image";
import React from "react";

interface AuthlayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthlayoutProps) => {
  return (
    <section className="min-h-screen flex flex-row   ">
      <div className="h-screen flex items-center justify-center w-[50%] bg-[#FAF2E6]">
        <Image src={"/soup.png"} alt="soup-image" height={100} width={800} />
      </div>
      {children}
    </section>
  );
};

export default AuthLayout;
