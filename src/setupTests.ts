import "@testing-library/jest-dom/vitest";
import "./i18n/index";
import { vi } from "vitest";

// Mock ResizeObserver
class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal("ResizeObserver", ResizeObserver);
