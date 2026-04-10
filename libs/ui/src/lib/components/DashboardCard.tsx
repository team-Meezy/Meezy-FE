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
    <div className="flex h-full min-h-[150px] flex-col justify-between rounded-[24px] border border-white/5 bg-[#1e1e1e] px-5 py-5 shadow-[0_20px_50px_rgba(0,0,0,0.28)] sm:min-h-[170px] sm:px-6 sm:py-6 xl:min-h-[185px] xl:px-7 xl:py-6">
      <div>
        <h3 className="mb-2 text-[clamp(1.1rem,1.4vw,1.4rem)] font-bold tracking-[-0.03em] text-white">
          {title}
        </h3>
        <p className="max-w-[28rem] break-keep text-[clamp(0.75rem,0.85vw,0.85rem)] leading-[1.6] text-[#8d93a7]">
          {description}
        </p>
      </div>

      <button
        className="mt-4 w-fit rounded-full bg-[#ff5c00] px-5 py-2 text-[clamp(0.75rem,0.9vw,0.85rem)] font-bold text-white transition-colors hover:bg-[#e65300] sm:px-6"
        onClick={onClick}
      >
        {buttonText}
      </button>
    </div>
  );
};
