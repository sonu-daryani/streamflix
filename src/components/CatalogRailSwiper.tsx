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
  variant?: "poster" | "video" | "landscape" | "top10";
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
  const wideRail = variant === "video" || variant === "landscape";
  const top10Rail = variant === "top10";

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
          top10Rail ? (relaxedGap ? 16 : 14) : relaxedGap ? 14 : 12
        }
        breakpoints={{
          640: {
            spaceBetween: top10Rail
              ? relaxedGap
                ? 22
                : 18
              : relaxedGap
                ? wideRail
                  ? 20
                  : 18
                : wideRail
                  ? 24
                  : 24,
          },
          768: {
            spaceBetween: top10Rail
              ? relaxedGap
                ? 28
                : 24
              : relaxedGap
                ? wideRail
                  ? 28
                  : 24
                : wideRail
                  ? 32
                  : 32,
          },
        }}
        slidesOffsetBefore={0}
        slidesOffsetAfter={0}
        watchOverflow
        grabCursor
        freeMode={{ enabled: true, momentum: true, momentumRatio: 0.88, minimumVelocity: 0.02 }}
        className={`catalog-swiper catalog-swiper--${
          variant === "landscape" ? "landscape" : variant === "top10" ? "top10" : variant
        } !overflow-visible pt-1 ${relaxedGap ? "pb-6 md:pb-12 md:pt-2" : "pb-10 md:pb-20 md:pt-2"}`}
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
