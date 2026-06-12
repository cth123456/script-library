// ==UserScript==
// @name         BewlyCat for Stay
// @namespace    https://github.com/keleus/BewlyCat
// @version      2.1.0
// @description  面向 Safari/Stay 的 BewlyCat 轻量首页版，保留原版视觉并隔离视频详情页。
// @author       Keleus; lightweight Stay edition by Codex
// @homepageURL  https://github.com/cth123456/script-library
// @downloadURL  https://raw.githubusercontent.com/cth123456/script-library/main/userscripts/bilibili/bewlycat-stay.user.js
// @updateURL    https://raw.githubusercontent.com/cth123456/script-library/main/userscripts/bilibili/bewlycat-stay.user.js
// @license      Custom License - personal study and non-commercial modification only
// @match        https://www.bilibili.com/*
// @run-at       document-start
// @noframes
// @grant        none
// ==/UserScript==

(function () {
  "use strict";
  if (window.top !== window.self) return;

  var HOME_PATHS = { "/": true, "/index.html": true };
  var ROOT_CLASS = "bewlycat-lite-home";
  var DARK_CLASS = "bewlycat-lite-dark";
  var STYLE_ID = "bewlycat-lite-style";
  var TABS_ID = "bewlycat-lite-tabs";
  var DOCK_ID = "bewlycat-lite-dock";
  var THEME_KEY = "bewlycat-lite-theme";
  var installed = false;
  var mountTimer = 0;

  function isHomePage() {
    return location.hostname === "www.bilibili.com" && Boolean(HOME_PATHS[location.pathname]);
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;

    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = String.raw`
html.${ROOT_CLASS} {
  --bew-bg: #f6f6fb;
  --bew-surface: rgba(255, 255, 255, 0.92);
  --bew-surface-solid: #ffffff;
  --bew-surface-hover: #eef0f7;
  --bew-text-1: #18191c;
  --bew-text-2: #61666d;
  --bew-text-3: #9499a0;
  --bew-line: rgba(131, 131, 145, 0.18);
  --bew-fill: rgba(131, 131, 145, 0.1);
  --bew-theme: #00aeec;
  --bew-theme-soft: rgba(0, 174, 236, 0.14);
  --bew-radius: 12px;
  --bew-topbar-height: 64px;
  color-scheme: light;
  background: var(--bew-bg) !important;
}

html.${ROOT_CLASS}.${DARK_CLASS} {
  --bew-bg: #181a1f;
  --bew-surface: rgba(42, 45, 50, 0.94);
  --bew-surface-solid: #2a2d32;
  --bew-surface-hover: #353940;
  --bew-text-1: #f1f2f3;
  --bew-text-2: #c9ccd0;
  --bew-text-3: #9499a0;
  --bew-line: rgba(255, 255, 255, 0.1);
  --bew-fill: rgba(255, 255, 255, 0.08);
  --bew-theme-soft: rgba(0, 174, 236, 0.2);
  color-scheme: dark;
}

html.${ROOT_CLASS},
html.${ROOT_CLASS} body,
html.${ROOT_CLASS} #app,
html.${ROOT_CLASS} .bili-feed4 {
  min-height: 100%;
  background: var(--bew-bg) !important;
  color: var(--bew-text-1) !important;
}

html.${ROOT_CLASS} body {
  background-image:
    radial-gradient(circle at 12% 0%, rgba(0, 174, 236, 0.055), transparent 25rem),
    radial-gradient(circle at 88% 9%, rgba(251, 114, 153, 0.045), transparent 23rem) !important;
  background-attachment: fixed !important;
}

html.${ROOT_CLASS} .bili-header,
html.${ROOT_CLASS} .bili-header.large-header {
  min-height: 0 !important;
  height: 0 !important;
  background: transparent !important;
}

html.${ROOT_CLASS} .bili-header__banner,
html.${ROOT_CLASS} .bili-header__channel,
html.${ROOT_CLASS} .header-channel,
html.${ROOT_CLASS} .fixed-channel-shim {
  display: none !important;
}

html.${ROOT_CLASS} .bili-header__bar {
  position: fixed !important;
  z-index: 10020 !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  width: 100% !important;
  height: calc(var(--bew-topbar-height) + env(safe-area-inset-top)) !important;
  padding: env(safe-area-inset-top) max(24px, env(safe-area-inset-left)) 0 max(24px, env(safe-area-inset-right)) !important;
  border: 0 !important;
  border-bottom: 1px solid var(--bew-line) !important;
  border-radius: 0 !important;
  box-sizing: border-box !important;
  background: var(--bew-surface) !important;
  box-shadow: 0 3px 14px rgba(20, 22, 28, 0.06) !important;
  color: var(--bew-text-1) !important;
  -webkit-backdrop-filter: saturate(150%) blur(10px) !important;
  backdrop-filter: saturate(150%) blur(10px) !important;
}

html.${ROOT_CLASS} .bili-header__bar a,
html.${ROOT_CLASS} .bili-header__bar span,
html.${ROOT_CLASS} .bili-header__bar svg,
html.${ROOT_CLASS} .left-entry,
html.${ROOT_CLASS} .right-entry {
  color: var(--bew-text-1) !important;
  text-shadow: none !important;
}

html.${ROOT_CLASS} .bili-header__bar .entry-title:hover,
html.${ROOT_CLASS} .bili-header__bar .default-entry:hover,
html.${ROOT_CLASS} .bili-header__bar .right-entry-item:hover span {
  color: var(--bew-theme) !important;
}

html.${ROOT_CLASS} .left-entry,
html.${ROOT_CLASS} .right-entry {
  min-width: 0 !important;
}

html.${ROOT_CLASS} .center-search-container {
  height: 42px !important;
}

html.${ROOT_CLASS} .center-search__bar,
html.${ROOT_CLASS} #nav-searchform {
  height: 42px !important;
  border: 1px solid var(--bew-line) !important;
  border-radius: 9px !important;
  background: var(--bew-fill) !important;
  box-shadow: none !important;
}

html.${ROOT_CLASS} .center-search__bar:hover,
html.${ROOT_CLASS} #nav-searchform:focus-within {
  border-color: var(--bew-theme) !important;
  background: var(--bew-surface-solid) !important;
}

html.${ROOT_CLASS} .nav-search-input,
html.${ROOT_CLASS} .nav-search-content,
html.${ROOT_CLASS} .nav-search-btn {
  color: var(--bew-text-1) !important;
  background: transparent !important;
}

html.${ROOT_CLASS} .nav-search-input::placeholder {
  color: var(--bew-text-3) !important;
}

html.${ROOT_CLASS} .header-upload-entry,
html.${ROOT_CLASS} .header-upload-entry:hover {
  background: #fb7299 !important;
}

html.${ROOT_CLASS} #${TABS_ID} {
  position: sticky;
  z-index: 10010;
  top: calc(var(--bew-topbar-height) + env(safe-area-inset-top) + 8px);
  display: flex;
  align-items: center;
  gap: 4px;
  width: min(824px, calc(100% - 150px));
  min-height: 42px;
  margin: calc(var(--bew-topbar-height) + env(safe-area-inset-top) + 10px) auto 14px;
  padding: 4px;
  overflow-x: auto;
  border: 1px solid var(--bew-line);
  border-radius: 999px;
  box-sizing: border-box;
  background: var(--bew-surface);
  box-shadow: 0 8px 24px rgba(20, 22, 28, 0.08);
  scrollbar-width: none;
  -webkit-backdrop-filter: saturate(150%) blur(10px);
  backdrop-filter: saturate(150%) blur(10px);
}

html.${ROOT_CLASS} #${TABS_ID}::-webkit-scrollbar {
  display: none;
}

html.${ROOT_CLASS} .bewlycat-lite__tab {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 15px;
  border-radius: 999px;
  color: var(--bew-text-2) !important;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  text-decoration: none !important;
  white-space: nowrap;
}

html.${ROOT_CLASS} .bewlycat-lite__tab:hover {
  background: var(--bew-fill);
  color: var(--bew-text-1) !important;
}

html.${ROOT_CLASS} .bewlycat-lite__tab.is-active {
  background: var(--bew-text-1);
  color: var(--bew-surface-solid) !important;
  font-weight: 650;
  box-shadow: 0 3px 10px rgba(20, 22, 28, 0.18);
}

html.${ROOT_CLASS}.${DARK_CLASS} .bewlycat-lite__tab.is-active {
  background: var(--bew-theme);
  color: #fff !important;
}

html.${ROOT_CLASS} .bili-feed4-layout {
  width: min(824px, calc(100% - 150px)) !important;
  max-width: none !important;
  margin: 0 auto !important;
  padding: 0 0 72px !important;
}

html.${ROOT_CLASS} .recommended-container_floor-aside,
html.${ROOT_CLASS} .recommended-container_floor-aside .container,
html.${ROOT_CLASS} .feed2 {
  width: 100% !important;
  max-width: none !important;
  margin: 0 !important;
}

html.${ROOT_CLASS} .recommended-container_floor-aside .container {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 30px 20px !important;
}

html.${ROOT_CLASS} .recommended-swipe,
html.${ROOT_CLASS} .recommended-swipe-shim,
html.${ROOT_CLASS} .shim-card {
  display: none !important;
}

html.${ROOT_CLASS} .bili-video-card,
html.${ROOT_CLASS} .feed-card,
html.${ROOT_CLASS} .floor-single-card,
html.${ROOT_CLASS} .bili-live-card {
  width: auto !important;
  min-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-sizing: border-box !important;
  background: transparent !important;
  box-shadow: none !important;
}

html.${ROOT_CLASS} .bili-video-card__image,
html.${ROOT_CLASS} .bili-video-card__image--wrap,
html.${ROOT_CLASS} .bili-video-card__cover,
html.${ROOT_CLASS} .bili-video-card__wrap,
html.${ROOT_CLASS} .bili-live-card__cover,
html.${ROOT_CLASS} .v-img,
html.${ROOT_CLASS} video {
  border-radius: var(--bew-radius) !important;
  overflow: hidden !important;
}

html.${ROOT_CLASS} .bili-video-card__image--wrap,
html.${ROOT_CLASS} .bili-live-card__cover {
  box-shadow: 0 5px 14px rgba(20, 22, 28, 0.08) !important;
}

html.${ROOT_CLASS} .bili-video-card__info,
html.${ROOT_CLASS} .bili-live-card__info {
  padding: 9px 1px 0 !important;
}

html.${ROOT_CLASS} .bili-video-card__info--tit,
html.${ROOT_CLASS} .bili-video-card__info--tit a,
html.${ROOT_CLASS} .bili-live-card__info--tit,
html.${ROOT_CLASS} .floor-title {
  color: var(--bew-text-1) !important;
  font-size: 15px !important;
  font-weight: 500 !important;
  line-height: 1.45 !important;
}

html.${ROOT_CLASS} .bili-video-card__info--owner,
html.${ROOT_CLASS} .bili-video-card__info--date,
html.${ROOT_CLASS} .bili-video-card__info--bottom,
html.${ROOT_CLASS} .bili-live-card__info--uname {
  color: var(--bew-text-3) !important;
}

html.${ROOT_CLASS} .bili-video-card:hover .bili-video-card__info--tit,
html.${ROOT_CLASS} .bili-video-card:hover .bili-video-card__info--tit a {
  color: var(--bew-theme) !important;
}

html.${ROOT_CLASS} .primary-btn,
html.${ROOT_CLASS} .roll-btn,
html.${ROOT_CLASS} .load-more-btn {
  border-color: var(--bew-line) !important;
  border-radius: var(--bew-radius) !important;
  background: var(--bew-surface-solid) !important;
  color: var(--bew-text-1) !important;
}

html.${ROOT_CLASS} #${DOCK_ID} {
  position: fixed;
  z-index: 10015;
  top: 50%;
  right: max(14px, env(safe-area-inset-right));
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 9px;
  border: 1px solid var(--bew-line);
  border-radius: 26px;
  background: var(--bew-surface);
  box-shadow: 0 10px 28px rgba(20, 22, 28, 0.12);
  transform: translateY(-50%);
  -webkit-backdrop-filter: saturate(150%) blur(10px);
  backdrop-filter: saturate(150%) blur(10px);
}

html.${ROOT_CLASS} .bewlycat-lite__dock-button {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  box-sizing: border-box;
  background: var(--bew-surface-solid);
  color: var(--bew-text-1) !important;
  box-shadow: 0 3px 10px rgba(20, 22, 28, 0.11);
  cursor: pointer;
  text-decoration: none !important;
}

html.${ROOT_CLASS} .bewlycat-lite__dock-button svg {
  width: 19px;
  height: 19px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

html.${ROOT_CLASS} .bewlycat-lite__dock-button:hover {
  background: var(--bew-theme-soft);
  color: var(--bew-theme) !important;
}

html.${ROOT_CLASS} .bewlycat-lite__dock-button.is-active {
  background: var(--bew-theme);
  color: #fff !important;
  box-shadow: 0 5px 18px rgba(0, 174, 236, 0.35);
}

html.${ROOT_CLASS} .bewlycat-lite__dock-divider {
  height: 1px;
  margin: 1px 4px;
  background: var(--bew-line);
}

@media (max-width: 1100px) {
  html.${ROOT_CLASS} .left-entry .v-popover-wrap:nth-of-type(n + 7),
  html.${ROOT_CLASS} .download-entry {
    display: none !important;
  }
}

@media (max-width: 900px) {
  html.${ROOT_CLASS} .bili-header__bar {
    padding-right: max(14px, env(safe-area-inset-right)) !important;
    padding-left: max(14px, env(safe-area-inset-left)) !important;
  }

  html.${ROOT_CLASS} .left-entry > li:not(:first-child),
  html.${ROOT_CLASS} .right-entry > li:not(.header-avatar-wrap):not(:last-child) {
    display: none !important;
  }

  html.${ROOT_CLASS} .center-search-container {
    margin: 0 10px !important;
  }

  html.${ROOT_CLASS} #${TABS_ID},
  html.${ROOT_CLASS} .bili-feed4-layout {
    width: calc(100% - 92px) !important;
    margin-left: 16px !important;
  }

  html.${ROOT_CLASS} .recommended-container_floor-aside .container {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 26px 16px !important;
  }

  html.${ROOT_CLASS} #${DOCK_ID} {
    right: 10px;
    gap: 7px;
    padding: 7px;
  }

  html.${ROOT_CLASS} .bewlycat-lite__dock-button {
    width: 38px;
    height: 38px;
  }
}

@media (max-width: 560px) {
  html.${ROOT_CLASS} #${TABS_ID},
  html.${ROOT_CLASS} .bili-feed4-layout {
    width: calc(100% - 24px) !important;
    margin-right: 12px !important;
    margin-left: 12px !important;
  }

  html.${ROOT_CLASS} .recommended-container_floor-aside .container {
    grid-template-columns: minmax(0, 1fr) !important;
  }

  html.${ROOT_CLASS} #${DOCK_ID} {
    top: auto;
    right: 12px;
    bottom: calc(12px + env(safe-area-inset-bottom));
    left: 12px;
    flex-direction: row;
    justify-content: space-around;
    padding: 7px;
    border-radius: 24px;
    transform: none;
  }

  html.${ROOT_CLASS} .bewlycat-lite__dock-divider,
  html.${ROOT_CLASS} .bewlycat-lite__dock-button[data-secondary="true"] {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  html.${ROOT_CLASS} *,
  html.${ROOT_CLASS} *::before,
  html.${ROOT_CLASS} *::after {
    scroll-behavior: auto !important;
    transition: none !important;
    animation: none !important;
  }
}
`;

    (document.head || document.documentElement).appendChild(style);
  }

  function icon(name) {
    var icons = {
      home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/>',
      search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
      popular: '<path d="M13.5 3.5c.7 3.6-1.4 5.1-3 6.8-1.4 1.5-2.3 3-1.5 5.2.6 1.7 2.2 2.8 4 2.8 3.6 0 6-2.7 6-6.2 0-3.2-1.8-6-5.5-8.6Z"/><path d="M9.2 6.7C6.5 8.6 5 11 5 13.7A6.3 6.3 0 0 0 11.3 20"/>',
      star: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
      history: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3.5 2"/>',
      moon: '<path d="M20 15.2A8 8 0 0 1 8.8 4 8.2 8.2 0 1 0 20 15.2Z"/>',
      refresh: '<path d="M20 7v5h-5"/><path d="M19 12a7 7 0 1 0-2 5"/>',
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + icons[name] + "</svg>";
  }

  function makeTab(label, href, active) {
    var link = document.createElement("a");
    link.className = "bewlycat-lite__tab" + (active ? " is-active" : "");
    link.href = href;
    link.textContent = label;
    return link;
  }

  function buildTabs() {
    var nav = document.createElement("nav");
    nav.id = TABS_ID;
    nav.setAttribute("aria-label", "首页推荐分类");
    nav.append(
      makeTab("个性推荐", "https://www.bilibili.com/", true),
      makeTab("正在关注", "https://www.bilibili.com/v/feed/following"),
      makeTab("订阅剧集", "https://www.bilibili.com/anime/"),
      makeTab("热门视频", "https://www.bilibili.com/v/popular/all"),
      makeTab("每周必看", "https://www.bilibili.com/v/popular/weekly"),
      makeTab("入站必刷", "https://www.bilibili.com/v/popular/history"),
      makeTab("排行榜", "https://www.bilibili.com/v/popular/rank/all")
    );
    return nav;
  }

  function makeDockLink(label, href, iconName, active, secondary) {
    var link = document.createElement("a");
    link.className = "bewlycat-lite__dock-button" + (active ? " is-active" : "");
    link.href = href;
    link.setAttribute("aria-label", label);
    link.title = label;
    if (secondary) link.dataset.secondary = "true";
    link.innerHTML = icon(iconName);
    return link;
  }

  function makeDockButton(label, iconName, handler, secondary) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "bewlycat-lite__dock-button";
    button.setAttribute("aria-label", label);
    button.title = label;
    if (secondary) button.dataset.secondary = "true";
    button.innerHTML = icon(iconName);
    button.addEventListener("click", handler);
    return button;
  }

  function focusSearch() {
    var input = document.querySelector(".nav-search-input");
    if (!input) return;
    input.focus();
    input.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function toggleTheme() {
    var dark = document.documentElement.classList.toggle(DARK_CLASS);
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch (error) {
      // Theme persistence is optional.
    }
  }

  function restoreTheme() {
    try {
      if (localStorage.getItem(THEME_KEY) === "dark") {
        document.documentElement.classList.add(DARK_CLASS);
      }
    } catch (error) {
      // Continue with the light theme when storage is unavailable.
    }
  }

  function buildDock() {
    var dock = document.createElement("aside");
    dock.id = DOCK_ID;
    dock.setAttribute("aria-label", "BewlyCat 快捷工具栏");
    dock.append(
      makeDockLink("首页", "https://www.bilibili.com/", "home", true),
      makeDockButton("搜索", "search", focusSearch),
      makeDockLink("热门", "https://www.bilibili.com/v/popular/all", "popular"),
      makeDockLink("收藏", "https://space.bilibili.com/0/favlist", "star"),
      makeDockLink("历史", "https://www.bilibili.com/account/history", "history"),
      makeDockButton("切换明暗主题", "moon", toggleTheme, true),
      Object.assign(document.createElement("div"), { className: "bewlycat-lite__dock-divider" }),
      makeDockButton("刷新推荐", "refresh", function () { location.reload(); }, true)
    );
    return dock;
  }

  function mountShell(attempt) {
    if (!isHomePage()) return;
    if (!document.body) {
      if (attempt < 40) {
        mountTimer = window.setTimeout(function () { mountShell(attempt + 1); }, 100);
      }
      return;
    }

    if (!document.getElementById(TABS_ID)) {
      document.body.insertBefore(buildTabs(), document.body.firstChild);
    }
    if (!document.getElementById(DOCK_ID)) {
      document.body.appendChild(buildDock());
    }
  }

  function activate() {
    if (!isHomePage()) return;
    document.documentElement.classList.add(ROOT_CLASS);
    restoreTheme();
    addStyles();
    mountShell(0);
    installed = true;
  }

  function deactivate() {
    document.documentElement.classList.remove(ROOT_CLASS, DARK_CLASS);
    var tabs = document.getElementById(TABS_ID);
    var dock = document.getElementById(DOCK_ID);
    if (tabs) tabs.remove();
    if (dock) dock.remove();
    if (mountTimer) window.clearTimeout(mountTimer);
    mountTimer = 0;
  }

  function syncPage() {
    if (isHomePage()) activate();
    else if (installed) deactivate();
  }

  function patchHistory(method) {
    var original = history[method];
    if (typeof original !== "function") return;
    history[method] = function () {
      var result = original.apply(this, arguments);
      window.setTimeout(syncPage, 0);
      return result;
    };
  }

  function start() {
    if (!document.documentElement) {
      window.setTimeout(start, 0);
      return;
    }
    activate();
    patchHistory("pushState");
    patchHistory("replaceState");
    window.addEventListener("popstate", syncPage, { passive: true });
  }

  if (!isHomePage()) return;
  start();
})();
