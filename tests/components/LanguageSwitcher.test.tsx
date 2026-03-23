import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LanguageSwitcher } from "../../src/components/LanguageSwitcher";

const changeLanguageMock = vi.fn();

// Mock useTranslation hook
vi.mock("react-i18next", async () => {
  const actual = await vi.importActual("react-i18next");
  return {
    ...actual,
    useTranslation: () => ({
      i18n: {
        language: "en",
        changeLanguage: changeLanguageMock,
      },
    }),
  };
});

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders correctly with the default language", () => {
    render(<LanguageSwitcher />);

    // Check if the select element is present and has the correct default value
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue("en");

    // Check if all language options are rendered
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Català" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Español" })).toBeInTheDocument();
  });

  it("calls i18n.changeLanguage when a new language is selected", () => {
    render(<LanguageSwitcher />);

    const select = screen.getByRole("combobox");

    // Simulate changing the language to Spanish
    fireEvent.change(select, { target: { value: "es" } });

    // Verify that the changeLanguage function was called with the correct argument
    expect(changeLanguageMock).toHaveBeenCalledTimes(1);
    expect(changeLanguageMock).toHaveBeenCalledWith("es");
  });

  it("calls i18n.changeLanguage when Catalan is selected", () => {
    render(<LanguageSwitcher />);

    const select = screen.getByRole("combobox");

    // Simulate changing the language to Catalan
    fireEvent.change(select, { target: { value: "ca" } });

    // Verify that the changeLanguage function was called with the correct argument
    expect(changeLanguageMock).toHaveBeenCalledTimes(1);
    expect(changeLanguageMock).toHaveBeenCalledWith("ca");
  });

  it("calls i18n.changeLanguage which should trigger localStorage update", () => {
    // For this test, we simulate the side effect that src/i18n/index.ts would have
    // by making the mocked changeLanguage write the selected language to localStorage.
    changeLanguageMock.mockImplementationOnce((lang: string) => {
      localStorage.setItem("inkpostor_language", lang);
    });

    render(<LanguageSwitcher />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "es" } });

    expect(changeLanguageMock).toHaveBeenCalledWith("es");
    expect(localStorage.getItem("inkpostor_language")).toBe("es");
  });
});
