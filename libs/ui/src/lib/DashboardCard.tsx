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
    <div className="bg-[#1e1e1e] rounded-2xl px-8 py-12 flex flex-col justify-between min-h-[280px]">
      <div>
        <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
        <p className="text-gray-400 leading-relaxed text-sm break-keep">
          {description}
        </p>
      </div>

      <button
        className="mt-8 bg-[#ff5c00] hover:bg-[#e65300] text-white font-bold py-3 px-6 rounded-full w-fit transition-colors"
        onClick={onClick}
      >
        {buttonText}
      </button>
    </div>
  );
};
