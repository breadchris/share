// coderunner/src/@breadchris/ComponentBrowser.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var ComponentBrowser = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [repoSearchQuery, setRepoSearchQuery] = useState("");
  const [files, setFiles] = useState([]);
  const [components, setComponents] = useState([]);
  const [expandedDirs, setExpandedDirs] = useState(/* @__PURE__ */ new Set());
  const [currentPath, setCurrentPath] = useState("");
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [currentView, setCurrentView] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(/* @__PURE__ */ new Set());
  const [previewErrors, setPreviewErrors] = useState(/* @__PURE__ */ new Set());
  const [previewLoaded, setPreviewLoaded] = useState(/* @__PURE__ */ new Set());
  const [fullScreenPreview, setFullScreenPreview] = useState(null);
  const [selectedComponentExport, setSelectedComponentExport] = useState("");
  const [selectedDetailExport, setSelectedDetailExport] = useState("");
  const loadingTimeouts = useRef(/* @__PURE__ */ new Map());
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedDirectory, setSelectedDirectory] = useState(null);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneStatus, setCloneStatus] = useState("");
  const [loadedDirectories, setLoadedDirectories] = useState(/* @__PURE__ */ new Set([""]));
  const [loadingDirectories, setLoadingDirectories] = useState(/* @__PURE__ */ new Set());
  const [directoryChildren, setDirectoryChildren] = useState(/* @__PURE__ */ new Map());
  const [pinnedFiles, setPinnedFiles] = useState(/* @__PURE__ */ new Set());
  const [isLoadingPinnedFiles, setIsLoadingPinnedFiles] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const checkGithubAuth = async () => {
    try {
      const response = await fetch("/coderunner/user", {
        credentials: "include"
      });
      if (response.ok) {
        const userData = await response.json();
        if (userData.username) {
          setUsername(userData.username);
          setIsLoggedIn(true);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Auth check error:", error);
      return false;
    }
  };
  const fetchGithubRepositories = async () => {
    if (!isLoggedIn) return;
    setIsLoadingRepos(true);
    try {
      const response = await fetch("/coderunner/repositories", {
        credentials: "include"
      });
      if (response.ok) {
        const repos = await response.json();
        setRepositories(repos);
      }
    } catch (error) {
      console.error("Error fetching repositories:", error);
    } finally {
      setIsLoadingRepos(false);
    }
  };
  const handleRepoSelection = async (repoFullName) => {
    try {
      const response = await fetch("/coderunner/select-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ repository: repoFullName })
      });
      if (response.ok) {
        setSelectedRepo(repoFullName);
        setShowRepoSelector(false);
        loadFiles();
      }
    } catch (error) {
      console.error("Error selecting repository:", error);
    }
  };
  const handleCloneRepository = async () => {
    if (!selectedRepo) return;
    setIsCloning(true);
    setCloneStatus("Cloning repository...");
    try {
      const response = await fetch("/coderunner/clone-repo", {
        method: "POST",
        credentials: "include"
      });
      if (response.ok) {
        const result = await response.json();
        setCloneStatus(result.message || "Repository cloned successfully");
        await loadFiles();
        setTimeout(() => {
          setCloneStatus("");
        }, 3e3);
      } else {
        const errorData = await response.json();
        setCloneStatus(errorData.error || "Failed to clone repository");
      }
    } catch (error) {
      console.error("Error cloning repository:", error);
      setCloneStatus("Error cloning repository");
    } finally {
      setIsCloning(false);
    }
  };
  const loadPinnedFiles = async () => {
    setIsLoadingPinnedFiles(true);
    try {
      const response = await fetch("/coderunner/api/config/pinned-files", {
        credentials: "include"
      });
      if (response.ok) {
        const config = await response.json();
        setPinnedFiles(new Set(config.pinnedFiles || []));
      }
    } catch (error) {
      console.error("Error loading pinned files:", error);
    } finally {
      setIsLoadingPinnedFiles(false);
    }
  };
  const togglePinFile = async (filePath) => {
    try {
      const response = await fetch(`/coderunner/api/config/pinned-files/${encodeURIComponent(filePath)}`, {
        method: "PUT",
        credentials: "include"
      });
      if (response.ok) {
        const result = await response.json();
        if (result.isPinned) {
          setPinnedFiles((prev) => new Set(prev).add(filePath));
        } else {
          setPinnedFiles((prev) => {
            const newSet = new Set(prev);
            newSet.delete(filePath);
            return newSet;
          });
        }
        return result.isPinned;
      }
    } catch (error) {
      console.error("Error toggling pin status:", error);
    }
    return false;
  };
  const loadFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const response = await fetch("/coderunner/api/files");
      if (response.ok) {
        const fileData = await response.json();
        setFiles(fileData || []);
        processComponentFiles(fileData || []);
      }
    } catch (error) {
      console.error("Failed to load files:", error);
    } finally {
      setIsLoadingFiles(false);
    }
  };
  const loadDirectoryContents = async (directoryPath) => {
    if (loadedDirectories.has(directoryPath)) {
      return directoryChildren.get(directoryPath) || [];
    }
    if (loadingDirectories.has(directoryPath)) {
      return [];
    }
    setLoadingDirectories((prev) => new Set(prev).add(directoryPath));
    try {
      const encodedPath = encodeURIComponent(directoryPath);
      const response = await fetch(`/coderunner/api/files?path=${encodedPath}&depth=1`);
      if (response.ok) {
        const fileData = await response.json();
        setDirectoryChildren((prev) => new Map(prev).set(directoryPath, fileData));
        setLoadedDirectories((prev) => new Set(prev).add(directoryPath));
        setFiles((prevFiles) => {
          const existingPaths = new Set(prevFiles.map((f) => f.path));
          const newFiles = fileData.filter((f) => !existingPaths.has(f.path));
          return [...prevFiles, ...newFiles];
        });
        const newComponentFiles = fileData.filter(
          (file) => !file.isDir && (file.path.endsWith(".tsx") || file.path.endsWith(".jsx"))
        );
        if (newComponentFiles.length > 0) {
          processComponentFiles(newComponentFiles);
        }
        return fileData;
      } else {
        console.error("Failed to load directory:", directoryPath);
        return [];
      }
    } catch (error) {
      console.error("Error loading directory:", directoryPath, error);
      return [];
    } finally {
      setLoadingDirectories((prev) => {
        const newSet = new Set(prev);
        newSet.delete(directoryPath);
        return newSet;
      });
    }
  };
  const processComponentFiles = async (fileList) => {
    const componentFiles = fileList.filter(
      (file) => !file.isDir && (file.path.endsWith(".tsx") || file.path.endsWith(".jsx"))
    );
    const componentsData = [];
    for (const file of componentFiles) {
      try {
        const response = await fetch(`/coderunner/api/files/${encodeURIComponent(file.path)}`);
        if (response.ok) {
          const content = await response.text();
          const metadata = analyzeComponent(file, content);
          if (metadata) {
            componentsData.push(metadata);
          }
        }
      } catch (error) {
        console.error(`Error loading component ${file.path}:`, error);
      }
    }
    setComponents(componentsData);
  };
  const analyzeComponent = (file, content) => {
    const baseName = file.name.replace(/\.(tsx|jsx)$/, "");
    const exportMatches = content.match(/export\s+(?:const|function|class)\s+(\w+)/g) || [];
    const defaultExportMatch = content.match(/export\s+default\s+(\w+)/);
    const exportedComponents = exportMatches.map((match) => {
      const componentMatch = match.match(/export\s+(?:const|function|class)\s+(\w+)/);
      return componentMatch ? componentMatch[1] : "";
    }).filter(Boolean);
    if (defaultExportMatch) {
      exportedComponents.push(defaultExportMatch[1]);
    }
    const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
    const description = descriptionMatch ? descriptionMatch[1] : void 0;
    const tags = [];
    if (content.includes("useState")) tags.push("stateful");
    if (content.includes("useEffect")) tags.push("effects");
    if (content.includes("React.FC")) tags.push("functional");
    if (content.includes("interface")) tags.push("typescript");
    if (content.includes("className")) tags.push("styled");
    return {
      name: baseName,
      path: file.path,
      description,
      tags,
      size: file.size,
      lastModified: file.lastModified,
      hasExport: exportedComponents.length > 0,
      exportedComponents
    };
  };
  const buildDirectoryTree = (fileList) => {
    const nodeMap = /* @__PURE__ */ new Map();
    const rootNodes = [];
    fileList.forEach((file) => {
      const pathParts = file.path.split("/");
      for (let i = 0; i < pathParts.length; i++) {
        const currentPath2 = pathParts.slice(0, i + 1).join("/");
        const isFile = i === pathParts.length - 1 && !file.isDir;
        if (!nodeMap.has(currentPath2) && !isFile) {
          const node = {
            name: pathParts[i],
            path: currentPath2,
            isDir: true,
            children: [],
            files: [],
            isLoaded: loadedDirectories.has(currentPath2),
            isExpanded: expandedDirs.has(currentPath2)
          };
          nodeMap.set(currentPath2, node);
          if (i === 0) {
            rootNodes.push(node);
          } else {
            const parentPath = pathParts.slice(0, i).join("/");
            const parentNode = nodeMap.get(parentPath);
            if (parentNode) {
              parentNode.children.push(node);
            }
          }
        }
      }
      if (!file.isDir) {
        if (file.path.includes("/")) {
          const parentPath = file.path.substring(0, file.path.lastIndexOf("/"));
          const parentNode = nodeMap.get(parentPath);
          if (parentNode) {
            parentNode.files.push(file);
          }
        } else {
          if (!nodeMap.has("")) {
            const rootNode = {
              name: "Root",
              path: "",
              isDir: true,
              children: [],
              files: [],
              isLoaded: loadedDirectories.has(""),
              isExpanded: true
            };
            nodeMap.set("", rootNode);
            rootNodes.unshift(rootNode);
          }
          nodeMap.get("")?.files.push(file);
        }
      }
    });
    return rootNodes;
  };
  const toggleDirExpansion = async (dirPath) => {
    const isCurrentlyExpanded = expandedDirs.has(dirPath);
    if (isCurrentlyExpanded) {
      setExpandedDirs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(dirPath);
        return newSet;
      });
    } else {
      setExpandedDirs((prev) => new Set(prev).add(dirPath));
      if (!loadedDirectories.has(dirPath)) {
        await loadDirectoryContents(dirPath);
      }
    }
  };
  const getPreviewUrl = useCallback((component, exportName) => {
    const componentParam = exportName || component.exportedComponents[0] || "App";
    return `/coderunner/render/${component.path}?component=${componentParam}`;
  }, []);
  const openInNewTab = useCallback((component, exportName) => {
    const url = getPreviewUrl(component, exportName);
    window.open(url, "_blank", "noopener,noreferrer");
  }, [getPreviewUrl]);
  const handlePreviewLoad = useCallback((componentPath) => {
    const timeout = loadingTimeouts.current.get(componentPath);
    if (timeout) {
      clearTimeout(timeout);
      loadingTimeouts.current.delete(componentPath);
    }
    setPreviewLoading((prev) => {
      const newSet = new Set(prev);
      newSet.delete(componentPath);
      return newSet;
    });
    setPreviewErrors((prev) => {
      const newSet = new Set(prev);
      newSet.delete(componentPath);
      return newSet;
    });
    setPreviewLoaded((prev) => new Set(prev).add(componentPath));
  }, []);
  const handlePreviewError = useCallback((componentPath) => {
    const timeout = loadingTimeouts.current.get(componentPath);
    if (timeout) {
      clearTimeout(timeout);
      loadingTimeouts.current.delete(componentPath);
    }
    setPreviewLoading((prev) => {
      const newSet = new Set(prev);
      newSet.delete(componentPath);
      return newSet;
    });
    setPreviewErrors((prev) => new Set(prev).add(componentPath));
  }, []);
  const startPreviewLoading = useCallback((componentPath) => {
    const existingTimeout = loadingTimeouts.current.get(componentPath);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    const timeout = setTimeout(() => {
      setPreviewLoading((prev) => {
        if (prev.has(componentPath)) {
          return prev;
        }
        return new Set(prev).add(componentPath);
      });
      setPreviewErrors((prev) => {
        const newSet = new Set(prev);
        newSet.delete(componentPath);
        return newSet;
      });
      loadingTimeouts.current.delete(componentPath);
    }, 100);
    loadingTimeouts.current.set(componentPath, timeout);
  }, []);
  const retryPreview = useCallback((componentPath) => {
    setPreviewLoading((prev) => {
      const newSet = new Set(prev);
      newSet.delete(componentPath);
      return newSet;
    });
    setPreviewErrors((prev) => {
      const newSet = new Set(prev);
      newSet.delete(componentPath);
      return newSet;
    });
    setPreviewLoaded((prev) => {
      const newSet = new Set(prev);
      newSet.delete(componentPath);
      return newSet;
    });
    const timeout = loadingTimeouts.current.get(componentPath);
    if (timeout) {
      clearTimeout(timeout);
      loadingTimeouts.current.delete(componentPath);
    }
    startPreviewLoading(componentPath);
  }, [startPreviewLoading]);
  useEffect(() => {
    return () => {
      loadingTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      loadingTimeouts.current.clear();
    };
  }, []);
  const filteredComponents = components.filter((component) => {
    if (currentView === "pinned" && !pinnedFiles.has(component.path)) {
      return false;
    }
    if (currentView === "recent") {
      const weekAgo = /* @__PURE__ */ new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const componentDate = new Date(component.lastModified);
      if (componentDate < weekAgo) {
        return false;
      }
    }
    const matchesSearch = searchQuery === "" || component.name.toLowerCase().includes(searchQuery.toLowerCase()) || component.description?.toLowerCase().includes(searchQuery.toLowerCase()) || component.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === "all" || filterType === "tsx" && component.path.endsWith(".tsx") || filterType === "jsx" && component.path.endsWith(".jsx");
    const matchesDirectory = selectedDirectory === null || component.path.startsWith(selectedDirectory + "/") || component.path.includes("/") && component.path.substring(0, component.path.lastIndexOf("/")) === selectedDirectory;
    return matchesSearch && matchesType && matchesDirectory;
  }).sort((a, b) => {
    if (currentView === "pinned") {
      const aIsPinned = pinnedFiles.has(a.path);
      const bIsPinned = pinnedFiles.has(b.path);
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
    }
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "date":
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      case "size":
        return b.size - a.size;
      default:
        return 0;
    }
  });
  const filteredRepositories = repositories.filter(
    (repo) => repo.name.toLowerCase().includes(repoSearchQuery.toLowerCase()) || repo.full_name.toLowerCase().includes(repoSearchQuery.toLowerCase()) || repo.description && repo.description.toLowerCase().includes(repoSearchQuery.toLowerCase())
  );
  useEffect(() => {
    if (selectedComponent && selectedComponent.exportedComponents.length > 0) {
      setSelectedDetailExport(selectedComponent.exportedComponents[0]);
    } else {
      setSelectedDetailExport("");
    }
  }, [selectedComponent]);
  useEffect(() => {
    const initializeAuth = async () => {
      const isAuthenticated = await checkGithubAuth();
      if (isAuthenticated) {
        await fetchGithubRepositories();
      }
      await loadFiles();
      await loadPinnedFiles();
    };
    initializeAuth();
  }, []);
  const ComponentCard = React.memo(({
    component,
    isCompact = false
  }) => {
    const [shouldLoadPreview, setShouldLoadPreview] = useState(false);
    const isLoading = previewLoading.has(component.path);
    const hasError = previewErrors.has(component.path);
    const isLoaded = previewLoaded.has(component.path);
    const previewUrl = useMemo(() => getPreviewUrl(component), [component.path, component.exportedComponents.join(",")]);
    const handleLoad = useCallback(() => handlePreviewLoad(component.path), [component.path, handlePreviewLoad]);
    const handleError = useCallback(() => handlePreviewError(component.path), [component.path, handlePreviewError]);
    const handleFullScreen = useCallback(() => setFullScreenPreview(component), [component]);
    const handleLoadPreview = useCallback(() => setShouldLoadPreview(true), []);
    const shouldShowIframe = !hasError && shouldLoadPreview;
    return /* @__PURE__ */ jsxs("div", { className: `bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow ${isCompact ? "p-3" : "p-4"}`, children: [
      /* @__PURE__ */ jsxs("div", { className: `bg-gray-50 rounded-md overflow-hidden mb-3 ${isCompact ? "h-32" : "h-48"} relative group`, children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10", children: /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleFullScreen,
            className: "bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1 rounded text-xs",
            title: "Full Screen",
            children: "\u26F6"
          }
        ) }),
        !shouldLoadPreview && !hasError && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-gray-100", children: /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleLoadPreview,
            className: "bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors",
            children: "\u{1F4F1} Load Preview"
          }
        ) }),
        isLoading && !isLoaded && shouldLoadPreview && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-gray-100", children: /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }) }),
        hasError && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl mb-2", children: "\u26A0\uFE0F" }),
          /* @__PURE__ */ jsx("div", { className: "text-xs", children: "Preview Error" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleLoadPreview,
              className: "mt-2 bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600",
              children: "Retry"
            }
          )
        ] }) }),
        shouldShowIframe && /* @__PURE__ */ jsx(
          "iframe",
          {
            src: previewUrl,
            className: "w-full h-full border-0",
            onLoad: handleLoad,
            onError: handleError,
            title: `Preview of ${component.name}`,
            style: {
              opacity: isLoaded ? 1 : 0,
              transition: "opacity 0.2s ease-in-out"
            }
          },
          `preview-${component.path}`
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("h3", { className: `font-semibold text-gray-900 ${isCompact ? "text-sm" : "text-base"}`, children: component.name }),
            pinnedFiles.has(component.path) && /* @__PURE__ */ jsx("span", { className: "text-yellow-600", title: "Pinned component", children: "\u{1F4CC}" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: `text-gray-500 ${isCompact ? "text-xs" : "text-sm"}`, children: component.path.endsWith(".tsx") ? "TSX" : "JSX" })
        ] }),
        component.description && /* @__PURE__ */ jsx("p", { className: `text-gray-600 ${isCompact ? "text-xs" : "text-sm"} line-clamp-2`, children: component.description }),
        component.tags.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1", children: [
          component.tags.slice(0, isCompact ? 2 : 4).map((tag) => /* @__PURE__ */ jsx(
            "span",
            {
              className: `bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs ${isCompact ? "text-xs" : ""}`,
              children: tag
            },
            tag
          )),
          component.tags.length > (isCompact ? 2 : 4) && /* @__PURE__ */ jsxs("span", { className: "text-gray-500 text-xs", children: [
            "+",
            component.tags.length - (isCompact ? 2 : 4)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-2 border-t", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("div", { className: `text-gray-500 ${isCompact ? "text-xs" : "text-sm"}`, children: [
              Math.round(component.size / 1024),
              "KB"
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => togglePinFile(component.path),
                className: `px-2 py-1 rounded transition-all duration-200 ${isCompact ? "text-xs" : "text-sm"} ${pinnedFiles.has(component.path) ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 shadow-sm scale-105" : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"}`,
                title: pinnedFiles.has(component.path) ? "Unpin file" : "Pin file",
                children: pinnedFiles.has(component.path) ? "\u{1F4CC}" : "\u{1F4CD}"
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setSelectedComponent(component),
              className: `bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors ${isCompact ? "text-xs" : "text-sm"}`,
              children: "View Details"
            }
          )
        ] })
      ] })
    ] });
  }, (prevProps, nextProps) => {
    return prevProps.component.path === nextProps.component.path && prevProps.isCompact === nextProps.isCompact;
  });
  const Sidebar = () => /* @__PURE__ */ jsxs("div", { className: `bg-gray-50 border-r h-full overflow-auto ${isMobile ? "w-full" : "w-80"}`, children: [
    /* @__PURE__ */ jsx("div", { className: "p-4 border-b", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Component Browser" }),
      isMobile && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setShowSidebar(false),
          className: "text-gray-500 hover:text-gray-700",
          children: "\u2715"
        }
      )
    ] }) }),
    isLoggedIn ? /* @__PURE__ */ jsxs("div", { className: "p-4 border-b bg-gray-100", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-700", children: "GitHub Repository" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              setShowRepoSelector(!showRepoSelector);
              if (!showRepoSelector && repositories.length === 0) {
                fetchGithubRepositories();
              }
            },
            className: "text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600",
            children: showRepoSelector ? "Hide" : "Browse"
          }
        )
      ] }),
      selectedRepo && /* @__PURE__ */ jsxs("div", { className: "bg-white p-2 rounded border", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-600", children: [
            "\u{1F4E6} ",
            selectedRepo
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleCloneRepository,
              disabled: isCloning,
              className: `text-xs px-2 py-1 rounded transition-colors ${isCloning ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-green-500 text-white hover:bg-green-600"}`,
              children: isCloning ? "\u23F3 Cloning..." : "\u{1F4E5} Clone"
            }
          )
        ] }),
        cloneStatus && /* @__PURE__ */ jsx("div", { className: `text-xs p-1 rounded ${cloneStatus.includes("Error") || cloneStatus.includes("Failed") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`, children: cloneStatus })
      ] }),
      showRepoSelector && /* @__PURE__ */ jsxs("div", { className: "mt-2 border rounded bg-white max-h-48 overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "p-2", children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            placeholder: "Search repositories...",
            value: repoSearchQuery,
            onChange: (e) => setRepoSearchQuery(e.target.value),
            className: "w-full px-2 py-1 border rounded text-xs"
          }
        ) }),
        /* @__PURE__ */ jsx("div", { className: "max-h-32 overflow-auto border-t", children: isLoadingRepos ? /* @__PURE__ */ jsx("div", { className: "p-4 text-center text-gray-500 text-xs", children: "Loading repositories..." }) : filteredRepositories.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-4 text-center text-gray-500 text-xs", children: "No repositories found" }) : filteredRepositories.map((repo) => /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => handleRepoSelection(repo.full_name),
            className: "w-full p-2 text-left hover:bg-gray-50 border-b text-xs",
            children: [
              /* @__PURE__ */ jsx("div", { className: "font-medium", children: repo.name }),
              repo.description && /* @__PURE__ */ jsx("div", { className: "text-gray-500 truncate", children: repo.description })
            ]
          },
          repo.full_name
        )) })
      ] })
    ] }) : /* @__PURE__ */ jsx("div", { className: "p-4 border-b bg-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-700 mb-3", children: "Sign in with GitHub to access your repositories" }),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/github/login",
          className: "inline-block bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition-colors text-sm",
          children: [
            /* @__PURE__ */ jsx("span", { className: "mr-2", children: "\u{1F510}" }),
            "Sign in with GitHub"
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "p-4 border-b", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-gray-700", children: "Pinned Files" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setCurrentView("pinned"),
            className: "text-xs text-blue-600 hover:text-blue-800",
            children: "View All"
          }
        )
      ] }),
      pinnedFiles.size > 0 ? /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        Array.from(pinnedFiles).slice(0, 5).map((filePath) => {
          const fileName = filePath.split("/").pop() || filePath;
          const component = components.find((c) => c.path === filePath);
          return /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded text-sm",
              children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      if (component) {
                        setSelectedComponent(component);
                      }
                    },
                    className: "flex-1 text-left hover:text-blue-600 truncate",
                    title: filePath,
                    children: [
                      "\u{1F4CC} ",
                      fileName
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => togglePinFile(filePath),
                    className: "text-gray-500 hover:text-red-600 ml-2",
                    title: "Unpin file",
                    children: "\u2715"
                  }
                )
              ]
            },
            filePath
          );
        }),
        pinnedFiles.size > 5 && /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-500 text-center pt-1", children: [
          "+",
          pinnedFiles.size - 5,
          " more pinned files"
        ] })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-500 text-center py-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl mb-1", children: "\u{1F4CC}" }),
        /* @__PURE__ */ jsx("div", { children: "No pinned files yet" }),
        /* @__PURE__ */ jsx("div", { className: "text-xs mt-1", children: "Pin components to quick access" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-gray-700 mb-2", children: "Directory Navigation" }),
      isLoadingFiles ? /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-500", children: "Loading files..." }) : /* @__PURE__ */ jsx(DirectoryTree, { files })
    ] })
  ] });
  const DirectoryTree = ({ files: files2 }) => {
    const directoryTree = buildDirectoryTree(files2);
    const componentFiles = files2.filter(
      (f) => !f.isDir && (f.path.endsWith(".tsx") || f.path.endsWith(".jsx"))
    );
    const DirectoryNode = ({ node, depth }) => {
      const isLoading = loadingDirectories.has(node.path);
      const componentFilesInNode = node.files.filter(
        (f) => f.path.endsWith(".tsx") || f.path.endsWith(".jsx")
      );
      const allComponentsInSubtree = files2.filter(
        (f) => !f.isDir && (f.path.endsWith(".tsx") || f.path.endsWith(".jsx")) && (f.path === node.path || f.path.startsWith(node.path + "/"))
      ).length;
      return /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center", style: { paddingLeft: `${depth * 12}px` }, children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => toggleDirExpansion(node.path),
              className: "flex items-center text-left text-sm py-1 px-1 hover:bg-gray-100 rounded mr-1",
              disabled: isLoading,
              children: /* @__PURE__ */ jsx("span", { className: "mr-1 text-xs", children: isLoading ? "\u27F3" : node.isExpanded ? "\u25BC" : "\u25B6" })
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setSelectedDirectory(selectedDirectory === node.path ? null : node.path),
              className: `flex-1 flex items-center text-left text-sm py-1 px-2 rounded ${selectedDirectory === node.path ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`,
              children: [
                "\u{1F4C1} ",
                node.name === "Root" ? "All Files" : node.name,
                /* @__PURE__ */ jsxs("span", { className: "ml-auto text-xs text-gray-500", children: [
                  "(",
                  allComponentsInSubtree,
                  ")"
                ] })
              ]
            }
          )
        ] }),
        node.isExpanded && /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          componentFilesInNode.map((file) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "text-sm py-1 px-2 text-gray-600 hover:bg-gray-100 rounded cursor-pointer",
              style: { paddingLeft: `${(depth + 1) * 12 + 20}px` },
              onClick: () => {
                console.log("Component file clicked:", file.path);
                console.log("Available components:", components.map((c) => c.path));
                const component = components.find((c) => c.path === file.path);
                console.log("Found component:", component);
                if (component) {
                  setSelectedComponent(component);
                } else {
                  const fallbackComponent = {
                    name: file.name.replace(/\.(tsx|jsx)$/, ""),
                    path: file.path,
                    description: "Component details loading...",
                    tags: [],
                    size: file.size,
                    lastModified: file.lastModified,
                    hasExport: false,
                    exportedComponents: []
                  };
                  setSelectedComponent(fallbackComponent);
                  processComponentFiles([file]);
                }
              },
              children: [
                "\u{1F4C4} ",
                file.name
              ]
            },
            file.path
          )),
          node.children.map((child) => /* @__PURE__ */ jsx(DirectoryNode, { node: child, depth: depth + 1 }, child.path))
        ] })
      ] }, node.path);
    };
    return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-500 mb-2", children: [
        componentFiles.length,
        " components found"
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setSelectedDirectory(null),
          className: `w-full flex items-center text-left text-sm py-1 px-2 rounded mb-2 ${selectedDirectory === null ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`,
          children: [
            "\u{1F4C1} All Directories",
            /* @__PURE__ */ jsxs("span", { className: "ml-auto text-xs text-gray-500", children: [
              "(",
              componentFiles.length,
              ")"
            ] })
          ]
        }
      ),
      directoryTree.map((rootNode) => /* @__PURE__ */ jsx(DirectoryNode, { node: rootNode, depth: 0 }, rootNode.path))
    ] });
  };
  return /* @__PURE__ */ jsxs("div", { className: "h-screen bg-gray-100 flex", children: [
    (showSidebar || !isMobile) && /* @__PURE__ */ jsxs(Fragment, { children: [
      isMobile && /* @__PURE__ */ jsx(
        "div",
        {
          className: "fixed inset-0 bg-black bg-opacity-50 z-40",
          onClick: () => setShowSidebar(false)
        }
      ),
      /* @__PURE__ */ jsx("div", { className: `${isMobile ? "fixed left-0 top-0 h-full z-50 bg-white shadow-xl" : "relative"}`, children: /* @__PURE__ */ jsx(Sidebar, {}) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white border-b p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
            isMobile && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setShowSidebar(true),
                className: "text-gray-500 hover:text-gray-700",
                children: "\u2630"
              }
            ),
            /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Component Browser" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex bg-gray-100 rounded-lg p-1", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setCurrentView("all"),
                className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentView === "all" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}`,
                children: [
                  "All Components",
                  /* @__PURE__ */ jsxs("span", { className: "ml-1 text-xs text-gray-500", children: [
                    "(",
                    components.length,
                    ")"
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setCurrentView("pinned"),
                className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentView === "pinned" ? "bg-white text-yellow-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}`,
                children: [
                  "\u{1F4CC} Pinned",
                  /* @__PURE__ */ jsxs("span", { className: "ml-1 text-xs text-gray-500", children: [
                    "(",
                    pinnedFiles.size,
                    ")"
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setCurrentView("recent"),
                className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentView === "recent" ? "bg-white text-green-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}`,
                children: [
                  "\u{1F552} Recent",
                  /* @__PURE__ */ jsxs("span", { className: "ml-1 text-xs text-gray-500", children: [
                    "(",
                    components.filter((c) => {
                      const weekAgo = /* @__PURE__ */ new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return new Date(c.lastModified) > weekAgo;
                    }).length,
                    ")"
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-500", children: [
            filteredComponents.length,
            " ",
            currentView === "all" ? "components" : currentView === "pinned" ? "pinned" : "recent"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center space-x-2", children: /* @__PURE__ */ jsxs("div", { className: "flex bg-gray-200 rounded-md p-1", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setViewMode("grid"),
              className: `px-3 py-1 rounded text-sm ${viewMode === "grid" ? "bg-white shadow-sm" : "text-gray-600"}`,
              children: "Grid"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setViewMode("list"),
              className: `px-3 py-1 rounded text-sm ${viewMode === "list" ? "bg-white shadow-sm" : "text-gray-600"}`,
              children: "List"
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-col sm:flex-row gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Search components...",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: filterType,
                onChange: (e) => setFilterType(e.target.value),
                className: "px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "all", children: "All Types" }),
                  /* @__PURE__ */ jsx("option", { value: "tsx", children: "TypeScript" }),
                  /* @__PURE__ */ jsx("option", { value: "jsx", children: "JavaScript" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: sortBy,
                onChange: (e) => setSortBy(e.target.value),
                className: "px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "name", children: "Sort by Name" }),
                  /* @__PURE__ */ jsx("option", { value: "date", children: "Sort by Date" }),
                  /* @__PURE__ */ jsx("option", { value: "size", children: "Sort by Size" })
                ]
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto p-4", children: filteredComponents.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-12", children: currentView === "pinned" ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-6xl mb-4", children: "\u{1F4CC}" }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-medium text-gray-900 mb-2", children: "No pinned components yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-4", children: "Pin your favorite components for quick access" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setCurrentView("all"),
            className: "bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors",
            children: "Browse All Components"
          }
        )
      ] }) : currentView === "recent" ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-6xl mb-4", children: "\u{1F552}" }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-medium text-gray-900 mb-2", children: "No recent components" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Components modified in the last 7 days will appear here" })
      ] }) : /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-6xl mb-4", children: "\u{1F4E6}" }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-medium text-gray-900 mb-2", children: "No components found" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: searchQuery ? "Try adjusting your search query" : "Create some React components to get started" })
      ] }) }) : /* @__PURE__ */ jsx("div", { className: viewMode === "grid" ? `grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}` : "space-y-4", children: filteredComponents.map((component) => /* @__PURE__ */ jsx(
        ComponentCard,
        {
          component,
          isCompact: viewMode === "list" || isMobile
        },
        component.path
      )) }) })
    ] }),
    fullScreenPreview && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50", children: /* @__PURE__ */ jsxs("div", { className: "w-full h-full max-w-7xl mx-auto p-4 flex flex-col", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4 text-white", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold", children: fullScreenPreview.name }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-300", children: fullScreenPreview.path })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          fullScreenPreview.exportedComponents.length > 1 && /* @__PURE__ */ jsx(
            "select",
            {
              value: selectedComponentExport || fullScreenPreview.exportedComponents[0],
              onChange: (e) => setSelectedComponentExport(e.target.value),
              className: "bg-gray-800 text-white px-3 py-1 rounded border border-gray-600",
              children: fullScreenPreview.exportedComponents.map((comp) => /* @__PURE__ */ jsx("option", { value: comp, children: comp }, comp))
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => openInNewTab(fullScreenPreview, selectedComponentExport),
              className: "bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded",
              children: "\u{1F517} New Tab"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => retryPreview(fullScreenPreview.path),
              className: "bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded",
              children: "\u21BB Refresh"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setFullScreenPreview(null),
              className: "bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded",
              children: "\u2715 Close"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 bg-white rounded-lg overflow-hidden", children: /* @__PURE__ */ jsx(
        "iframe",
        {
          src: getPreviewUrl(fullScreenPreview, selectedComponentExport),
          className: "w-full h-full border-0",
          sandbox: "allow-scripts allow-same-origin allow-forms",
          title: `Full screen preview of ${fullScreenPreview.name}`
        }
      ) })
    ] }) }),
    selectedComponent && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto", children: /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-gray-900", children: selectedComponent.name }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => togglePinFile(selectedComponent.path),
              className: `px-3 py-1 rounded text-sm transition-colors ${pinnedFiles.has(selectedComponent.path) ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`,
              title: pinnedFiles.has(selectedComponent.path) ? "Unpin file" : "Pin file",
              children: [
                "\u{1F4CC} ",
                pinnedFiles.has(selectedComponent.path) ? "Unpin" : "Pin"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => openInNewTab(selectedComponent),
              className: "bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm",
              children: "\u{1F517} Open in New Tab"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setFullScreenPreview(selectedComponent),
              className: "bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm",
              children: "\u26F6 Full Screen"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setSelectedComponent(null),
              className: "text-gray-500 hover:text-gray-700 text-xl",
              children: "\u2715"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium mb-3", children: "Preview" }),
          /* @__PURE__ */ jsx("div", { className: "bg-gray-50 rounded-lg h-64 overflow-hidden", children: /* @__PURE__ */ jsx(
            "iframe",
            {
              src: getPreviewUrl(selectedComponent, selectedDetailExport),
              className: "w-full h-full border-0"
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium mb-2", children: "Details" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Path:" }),
                " ",
                selectedComponent.path
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Size:" }),
                " ",
                Math.round(selectedComponent.size / 1024),
                "KB"
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Modified:" }),
                " ",
                new Date(selectedComponent.lastModified).toLocaleDateString()
              ] })
            ] })
          ] }),
          selectedComponent.description && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium mb-2", children: "Description" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: selectedComponent.description })
          ] }),
          selectedComponent.exportedComponents.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium mb-2", children: "Exported Components" }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: selectedComponent.exportedComponents.map((comp) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSelectedDetailExport(comp),
                className: `px-2 py-1 rounded text-sm transition-colors cursor-pointer hover:opacity-80 ${selectedDetailExport === comp ? "bg-blue-100 text-blue-700 ring-2 ring-blue-300" : "bg-green-100 text-green-700 hover:bg-green-200"}`,
                children: comp
              },
              comp
            )) })
          ] }),
          selectedComponent.tags.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium mb-2", children: "Tags" }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: selectedComponent.tags.map((tag) => /* @__PURE__ */ jsx(
              "span",
              {
                className: "bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm",
                children: tag
              },
              tag
            )) })
          ] })
        ] })
      ] })
    ] }) }) })
  ] });
};
var ComponentBrowser_default = ComponentBrowser;
export {
  ComponentBrowser,
  ComponentBrowser_default as default
};
