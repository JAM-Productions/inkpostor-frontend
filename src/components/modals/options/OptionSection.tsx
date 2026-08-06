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
    className="rounded-2xl border border-stone-800 bg-stone-800/40 p-4 sm:p-5"
    data-testid={testId}
  >
    <div className="flex items-center justify-between gap-4">
      <div className="flex gap-3 items-start">
        <div className={`rounded-xl p-2 h-fit ${iconClassName}`}>{icon}</div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            {title}
          </h3>
          <p className="mt-1 text-sm text-stone-400">{description}</p>
          {notice}
        </div>
      </div>
      {children}
    </div>
  </section>
);
