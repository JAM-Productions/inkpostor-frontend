import React from "react";
import { OptionSection } from "./OptionSection";
import { OptionSwitch } from "./OptionSwitch";

interface ToggleOptionSectionProps {
  checked: boolean;
  description: string;
  disabled: boolean;
  icon: React.ReactNode;
  iconClassName: string;
  label: string;
  onChange: () => void;
  testId?: string;
  title: string;
  tone: "emerald" | "indigo" | "pink";
}

export const ToggleOptionSection: React.FC<ToggleOptionSectionProps> = ({
  checked,
  description,
  disabled,
  icon,
  iconClassName,
  label,
  onChange,
  testId,
  title,
  tone,
}) => (
  <OptionSection
    icon={icon}
    iconClassName={iconClassName}
    title={title}
    description={description}
    testId={testId}
  >
    <OptionSwitch
      checked={checked}
      disabled={disabled}
      label={label}
      onChange={onChange}
      tone={tone}
    />
  </OptionSection>
);
