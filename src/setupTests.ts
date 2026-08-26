import "@testing-library/jest-dom/vitest";
import "./i18n/index";

if (typeof window !== "undefined" && window.HTMLMediaElement) {
  window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  window.HTMLMediaElement.prototype.pause = () => {};
}
