interface NexusLogoProps {
  showName?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: {
    icon: "h-10 w-10",
    name: "text-2xl",
  },
  md: {
    icon: "h-16 w-16",
    name: "text-5xl",
  },
  lg: {
    icon: "h-24 w-24",
    name: "text-7xl lg:text-8xl",
  },
};

export default function NexusLogo({
  showName = true,
  size = "lg",
}: NexusLogoProps) {
  const currentSize = sizes[size];

  return (
    <div className="flex items-center gap-6">
      <svg
        viewBox="0 0 100 100"
        aria-label="Logo de NEXUS"
        className={`${currentSize.icon} shrink-0 drop-shadow-[0_0_28px_rgba(37,99,235,0.4)]`}
      >
        <defs>
          <linearGradient
            id="nexus-logo-gradient"
            x1="10"
            y1="5"
            x2="90"
            y2="95"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#38BDF8" />
            <stop offset="0.52" stopColor="#2563EB" />
            <stop offset="1" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>

        <path
          d="M12 88V18L45 48V16L88 8V80L55 52V86L12 88Z"
          fill="url(#nexus-logo-gradient)"
        />

        <path
          d="M24 67V39L45 58V78L24 67Z"
          fill="#020817"
          fillOpacity="0.88"
        />

        <path
          d="M56 23L77 18V54L56 36V23Z"
          fill="#020817"
          fillOpacity="0.72"
        />

        <path
          d="M12 88L45 60V78L27 94L12 88Z"
          fill="#1E40AF"
        />
      </svg>

      {showName && (
        <span
          className={`${currentSize.name} font-black tracking-[-0.07em] text-white`}
        >
          NEXUS
        </span>
      )}
    </div>
  );
}