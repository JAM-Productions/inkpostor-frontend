import React from "react";

interface OptionSectionProps {
  children: React.ReactNode;
  icon: React.ReactNode;
  iconClassName: string;
  title: string;
  description: string;
  notice?: React.ReactNode;
  testId?: string;
}

export const OptionSection: React.FC<OptionSectionProps> = ({
  children,
  icon,
  iconClassName,
  notice,
  title,
  description,
  testId,
}) => (
  <section
    className="rounded-[18px_6px_20px_7px] border-2 border-stone-950 bg-[#181512] p-4 sm:p-5 shadow-[3px_3px_0px_#0c0b09]"
    data-testid={testId}
  >
    <div className="flex items-center justify-between gap-4">
      <div className="flex gap-3 items-start">
        <div
          className={`rounded-[12px_4px_14px_4px] border-2 border-stone-950 p-2.5 h-fit shadow-[2px_2px_0px_#000] ${iconClassName}`}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-base font-handwritten font-bold uppercase tracking-wider text-white">
            {title}
          </h3>
          <p className="mt-0.5 text-base font-handwritten text-amber-200/70">
            {description}
          </p>
          {notice}
        </div>
      </div>
      {children}
    </div>
  </section>
);
