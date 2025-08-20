import React from "react";
import { ArrowRight, Star, CheckCircle } from "lucide-react";

// eslint-disable-next-line no-unused-vars
const testimonials = Array.from({ length: 10 }).map((_, i) => ({
  name: "Evan Dorsey",
  title: "Restaurant Owner",
  image: "https://randomuser.me/api/portraits/men/45.jpg",
  review:
    "Switching to digital menus has drastically improved our efficiency. Customers love the convenience, and our staff has more time to focus on service. Highly recommend this solution to any modern restaurant.",
}));

const TestimonialSection = () => {
  return (
    <div className="bg-[#fffef5] py-16">
      <div className="text-center mb-12">
        <p className="text-sm text-gray-500">
          {"{ What Our Clients Are Saying }"}
        </p>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mt-2">
          Real Stories From Satisfied Customers
        </h2>
      </div>

      <div className="overflow-hidden space-y-8">
        {/* First Row - Right to Left */}
        <div className="w-full whitespace-nowrap animate-marquee-right">
          <div className="inline-flex gap-6">
            {testimonials.map((t, i) => (
              <div
                key={`r1-${i}`}
                className="min-w-[300px] max-w-xs bg-white rounded-xl border p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.title}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed text-wrap">
                  {t.review}
                </p>
                <div className="flex gap-1">
                  {Array(5)
                    .fill(0)
                    .map((_, idx) => (
                      <Star
                        key={idx}
                        className="w-4 h-4 text-yellow-400 fill-yellow-400"
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Second Row - Left to Right */}
        <div className="w-full whitespace-nowrap animate-marquee-left">
          <div className="inline-flex gap-6">
            {testimonials.map((t, i) => (
              <div
                key={`r2-${i}`}
                className="min-w-[300px] max-w-xs bg-white rounded-xl border p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.title}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed text-wrap">
                  {t.review}
                </p>
                <div className="flex gap-1">
                  {Array(5)
                    .fill(0)
                    .map((_, idx) => (
                      <Star
                        key={idx}
                        className="w-4 h-4 text-yellow-400 fill-yellow-400"
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
       {/* @keyframes marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-100%); }
       }
        .animate-marquee {
         animation: marquee 20s linear infinite;
         display: flex;
         width: fit-content;
        }  */}
        
        @keyframes marquee-right {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes marquee-left {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}
.animate-marquee-right {
  animation: marquee-right 30s linear infinite;
  display: flex;
  width: fit-content;
}
.animate-marquee-left {
  animation: marquee-left 30s linear infinite;
  display: flex;
  width: fit-content;
}

    `}</style>
    </div>
  );
};

export default TestimonialSection;
