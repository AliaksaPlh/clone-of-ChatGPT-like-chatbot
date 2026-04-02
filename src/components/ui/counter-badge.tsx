type CounterBadgeProps = {
  value: number;
};

export const CounterBadge = ({ value }: CounterBadgeProps) => {
  return (
    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-black">
      {value}
    </span>
  );
};
