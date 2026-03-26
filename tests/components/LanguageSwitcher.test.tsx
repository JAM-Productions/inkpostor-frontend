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

    // Check if the trigger button is present
    const button = screen.getByRole("button", { name: /select language/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("English");
  });

  it("opens the dropdown when the button is clicked", () => {
    render(<LanguageSwitcher />);

    const button = screen.getByRole("button", { name: /select language/i });
    fireEvent.click(button);

    // Check if all language options are rendered
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Català" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Español" })).toBeInTheDocument();
  });

  it("calls i18n.changeLanguage when a new language is selected", () => {
    render(<LanguageSwitcher />);

    const button = screen.getByRole("button", { name: /select language/i });
    fireEvent.click(button);

    // Simulate changing the language to Spanish
    const spanishOption = screen.getByRole("option", { name: "Español" });
    fireEvent.click(spanishOption);

    // Verify that the changeLanguage function was called with the correct argument
    expect(changeLanguageMock).toHaveBeenCalledTimes(1);
    expect(changeLanguageMock).toHaveBeenCalledWith("es");

    // Dropdown should be closed after selection
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("calls i18n.changeLanguage when Catalan is selected", () => {
    render(<LanguageSwitcher />);

    const button = screen.getByRole("button", { name: /select language/i });
    fireEvent.click(button);

    // Simulate changing the language to Catalan
    const catalanOption = screen.getByRole("option", { name: "Català" });
    fireEvent.click(catalanOption);

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

    const button = screen.getByRole("button", { name: /select language/i });
    fireEvent.click(button);

    const spanishOption = screen.getByRole("option", { name: "Español" });
    fireEvent.click(spanishOption);

    expect(changeLanguageMock).toHaveBeenCalledWith("es");
    expect(localStorage.getItem("inkpostor_language")).toBe("es");
  });

  it("closes the dropdown when clicking outside", () => {
    render(<LanguageSwitcher />);

    const button = screen.getByRole("button", { name: /select language/i });
    fireEvent.click(button);

    expect(screen.getByRole("listbox")).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
