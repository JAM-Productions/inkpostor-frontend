import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock i18next and react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
        return key;
    },
    i18n: {
      changeLanguage: () => Promise.resolve(),
      language: "en",
    },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: () => {},
  },
  Trans: ({ children, i18nKey }: any) => {
      // In RoleReveal.test.tsx, it's expecting "Inkpostor" but the key is "role.impostor"
      // In GameResult.test.tsx, it's expecting the name "Impostor" or "Player 3"
      // The current Trans implementation in components might be causing issues if mocked like this
      return children || i18nKey;
  }
}));

vi.mock("i18next", () => ({
  default: {
    use: () => ({
      init: () => {},
    }),
    t: (key: string) => key,
  },
}));
