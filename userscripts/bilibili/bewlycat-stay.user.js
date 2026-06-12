// ==UserScript==
// @name         BewlyCat for Stay
// @namespace    https://github.com/keleus/BewlyCat
// @version      2.0.0
// @description  面向 Safari/Stay 的 BewlyCat 轻量首页美化版，不接管视频与详情页面。
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
  var STYLE_ID = "bewlycat-lite-style";
  var HERO_ID = "bewlycat-lite-hero";
  var installed = false;
  var mountTimer = 0;

  function isHomePage() {
    return location.hostname === "www.bilibili.com" && Boolean(HOME_PATHS[location.pathname]);
  }

  function greeting() {
    var hour = new Date().getHours();
    if (hour < 6) return "夜深了，放松一下";
    if (hour < 11) return "早上好，今天看点什么";
    if (hour < 14) return "中午好，休息一会儿";
    if (hour < 18) return "下午好，发现新内容";
    return "晚上好，慢慢逛逛";
  }

  function dateLabel() {
    try {
      return new Intl.DateTimeFormat("zh-CN", {
        month: "long",
        day: "numeric",
        weekday: "long",
      }).format(new Date());
    } catch (error) {
      return "Bilibili 轻量首页";
    }
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;

    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = String.raw`
html.${ROOT_CLASS} {
  --bewly-bg: #f2f5f1;
  --bewly-surface: #ffffff;
  --bewly-surface-soft: #e8eee8;
  --bewly-text: #18211d;
  --bewly-muted: #68736d;
  --bewly-line: rgba(24, 33, 29, 0.1);
  --bewly-accent: #196c55;
  --bewly-accent-soft: #d9eee5;
  --bewly-warm: #f3c96b;
  color-scheme: light;
  background: var(--bewly-bg) !important;
}

html.${ROOT_CLASS},
html.${ROOT_CLASS} body,
html.${ROOT_CLASS} #app,
html.${ROOT_CLASS} .bili-feed4 {
  min-height: 100%;
  background: var(--bewly-bg) !important;
  color: var(--bewly-text) !important;
}

html.${ROOT_CLASS} body {
  background-image:
    radial-gradient(circle at 8% 2%, rgba(243, 201, 107, 0.22), transparent 26rem),
    radial-gradient(circle at 92% 16%, rgba(25, 108, 85, 0.12), transparent 30rem) !important;
  background-attachment: fixed !important;
}

html.${ROOT_CLASS} .bili-header,
html.${ROOT_CLASS} .bili-header.large-header {
  min-height: 0 !important;
  height: auto !important;
  background: transparent !important;
}

html.${ROOT_CLASS} .bili-header__banner {
  display: none !important;
}

html.${ROOT_CLASS} .bili-header__bar {
  position: fixed !important;
  z-index: 10020 !important;
  top: max(10px, env(safe-area-inset-top)) !important;
  left: max(14px, env(safe-area-inset-left)) !important;
  right: max(14px, env(safe-area-inset-right)) !important;
  width: auto !important;
  height: 56px !important;
  padding: 0 18px !important;
  border: 1px solid var(--bewly-line) !important;
  border-radius: 18px !important;
  box-sizing: border-box !important;
  background: rgba(255, 255, 255, 0.96) !important;
  box-shadow: 0 12px 34px rgba(41, 59, 50, 0.1) !important;
  color: var(--bewly-text) !important;
}

html.${ROOT_CLASS} .bili-header__bar a,
html.${ROOT_CLASS} .bili-header__bar span,
html.${ROOT_CLASS} .bili-header__bar svg,
html.${ROOT_CLASS} .left-entry,
html.${ROOT_CLASS} .right-entry {
  color: var(--bewly-text) !important;
  text-shadow: none !important;
}

html.${ROOT_CLASS} .left-entry,
html.${ROOT_CLASS} .right-entry {
  min-width: 0 !important;
}

html.${ROOT_CLASS} .center-search-container {
  height: 40px !important;
}

html.${ROOT_CLASS} .center-search__bar,
html.${ROOT_CLASS} #nav-searchform {
  height: 40px !important;
  border: 1px solid var(--bewly-line) !important;
  border-radius: 12px !important;
  background: var(--bewly-surface-soft) !important;
  box-shadow: none !important;
}

html.${ROOT_CLASS} .nav-search-input,
html.${ROOT_CLASS} .nav-search-content,
html.${ROOT_CLASS} .nav-search-btn {
  color: var(--bewly-text) !important;
  background: transparent !important;
}

html.${ROOT_CLASS} .nav-search-input::placeholder {
  color: var(--bewly-muted) !important;
}

html.${ROOT_CLASS} #${HERO_ID} {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 26px;
  align-items: end;
  max-width: 1780px;
  min-height: 210px;
  margin: 0 auto;
  padding: calc(96px + env(safe-area-inset-top)) max(28px, 3vw) 34px;
  box-sizing: border-box;
  color: var(--bewly-text);
}

html.${ROOT_CLASS} .bewlycat-lite__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  color: var(--bewly-accent);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

html.${ROOT_CLASS} .bewlycat-lite__eyebrow::before {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--bewly-accent);
  content: "";
}

html.${ROOT_CLASS} .bewlycat-lite__title {
  margin: 0;
  max-width: 720px;
  font-family: "Avenir Next", "PingFang SC", sans-serif;
  font-size: clamp(30px, 4.3vw, 62px);
  font-weight: 750;
  letter-spacing: -0.045em;
  line-height: 1.04;
}

html.${ROOT_CLASS} .bewlycat-lite__date {
  margin: 13px 0 0;
  color: var(--bewly-muted);
  font-size: 14px;
}

html.${ROOT_CLASS} .bewlycat-lite__links {
  display: grid;
  grid-template-columns: repeat(2, minmax(92px, 1fr));
  gap: 10px;
  width: min(330px, 36vw);
}

html.${ROOT_CLASS} .bewlycat-lite__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 50px;
  padding: 0 16px;
  border: 1px solid var(--bewly-line);
  border-radius: 15px;
  box-sizing: border-box;
  background: var(--bewly-surface);
  color: var(--bewly-text) !important;
  font-size: 14px;
  font-weight: 650;
  text-decoration: none !important;
}

html.${ROOT_CLASS} .bewlycat-lite__arrow {
  color: var(--bewly-accent);
  font-size: 17px;
}

html.${ROOT_CLASS} .bili-header__channel {
  max-width: 1780px !important;
  margin: 0 auto 24px !important;
  padding: 14px max(28px, 3vw) !important;
  border: 0 !important;
  box-sizing: border-box !important;
  background: transparent !important;
}

html.${ROOT_CLASS} .channel-icons__item .icon-bg {
  background: var(--bewly-accent) !important;
  box-shadow: none !important;
}

html.${ROOT_CLASS} .channel-link,
html.${ROOT_CLASS} .channel-entry-more__link {
  border: 1px solid var(--bewly-line) !important;
  border-radius: 10px !important;
  background: rgba(255, 255, 255, 0.72) !important;
  color: var(--bewly-text) !important;
}

html.${ROOT_CLASS} main,
html.${ROOT_CLASS} .recommended-container_floor-aside,
html.${ROOT_CLASS} .feed2 {
  position: relative;
}

html.${ROOT_CLASS} .bili-video-card,
html.${ROOT_CLASS} .feed-card,
html.${ROOT_CLASS} .floor-single-card,
html.${ROOT_CLASS} .bili-live-card {
  padding: 10px !important;
  border: 1px solid var(--bewly-line) !important;
  border-radius: 18px !important;
  box-sizing: border-box !important;
  background: rgba(255, 255, 255, 0.86) !important;
  box-shadow: 0 8px 24px rgba(41, 59, 50, 0.06) !important;
}

html.${ROOT_CLASS} .bili-video-card__image,
html.${ROOT_CLASS} .bili-video-card__image--wrap,
html.${ROOT_CLASS} .bili-video-card__cover,
html.${ROOT_CLASS} .bili-video-card__wrap,
html.${ROOT_CLASS} .bili-live-card__cover,
html.${ROOT_CLASS} .v-img,
html.${ROOT_CLASS} video {
  border-radius: 13px !important;
  overflow: hidden !important;
}

html.${ROOT_CLASS} .bili-video-card__info--tit,
html.${ROOT_CLASS} .bili-video-card__info--tit a,
html.${ROOT_CLASS} .bili-live-card__info--tit,
html.${ROOT_CLASS} .floor-title {
  color: var(--bewly-text) !important;
  font-weight: 650 !important;
}

html.${ROOT_CLASS} .bili-video-card__info--owner,
html.${ROOT_CLASS} .bili-video-card__info--date,
html.${ROOT_CLASS} .bili-video-card__info--bottom,
html.${ROOT_CLASS} .bili-live-card__info--uname {
  color: var(--bewly-muted) !important;
}

html.${ROOT_CLASS} .primary-btn,
html.${ROOT_CLASS} .roll-btn,
html.${ROOT_CLASS} .load-more-btn {
  border-color: var(--bewly-line) !important;
  border-radius: 12px !important;
  background: var(--bewly-surface) !important;
  color: var(--bewly-text) !important;
}

@media (hover: hover) and (pointer: fine) {
  html.${ROOT_CLASS} .bewlycat-lite__link:hover,
  html.${ROOT_CLASS} .channel-link:hover {
    border-color: rgba(25, 108, 85, 0.36) !important;
    background: var(--bewly-accent-soft) !important;
  }
}

@media (max-width: 1100px) {
  html.${ROOT_CLASS} .bili-header__bar {
    padding: 0 12px !important;
  }

  html.${ROOT_CLASS} .left-entry .v-popover-wrap:nth-of-type(n + 5),
  html.${ROOT_CLASS} .download-entry {
    display: none !important;
  }

  html.${ROOT_CLASS} #${HERO_ID} {
    min-height: 194px;
  }
}

@media (max-width: 900px) {
  html.${ROOT_CLASS} .bili-feed4-layout {
    width: calc(100% - 24px) !important;
    max-width: none !important;
    margin-right: auto !important;
    margin-left: auto !important;
  }

  html.${ROOT_CLASS} .bili-header__bar {
    top: max(6px, env(safe-area-inset-top)) !important;
    left: 8px !important;
    right: 8px !important;
    height: 50px !important;
    border-radius: 15px !important;
  }

  html.${ROOT_CLASS} .left-entry > li:not(:first-child),
  html.${ROOT_CLASS} .mini-header__title,
  html.${ROOT_CLASS} .right-entry > li:not(.header-avatar-wrap):not(:last-child) {
    display: none !important;
  }

  html.${ROOT_CLASS} .center-search-container {
    margin: 0 8px !important;
  }

  html.${ROOT_CLASS} #${HERO_ID} {
    grid-template-columns: 1fr;
    gap: 22px;
    padding: calc(78px + env(safe-area-inset-top)) 18px 24px;
  }

  html.${ROOT_CLASS} .bewlycat-lite__links {
    width: 100%;
  }

  html.${ROOT_CLASS} .bili-header__channel {
    padding: 10px 18px !important;
    overflow-x: auto !important;
  }

  html.${ROOT_CLASS} .right-channel-container {
    min-width: 720px !important;
  }
}

@media (prefers-color-scheme: dark) {
  html.${ROOT_CLASS} {
    --bewly-bg: #111714;
    --bewly-surface: #1b2420;
    --bewly-surface-soft: #242f2a;
    --bewly-text: #eef4f0;
    --bewly-muted: #9eaaa4;
    --bewly-line: rgba(238, 244, 240, 0.11);
    --bewly-accent: #74c9aa;
    --bewly-accent-soft: #243d34;
    color-scheme: dark;
  }

  html.${ROOT_CLASS} body {
    background-image:
      radial-gradient(circle at 8% 2%, rgba(213, 162, 63, 0.14), transparent 26rem),
      radial-gradient(circle at 92% 16%, rgba(116, 201, 170, 0.1), transparent 30rem) !important;
  }

  html.${ROOT_CLASS} .bili-header__bar {
    background: rgba(27, 36, 32, 0.97) !important;
  }

  html.${ROOT_CLASS} .channel-link,
  html.${ROOT_CLASS} .channel-entry-more__link,
  html.${ROOT_CLASS} .bili-video-card,
  html.${ROOT_CLASS} .feed-card,
  html.${ROOT_CLASS} .floor-single-card,
  html.${ROOT_CLASS} .bili-live-card {
    background: rgba(27, 36, 32, 0.92) !important;
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

  function makeLink(label, href) {
    var link = document.createElement("a");
    link.className = "bewlycat-lite__link";
    link.href = href;

    var text = document.createElement("span");
    text.textContent = label;
    var arrow = document.createElement("span");
    arrow.className = "bewlycat-lite__arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";

    link.append(text, arrow);
    return link;
  }

  function buildHero() {
    var hero = document.createElement("section");
    hero.id = HERO_ID;
    hero.setAttribute("aria-label", "BewlyCat 轻量首页");

    var copy = document.createElement("div");
    var eyebrow = document.createElement("div");
    eyebrow.className = "bewlycat-lite__eyebrow";
    eyebrow.textContent = "BEWLYCAT LIGHT";

    var title = document.createElement("h1");
    title.className = "bewlycat-lite__title";
    title.textContent = greeting();

    var date = document.createElement("p");
    date.className = "bewlycat-lite__date";
    date.textContent = dateLabel() + " · 保留 B 站原生播放";

    copy.append(eyebrow, title, date);

    var links = document.createElement("nav");
    links.className = "bewlycat-lite__links";
    links.setAttribute("aria-label", "快捷入口");
    links.append(
      makeLink("动态", "https://t.bilibili.com/"),
      makeLink("热门", "https://www.bilibili.com/v/popular/all"),
      makeLink("稍后再看", "https://www.bilibili.com/watchlater/"),
      makeLink("历史", "https://www.bilibili.com/account/history")
    );

    hero.append(copy, links);
    return hero;
  }

  function mountHero(attempt) {
    if (!isHomePage() || document.getElementById(HERO_ID)) return;

    if (document.body) {
      document.body.insertBefore(buildHero(), document.body.firstChild);
      return;
    }

    if (attempt < 40) {
      mountTimer = window.setTimeout(function () {
        mountHero(attempt + 1);
      }, 100);
    }
  }

  function activate() {
    if (!isHomePage()) return;
    document.documentElement.classList.add(ROOT_CLASS);
    addStyles();
    mountHero(0);
    installed = true;
  }

  function deactivate() {
    document.documentElement.classList.remove(ROOT_CLASS);
    var hero = document.getElementById(HERO_ID);
    if (hero) hero.remove();
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
