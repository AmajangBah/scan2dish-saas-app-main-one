"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function OrderTrackerPage() {
  const { tableId, orderId } = useParams();

  return (
    <div className="min-h-screen bg-white flex flex-col p-6 items-center">
      <h2 className="text-2xl font-bold mt-6">Order #{orderId}</h2>

      {/* Progress bar */}
      <div className="bg-white shadow-lg p-6 rounded-2xl w-full mt-10 space-y-6">
        {/* Steps */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center">
            <div className="w-5 h-5 bg-orange-700 rounded-full" />
            <span className="text-xs mt-1">Received</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-5 h-5 bg-orange-700 rounded-full" />
            <span className="text-xs mt-1">Been prepared</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-5 h-5 bg-orange-700 rounded-full" />
            <span className="text-xs mt-1">Ready for delivery</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-5 h-5 bg-gray-300 rounded-full" />
            <span className="text-xs mt-1">Completed</span>
          </div>
        </div>

        {/* ETA */}
        <div className="text-center">
          <p className="text-gray-700">Estimated preparation time</p>
          <p className="text-2xl font-bold mt-1">7–15 minutes</p>
        </div>

        <Link
          href={`/menu/${tableId}/browse`}
          className="bg-orange-700 text-white w-full text-center block py-3 rounded-xl font-medium"
        >
          Back to menu
        </Link>
      </div>
    </div>
  );
}
