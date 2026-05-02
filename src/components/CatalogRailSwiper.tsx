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
  /** Portrait catalog cards vs wider live tiles */
  variant?: "poster" | "video";
};

export default function CatalogRailSwiper({ children, variant = "poster" }: CatalogRailSwiperProps) {
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
        spaceBetween={variant === "video" ? 18 : 16}
        slidesOffsetBefore={0}
        slidesOffsetAfter={0}
        watchOverflow
        grabCursor
        freeMode={{ enabled: true, momentum: true, momentumRatio: 0.88, minimumVelocity: 0.02 }}
        className={`catalog-swiper catalog-swiper--${variant} !overflow-visible pb-20 pt-2`}
        style={{ overflow: "visible" }}
        navigation
        onBeforeInit={(swiper) => {
          const n = swiper.params.navigation;
          if (n && typeof n !== "boolean") {
            n.prevEl = `.${prevClass}`;
            n.nextEl = `.${nextClass}`;
          }
        }}
      >
        {children}
      </Swiper>
    </div>
  );
}
