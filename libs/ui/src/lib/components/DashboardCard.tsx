'use client';

interface DashboardCardProps {
  title: string;
  description: React.ReactNode;
  buttonText: string;
  onClick: () => void;
}

export const DashboardCard = ({
  title,
  description,
  buttonText,
  onClick,
}: DashboardCardProps) => {
  return (
    <div className="flex h-full min-h-[170px] flex-col justify-between rounded-[24px] border border-white/5 bg-[#1e1e1e] px-5 py-5 shadow-[0_20px_50px_rgba(0,0,0,0.28)] sm:min-h-[190px] sm:px-6 sm:py-6 xl:min-h-[210px] xl:px-8 xl:py-7">
      <div>
        <h3 className="mb-3 text-[clamp(1.2rem,1.7vw,1.65rem)] font-bold tracking-[-0.03em] text-white">
          {title}
        </h3>
        <p className="max-w-[28rem] break-keep text-[clamp(0.78rem,0.95vw,0.92rem)] leading-[1.7] text-[#8d93a7]">
          {description}
        </p>
      </div>

      <button
        className="mt-5 w-fit rounded-full bg-[#ff5c00] px-6 py-2.5 text-[clamp(0.78rem,1vw,0.92rem)] font-bold text-white transition-colors hover:bg-[#e65300] sm:px-7"
        onClick={onClick}
      >
        {buttonText}
      </button>
    </div>
  );
};
