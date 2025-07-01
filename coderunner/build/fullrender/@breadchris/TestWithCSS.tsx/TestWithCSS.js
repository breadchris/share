// coderunner/src/@breadchris/TestWithCss.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function TestWithCSS() {
  return /* @__PURE__ */ jsxs("div", { className: "test-container", children: [
    /* @__PURE__ */ jsx("h1", { className: "test-title", children: "Test Component with CSS" }),
    /* @__PURE__ */ jsx("p", { className: "test-description", children: "This component imports CSS to test the fullrender endpoint." }),
    /* @__PURE__ */ jsxs("div", { className: "test-grid", children: [
      /* @__PURE__ */ jsx("div", { className: "test-card", children: "Card 1" }),
      /* @__PURE__ */ jsx("div", { className: "test-card", children: "Card 2" }),
      /* @__PURE__ */ jsx("div", { className: "test-card", children: "Card 3" })
    ] })
  ] });
}
export {
  TestWithCSS as default
};
