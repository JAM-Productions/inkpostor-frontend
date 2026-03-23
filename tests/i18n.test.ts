import { describe, it, expect, vi, beforeEach } from "vitest";
import { createI18nInstance, LANGUAGE_KEY } from "../src/i18n/index";

describe("i18n initialization", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("initializes with language from localStorage", async () => {
    localStorage.setItem(LANGUAGE_KEY, "es");

    const i18n = createI18nInstance();
    // i18next init is sometimes async internally but often returns immediately if resources are provided
    // For safety, let's wait if needed or just check properties if they are sync.
    // Given resources are provided in init, language should be set synchronously.

    expect(i18n.language).toBe("es");
  });

  it("defaults to 'en' when localStorage is empty", () => {
    const i18n = createI18nInstance();
    expect(i18n.language).toBe("en");
  });

  it("defaults to 'en' when localStorage contains unsupported language", () => {
    localStorage.setItem(LANGUAGE_KEY, "fr");
    const i18n = createI18nInstance();
    expect(i18n.language).toBe("en");
  });

  it("updates localStorage when language is changed", async () => {
    const i18n = createI18nInstance("en");

    await i18n.changeLanguage("ca");
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe("ca");
  });

  it("handles localStorage errors gracefully", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage disabled');
    });

    const i18n = createI18nInstance();

    expect(i18n.language).toBe("en");
    getItemSpy.mockRestore();
  });
});
