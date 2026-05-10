"use client";

import { useId } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper } from "swiper/react";
import { FreeMode, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";

type CatalogRailSwiperProps = {
  children: React.ReactNode;
  variant?: "poster" | "video";
  /** Wider gaps between slides + calmer padding — e.g. homepage rails */
  relaxedGap?: boolean;
};

export default function CatalogRailSwiper({
  children,
  variant = "poster",
  relaxedGap = false,
}: CatalogRailSwiperProps) {
  const reactId = useId().replace(/:/g, "");
  const prevClass = `catalog-rail-prev-${reactId}`;
  const nextClass = `catalog-rail-next-${reactId}`;

  return (
    <div className="catalog-rail-wrap group/rail relative">
      <button
        type="button"
        className={`${prevClass} catalog-rail-nav catalog-rail-nav--prev`}
        aria-label="Previous titles"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={2} />
      </button>
      <button
        type="button"
        className={`${nextClass} catalog-rail-nav catalog-rail-nav--next`}
        aria-label="Next titles"
      >
        <ChevronRight className="h-6 w-6" strokeWidth={2} />
      </button>

      <Swiper
        modules={[Navigation, FreeMode]}
        slidesPerView="auto"
        spaceBetween={
          relaxedGap ? (variant === "video" ? 14 : 14) : variant === "video" ? 12 : 12
        }
        breakpoints={{
          640: {
            spaceBetween: relaxedGap
              ? variant === "video"
                ? 20
                : 18
              : variant === "video"
                ? 24
                : 24,
          },
          768: {
            spaceBetween: relaxedGap
              ? variant === "video"
                ? 28
                : 24
              : variant === "video"
                ? 32
                : 32,
          },
        }}
        slidesOffsetBefore={0}
        slidesOffsetAfter={0}
        watchOverflow
        grabCursor
        freeMode={{ enabled: true, momentum: true, momentumRatio: 0.88, minimumVelocity: 0.02 }}
        className={`catalog-swiper catalog-swiper--${variant} !overflow-visible pt-1 ${relaxedGap ? "pb-6 md:pb-12 md:pt-2" : "pb-10 md:pb-20 md:pt-2"}`}
        style={{ overflow: "visible" }}
        navigation={{
          prevEl: `.${prevClass}`,
          nextEl: `.${nextClass}`,
        }}
      >
        {children}
      </Swiper>
    </div>
  );
}
