// coderunner/src/@breadchris/ComponentCard.tsx
import { useState, useRef } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var ComponentCard = ({
  component,
  onClick,
  size = "medium",
  showPreview = true,
  className = "",
  isPinned = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const iframeRef = useRef(null);
  const sizeClasses = {
    small: "w-40 h-40",
    medium: "w-56 h-56",
    large: "w-72 h-56"
  };
  const textSizeClasses = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg"
  };
  const getCategoryColor = (category) => {
    const colorMap = {
      "UI Library": "from-green-500 to-green-600",
      "Core": "from-blue-500 to-blue-600",
      "AI Tools": "from-purple-500 to-purple-600",
      "Social": "from-pink-500 to-pink-600",
      "Development": "from-orange-500 to-orange-600",
      "Forms": "from-teal-500 to-teal-600",
      "Data Visualization": "from-indigo-500 to-indigo-600",
      "Overlays": "from-gray-500 to-gray-600",
      "Games": "from-red-500 to-red-600",
      "Authentication": "from-yellow-500 to-yellow-600",
      "Admin": "from-cyan-500 to-cyan-600",
      "Utilities": "from-slate-500 to-slate-600"
    };
    return colorMap[category] || "from-gray-500 to-gray-600";
  };
  const getCategoryIcon = (category) => {
    const iconMap = {
      "UI Library": "\u{1F3A8}",
      "Core": "\u26A1",
      "AI Tools": "\u{1F916}",
      "Social": "\u{1F465}",
      "Development": "\u{1F4BB}",
      "Forms": "\u{1F4DD}",
      "Data Visualization": "\u{1F4CA}",
      "Overlays": "\u{1FA9F}",
      "Games": "\u{1F3AE}",
      "Authentication": "\u{1F510}",
      "Admin": "\u2699\uFE0F",
      "Utilities": "\u{1F527}"
    };
    return iconMap[category] || "\u{1F4E6}";
  };
  const handleCardClick = () => {
    if (onClick) {
      onClick(component);
    } else {
      window.open(`/coderunner/render/${encodeURIComponent(component.path)}`, "_blank");
    }
  };
  const handlePreviewLoad = () => {
    setPreviewLoaded(true);
    setPreviewError(false);
  };
  const handlePreviewError = () => {
    setPreviewError(true);
    setPreviewLoaded(false);
  };
  const getPreviewImageUrl = () => {
    return `https://via.placeholder.com/200x120/6366f1/ffffff?text=${encodeURIComponent(component.name)}`;
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `
                group relative overflow-hidden rounded-xl cursor-pointer
                transform transition-all duration-200 ease-out
                hover:scale-105 hover:shadow-xl hover:shadow-black/20
                ${sizeClasses[size]}
                ${className}
                ${isHovered ? "z-10" : "z-0"}
            `,
      onClick: handleCardClick,
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      children: [
        /* @__PURE__ */ jsx("div", { className: `
                absolute inset-0 bg-gradient-to-br ${getCategoryColor(component.category)}
                transition-all duration-300
                ${isHovered ? "opacity-90" : "opacity-100"}
            ` }),
        /* @__PURE__ */ jsxs("div", { className: `absolute inset-0 flex flex-col ${size === "large" ? "p-4" : size === "medium" ? "p-3" : "p-2"}`, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
            /* @__PURE__ */ jsx("span", { className: `${size === "large" ? "text-2xl" : size === "medium" ? "text-xl" : "text-lg"}`, children: getCategoryIcon(component.category) }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              isPinned && /* @__PURE__ */ jsx("div", { className: `bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full font-bold ${size === "large" ? "text-sm" : "text-xs"}`, children: "\u{1F4CC}" }),
              component.isFeatured && /* @__PURE__ */ jsx("div", { className: `bg-blue-400 text-blue-900 px-2 py-1 rounded-full font-bold ${size === "large" ? "text-sm" : "text-xs"}`, children: "\u2B50" })
            ] })
          ] }),
          showPreview && size !== "small" && /* @__PURE__ */ jsx("div", { className: "flex-1 mb-3 relative", children: !imageError ? /* @__PURE__ */ jsx(
            "img",
            {
              src: getPreviewImageUrl(),
              alt: `${component.name} preview`,
              className: "w-full h-full object-cover rounded-lg bg-white/20",
              onError: () => setImageError(true)
            }
          ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full rounded-lg bg-white/20 flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: `text-white/60 ${size === "large" ? "text-sm" : "text-xs"}`, children: "No Preview" }) }) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-auto", children: [
            /* @__PURE__ */ jsx("h3", { className: `
                        text-white font-bold leading-tight truncate
                        ${textSizeClasses[size]}
                    `, children: component.displayName }),
            size !== "small" && /* @__PURE__ */ jsxs("p", { className: `text-white/80 truncate ${size === "large" ? "text-sm" : "text-xs"}`, children: [
              "by ",
              component.author
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: `
                absolute inset-0 bg-black/40 flex flex-col justify-end
                transition-opacity duration-200
                ${isHovered && size !== "small" ? "opacity-100" : "opacity-0"}
                ${size === "large" ? "p-4" : size === "medium" ? "p-3" : "p-2"}
            `, children: /* @__PURE__ */ jsxs("div", { className: "text-white", children: [
          /* @__PURE__ */ jsx("h3", { className: `font-bold mb-1 ${size === "large" ? "text-base" : "text-sm"}`, children: component.displayName }),
          component.description && /* @__PURE__ */ jsx("p", { className: `text-white/90 line-clamp-2 mb-2 ${size === "large" ? "text-sm" : "text-xs"}`, children: component.description }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1 mb-2", children: [
            component.tags.slice(0, size === "large" ? 4 : 3).map((tag, index) => /* @__PURE__ */ jsx(
              "span",
              {
                className: `px-2 py-1 bg-white/20 rounded-full text-white/90 ${size === "large" ? "text-xs" : "text-xs"}`,
                children: tag
              },
              index
            )),
            component.tags.length > (size === "large" ? 4 : 3) && /* @__PURE__ */ jsxs("span", { className: `px-2 py-1 bg-white/20 rounded-full text-white/90 ${size === "large" ? "text-xs" : "text-xs"}`, children: [
              "+",
              component.tags.length - (size === "large" ? 4 : 3)
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: `text-white/70 ${size === "large" ? "text-xs" : "text-xs"}`, children: [
            "Updated ",
            new Date(component.lastModified).toLocaleDateString()
          ] })
        ] }) }),
        size === "small" && isHovered && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/60 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-white text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs font-medium", children: component.displayName }),
          /* @__PURE__ */ jsx("div", { className: "text-xs opacity-80", children: component.category })
        ] }) })
      ]
    }
  );
};
var AllSoftwareCard = ({
  onClick,
  componentCount,
  size = "medium"
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const sizeClasses = {
    small: "w-40 h-40",
    medium: "w-56 h-56",
    large: "w-72 h-56"
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `
                group relative overflow-hidden rounded-xl cursor-pointer
                transform transition-all duration-200 ease-out
                hover:scale-105 hover:shadow-xl hover:shadow-black/20
                ${sizeClasses[size]}
                ${isHovered ? "z-10" : "z-0"}
            `,
      onClick,
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-slate-600 to-slate-700" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-20", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 grid-rows-4 gap-1 p-2 h-full", children: Array.from({ length: 16 }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "bg-white rounded-sm" }, i)) }) }),
        /* @__PURE__ */ jsxs("div", { className: `absolute inset-0 flex flex-col items-center justify-center text-white ${size === "large" ? "p-6" : size === "medium" ? "p-4" : "p-3"}`, children: [
          /* @__PURE__ */ jsx("div", { className: `mb-3 ${size === "large" ? "text-4xl" : size === "medium" ? "text-3xl" : "text-2xl"}`, children: "\u{1F4F1}" }),
          /* @__PURE__ */ jsx("h3", { className: `font-bold text-center mb-2 ${size === "large" ? "text-lg" : size === "medium" ? "text-base" : "text-sm"}`, children: "All Software" }),
          /* @__PURE__ */ jsxs("p", { className: `text-white/80 text-center ${size === "large" ? "text-sm" : size === "medium" ? "text-sm" : "text-xs"}`, children: [
            componentCount,
            " components"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: `
                absolute inset-0 bg-white/10
                transition-opacity duration-200
                ${isHovered ? "opacity-100" : "opacity-0"}
            ` })
      ]
    }
  );
};
export {
  AllSoftwareCard,
  ComponentCard
};
