// ==UserScript==
// @name         BewlyCat for Stay
// @namespace    https://github.com/keleus/BewlyCat
// @version      1.6.6-stay.5
// @description  BewlyCat 的 Safari/Stay 轻量兼容版，仅限个人非商业使用。
// @author       Keleus; Stay compatibility port by Codex
// @homepageURL  https://github.com/cth123456/script-library
// @source       https://github.com/keleus/BewlyCat/commit/eb2f273365158c867cc0da39902cc50813318518
// @downloadURL  https://raw.githubusercontent.com/cth123456/script-library/main/userscripts/bilibili/bewlycat-stay.user.js
// @updateURL    https://raw.githubusercontent.com/cth123456/script-library/main/userscripts/bilibili/bewlycat-stay.user.js
// @license      Custom License - personal study and non-commercial modification only
// @match        *://www.bilibili.com/*
// @match        *://search.bilibili.com/*
// @match        *://t.bilibili.com/*
// @match        *://space.bilibili.com/*
// @match        *://message.bilibili.com/*
// @match        *://member.bilibili.com/*
// @match        *://account.bilibili.com/*
// @match        *://www.hdslb.com/*
// @match        *://passport.bilibili.com/*
// @match        *://music.bilibili.com/*
// @run-at       document-start
// @noframes
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  var VERSION = "1.6.6-stay.5";
  var PAYLOAD_URL =
    globalThis.__BEWLYCAT_STAY_PAYLOAD_URL__ || "https://raw.githubusercontent.com/cth123456/script-library/e060d01637b83bda1e59bd080315c6d68c070e90/userscripts/bilibili/bewlycat-stay.payload.js?v=1.6.6-stay.5";
  var PAYLOAD_MARKER = "/* BewlyCat Stay payload " + VERSION + " */";
  var STORAGE_PREFIX = "__bewlycat_stay__:";
  var BOOT_ATTEMPT_KEY = "__bewlycat_stay_boot_attempt__";
  var ROOT_ATTRIBUTE = "data-bewlycat-stay-loader";
  var ready = false;
  var watchdog = null;
  var timings = (globalThis.__BEWLYCAT_STAY_TIMINGS__ = {
    loaderStart: performance.now(),
    version: VERSION,
  });

  if (window.top !== window.self) return;

  function isHomePage() {
    return (
      location.hostname === "www.bilibili.com" &&
      (location.pathname === "/" || location.pathname === "/index.html")
    );
  }

  function readSettings() {
    try {
      var stored = localStorage.getItem(STORAGE_PREFIX + "settings");
      if (!stored) return {};
      stored = JSON.parse(stored);
      if (typeof stored === "string") stored = JSON.parse(stored);
      return stored || {};
    } catch (error) {
      return {};
    }
  }

  function shouldBypassOnce() {
    try {
      if (sessionStorage.getItem(BOOT_ATTEMPT_KEY) !== "bypass") return false;
      sessionStorage.removeItem(BOOT_ATTEMPT_KEY);
      return true;
    } catch (error) {
      return false;
    }
  }

  function shellMarkup() {
    var dark = matchMedia("(prefers-color-scheme: dark)").matches;
    var background = dark ? "#17181b" : "#f4f5f7";
    var text = dark ? "#d8dbe0" : "#5a6270";
    return (
      "<head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
      "<title>哔哩哔哩</title><style id='bewlycat-stay-boot-shield'>" +
      "html,body{margin:0;min-height:100%;background:" +
      background +
      ";color:" +
      text +
      ";font:14px -apple-system,BlinkMacSystemFont,sans-serif}" +
      "body{overflow:hidden}#bewlycat-stay-loader{position:fixed;inset:0;display:grid;" +
      "place-content:center;gap:14px;text-align:center}" +
      "#bewlycat-stay-loader:before{content:'';width:28px;height:28px;margin:auto;" +
      "border:3px solid rgba(0,174,236,.18);border-top-color:#00aeec;border-radius:50%;" +
      "animation:bewlycat-stay-spin .75s linear infinite}" +
      "@keyframes bewlycat-stay-spin{to{transform:rotate(360deg)}}" +
      "</style></head><body><div id='bewlycat-stay-loader'>正在加载 BewlyCat</div></body>"
    );
  }

  function installFallbackShield() {
    var root = document.documentElement;
    if (!root) return;
    root.setAttribute(ROOT_ATTRIBUTE, VERSION);
    root.setAttribute("data-bewlycat-stay-booting", "");
    if (document.getElementById("bewlycat-stay-boot-shield")) return;
    var style = document.createElement("style");
    style.id = "bewlycat-stay-boot-shield";
    style.textContent =
      "html[data-bewlycat-stay-booting]{background:#f4f5f7!important}" +
      "html[data-bewlycat-stay-booting] body{visibility:hidden!important}" +
      "@media(prefers-color-scheme:dark){html[data-bewlycat-stay-booting]{" +
      "background:#17181b!important}}";
    root.appendChild(style);
  }

  function createCleanHomepage() {
    window.stop();
    return new Promise(function (resolve) {
      setTimeout(function () {
        var root = document.documentElement;
        if (!root) {
          root = document.createElement("html");
          document.appendChild(root);
        }
        root.lang = "zh-CN";
        root.setAttribute(ROOT_ATTRIBUTE, VERSION);
        root.setAttribute("data-bewlycat-stay-booting", "");
        root.innerHTML = shellMarkup();
        globalThis.__BEWLYCAT_STAY_CLEAN_HOME__ = true;
        timings.shellReady = performance.now();
        resolve();
      }, 0);
    });
  }

  function removeShield() {
    document.documentElement?.removeAttribute("data-bewlycat-stay-booting");
    document.getElementById("bewlycat-stay-boot-shield")?.remove();
    document.getElementById("bewlycat-stay-loader")?.remove();
  }

  function markReady() {
    if (ready) return;
    ready = true;
    timings.ready = performance.now();
    clearTimeout(watchdog);
    removeShield();
    try {
      sessionStorage.removeItem(BOOT_ATTEMPT_KEY);
    } catch (error) {
      // Ignore restricted session storage.
    }
  }

  function recover(error) {
    console.error("[BewlyCat Stay] loader failed", error);
    clearTimeout(watchdog);
    removeShield();
    if (!isHomePage()) return;
    try {
      sessionStorage.setItem(BOOT_ATTEMPT_KEY, "bypass");
      location.reload();
    } catch (storageError) {
      location.href = location.href;
    }
  }

  function openDatabase() {
    return new Promise(function (resolve, reject) {
      if (!globalThis.indexedDB) {
        reject(new Error("IndexedDB is unavailable"));
        return;
      }
      var request = indexedDB.open("bewlycat-stay-cache", 1);
      request.onupgradeneeded = function () {
        if (!request.result.objectStoreNames.contains("payloads")) {
          request.result.createObjectStore("payloads");
        }
      };
      request.onsuccess = function () {
        resolve(request.result);
      };
      request.onerror = function () {
        reject(request.error || new Error("Cannot open payload cache"));
      };
    });
  }

  async function readCachedPayload() {
    var database = await openDatabase();
    try {
      return await new Promise(function (resolve, reject) {
        var request = database
          .transaction("payloads", "readonly")
          .objectStore("payloads")
          .get(VERSION);
        request.onsuccess = function () {
          resolve(request.result || "");
        };
        request.onerror = function () {
          reject(request.error || new Error("Cannot read payload cache"));
        };
      });
    } finally {
      database.close();
    }
  }

  async function writeCachedPayload(source) {
    try {
      var database = await openDatabase();
      await new Promise(function (resolve, reject) {
        var transaction = database.transaction("payloads", "readwrite");
        transaction.objectStore("payloads").put(source, VERSION);
        transaction.oncomplete = resolve;
        transaction.onerror = function () {
          reject(transaction.error || new Error("Cannot write payload cache"));
        };
      });
      database.close();
    } catch (error) {
      console.warn("[BewlyCat Stay] payload cache unavailable", error);
    }
  }

  function validPayload(source) {
    return (
      typeof source === "string" &&
      source.length > 100000 &&
      source.indexOf(PAYLOAD_MARKER) === 0
    );
  }

  async function fetchPayload(cacheMode) {
    var response = await fetch(PAYLOAD_URL, {
      cache: cacheMode || "force-cache",
      credentials: "omit",
    });
    if (!response.ok) {
      throw new Error("Payload request failed: HTTP " + response.status);
    }
    var source = await response.text();
    if (!validPayload(source)) {
      throw new Error("Payload validation failed");
    }
    return source;
  }

  async function loadPayload() {
    var cached = "";
    try {
      cached = await Promise.race([
        readCachedPayload(),
        new Promise(function (resolve) {
          setTimeout(function () {
            resolve("");
          }, 250);
        }),
      ]);
    } catch (error) {
      cached = "";
    }
    if (validPayload(cached)) return cached;

    try {
      var source = await fetchPayload("force-cache");
      timings.payloadSource = "network";
      writeCachedPayload(source);
      return source;
    } catch (firstError) {
      var retried = await fetchPayload("reload");
      timings.payloadSource = "network-retry";
      writeCachedPayload(retried);
      return retried;
    }
  }

  async function start() {
    if (shouldBypassOnce()) return;
    if (
      document.documentElement?.hasAttribute(ROOT_ATTRIBUTE) ||
      globalThis.__BEWLYCAT_STAY_LOADER__
    ) {
      return;
    }
    globalThis.__BEWLYCAT_STAY_LOADER__ = VERSION;

    var settings = readSettings();
    var customHomepage =
      isHomePage() && !settings.useOriginalBilibiliHomepage;
    if (customHomepage && !settings.useOriginalBilibiliTopBar) {
      try {
        await createCleanHomepage();
      } catch (error) {
        installFallbackShield();
      }
    } else if (customHomepage) {
      installFallbackShield();
    }

    window.addEventListener("bewlyStayVisible", markReady, { once: true });
    watchdog = setTimeout(function () {
      var container = document.querySelector("#bewly");
      var visible =
        container &&
        getComputedStyle(container).display !== "none" &&
        getComputedStyle(container).visibility !== "hidden" &&
        Number(getComputedStyle(container).opacity || "0") > 0;
      if (visible) markReady();
      else recover(new Error("Startup timed out"));
    }, 15000);

    try {
      var source = await loadPayload();
      if (!timings.payloadSource) timings.payloadSource = "indexeddb";
      timings.evalStart = performance.now();
      (0, eval)(source);
      timings.evalEnd = performance.now();
    } catch (error) {
      recover(error);
    }
  }

  if (document.documentElement) {
    start();
  } else {
    var observer = new MutationObserver(function () {
      if (!document.documentElement) return;
      observer.disconnect();
      start();
    });
    observer.observe(document, { childList: true });
  }
})();
