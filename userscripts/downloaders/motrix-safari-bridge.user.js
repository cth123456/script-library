// ==UserScript==
// @name         Motrix Safari Download Bridge
// @name:zh-CN   Motrix Safari 下载桥
// @namespace    https://github.com/cth123456/script-library
// @version      1.1.0
// @description  Send links to Motrix first and let Safari handle the original link if Motrix rejects it.
// @description:zh-CN  优先将链接发送到 Motrix，失败后由 Safari 原生处理。
// @author       cth123456
// @homepageURL  https://github.com/cth123456/script-library
// @updateURL    https://raw.githubusercontent.com/cth123456/script-library/main/userscripts/downloaders/motrix-safari-bridge.user.js
// @downloadURL  https://raw.githubusercontent.com/cth123456/script-library/main/userscripts/downloaders/motrix-safari-bridge.user.js
// @match        http://*/*
// @match        https://*/*
// @run-at       document-end
// @noframes
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  "use strict";

  if (window.top !== window.self || globalThis.__MOTRIX_SAFARI_BRIDGE__) return;
  globalThis.__MOTRIX_SAFARI_BRIDGE__ = true;

  var RPC_URL = "http://127.0.0.1:16800/jsonrpc";
  var SECRET_KEY = "motrixRpcSecret";
  var RPC_TIMEOUT = 5000;
  var toastTimer = 0;

  function getModernGM(name) {
    return typeof GM === "object" && GM ? GM[name] : undefined;
  }

  function getValue(key, fallback) {
    var api = typeof GM_getValue === "function" ? GM_getValue : getModernGM("getValue");
    if (!api) return Promise.resolve(fallback);
    try {
      return Promise.resolve(api.call(typeof GM === "object" ? GM : null, key, fallback));
    } catch (error) {
      return Promise.resolve(fallback);
    }
  }

  function setValue(key, value) {
    var api = typeof GM_setValue === "function" ? GM_setValue : getModernGM("setValue");
    if (!api) return Promise.resolve();
    try {
      return Promise.resolve(api.call(typeof GM === "object" ? GM : null, key, value));
    } catch (error) {
      return Promise.reject(error);
    }
  }

  function showToast(text, kind) {
    var host = document.getElementById("__motrix_safari_bridge_toast__");
    if (!host) {
      host = document.createElement("div");
      host.id = "__motrix_safari_bridge_toast__";
      host.style.cssText =
        "position:fixed;z-index:2147483647;left:50%;bottom:28px;transform:translateX(-50%);" +
        "max-width:min(520px,calc(100vw - 32px));padding:11px 16px;border-radius:12px;" +
        "font:600 14px/1.45 -apple-system,BlinkMacSystemFont,sans-serif;color:#fff;" +
        "box-shadow:0 8px 28px rgba(0,0,0,.24);text-align:center;pointer-events:none;" +
        "opacity:0;transition:opacity .16s ease;background:#252525";
      (document.documentElement || document.body).appendChild(host);
    }
    host.textContent = text;
    host.style.background = kind === "error" ? "#a62d2d" : kind === "success" ? "#176b46" : "#252525";
    host.style.opacity = "1";
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      host.style.opacity = "0";
    }, 3200);
  }

  function request(details) {
    var api =
      typeof GM_xmlhttpRequest === "function" ? GM_xmlhttpRequest : getModernGM("xmlHttpRequest");
    if (!api) return Promise.reject(new Error("Stay 未提供跨域请求能力"));

    return new Promise(function (resolve, reject) {
      var settled = false;

      function finish(callback, value) {
        if (settled) return;
        settled = true;
        callback(value);
      }

      try {
        var result = api.call(
          typeof GM === "object" ? GM : null,
          Object.assign({}, details, {
            onload: function (response) {
              finish(resolve, response);
            },
            onerror: function () {
              finish(reject, new Error("无法连接 Motrix"));
            },
            ontimeout: function () {
              finish(reject, new Error("连接 Motrix 超时"));
            },
            onabort: function () {
              finish(reject, new Error("Motrix 请求已中止"));
            },
          })
        );
        if (result && typeof result.then === "function") {
          result.then(
            function (response) {
              finish(resolve, response);
            },
            function (error) {
              finish(reject, error instanceof Error ? error : new Error(String(error)));
            }
          );
        }
      } catch (error) {
        finish(reject, error);
      }
    });
  }

  async function getSecret() {
    var saved = String((await getValue(SECRET_KEY, "")) || "").trim();
    if (saved) return saved;

    var entered = window.prompt(
      "请输入 Motrix RPC 密钥。\n可在 Motrix 设置的进阶/高级选项中查看；密钥只保存在 Stay 本地。"
    );
    entered = String(entered || "").trim();
    if (!entered) throw new Error("未设置 Motrix RPC 密钥");
    await setValue(SECRET_KEY, entered);
    return entered;
  }

  async function rpc(method, params, secret) {
    var response = await request({
      method: "POST",
      url: RPC_URL,
      timeout: RPC_TIMEOUT,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({
        jsonrpc: "2.0",
        id: "motrix-safari-" + Date.now(),
        method: method,
        params: ["token:" + secret].concat(params || []),
      }),
    });

    var status = Number(response && response.status);
    if (status && (status < 200 || status >= 300)) {
      throw new Error("Motrix RPC 返回 HTTP " + status);
    }

    var body;
    try {
      body =
        response && typeof response.response === "object" && response.response
          ? response.response
          : JSON.parse(response.responseText || response.response || "");
    } catch (error) {
      throw new Error("Motrix 返回了无效数据");
    }
    if (body.error) {
      throw new Error(body.error.message || "Motrix 拒绝了下载任务");
    }
    return body.result;
  }

  function safeFilename(value) {
    var name = String(value || "")
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/\s+/g, " ")
      .trim();
    return name && name !== "." && name !== ".." ? name.slice(0, 180) : "";
  }

  function inferFilename(url, preferred) {
    var explicit = safeFilename(preferred);
    if (explicit) return explicit;
    try {
      var path = new URL(url, location.href).pathname;
      return safeFilename(decodeURIComponent(path.split("/").pop() || ""));
    } catch (error) {
      return "";
    }
  }

  function buildOptions(url, filename) {
    var options = {
      pause: "false",
      referer: location.href,
      "user-agent": navigator.userAgent,
    };
    if (filename) options.out = filename;

    try {
      var target = new URL(url, location.href);
      if (target.origin === location.origin && document.cookie) {
        options.header = ["Cookie: " + document.cookie];
      }
    } catch (error) {
      // Non-HTTP schemes do not need page cookies.
    }
    return options;
  }

  async function submitToMotrix(url, filename) {
    var secret = await getSecret();
    var gid = await rpc("aria2.addUri", [[url], buildOptions(url, filename)], secret);
    if (!/^[0-9a-f]{16}$/i.test(String(gid || ""))) {
      throw new Error("Motrix 没有返回有效任务编号");
    }

    // A returned GID proves that aria2 accepted the task. Probe once for an immediate rejection.
    try {
      await new Promise(function (resolve) {
        window.setTimeout(resolve, 450);
      });
      var state = await rpc(
        "aria2.tellStatus",
        [gid, ["status", "errorCode", "errorMessage"]],
        secret
      );
      if (state && (state.status === "error" || state.status === "removed")) {
        var taskError = new Error(state.errorMessage || "Motrix 任务立即失败");
        taskError.isMotrixTaskError = true;
        throw taskError;
      }
    } catch (error) {
      if (error && error.isMotrixTaskError) throw error;
      // Do not start a duplicate Safari download after Motrix already returned a valid GID.
    }
    return gid;
  }

  function anchorDownload(url, filename) {
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename || "";
    anchor.target = "_self";
    anchor.style.display = "none";
    (document.body || document.documentElement).appendChild(anchor);
    anchor.click();
    window.setTimeout(function () {
      anchor.remove();
    }, 1000);
  }

  function safariDownload(url, filename, reason) {
    var message = "Motrix 失败，已交给 Safari";
    if (reason) message += "：" + reason;
    showToast(message, "error");
    anchorDownload(url, filename);
  }

  async function startDownload(rawUrl, preferredName) {
    var url;
    try {
      url = new URL(rawUrl, location.href).href;
    } catch (error) {
      showToast("链接无效，无法下载", "error");
      return;
    }

    var filename = inferFilename(url, preferredName);
    if (/^(blob:|data:)/i.test(url)) {
      safariDownload(url, filename, "本地临时链接不能交给 Motrix");
      return;
    }

    showToast("正在提交给 Motrix", "info");
    try {
      var gid = await submitToMotrix(url, filename);
      showToast("Motrix 已接收任务：" + gid.slice(0, 8), "success");
    } catch (error) {
      safariDownload(url, filename, error && error.message);
    }
  }

  function linkFromEvent(event) {
    var node = event.target;
    if (!(node instanceof Element)) return null;
    return node.closest("a[href]");
  }

  document.addEventListener(
    "click",
    function (event) {
      if (!event.isTrusted || event.defaultPrevented || event.button !== 0) return;
      var anchor = linkFromEvent(event);
      if (!anchor) return;

      var explicitDownload = anchor.hasAttribute("download");
      var optionClick = event.altKey;
      if (!explicitDownload && !optionClick) return;

      var href = anchor.href;
      if (!href || /^(javascript:|mailto:|tel:)/i.test(href)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      startDownload(href, anchor.getAttribute("download"));
    },
    true
  );

  async function downloadCurrentMedia() {
    var media = document.querySelector("video, audio");
    var url = media && (media.currentSrc || media.src);
    if (!url) url = location.href;
    await startDownload(url, document.title);
  }

  function configureSecret() {
    getValue(SECRET_KEY, "").then(function (saved) {
      var entered = window.prompt(
        "Motrix RPC 密钥（留空将清除）：",
        String(saved || "")
      );
      if (entered === null) return;
      setValue(SECRET_KEY, String(entered).trim()).then(function () {
        showToast(entered.trim() ? "Motrix 密钥已保存" : "Motrix 密钥已清除", "success");
      });
    });
  }

  var register =
    typeof GM_registerMenuCommand === "function"
      ? GM_registerMenuCommand
      : getModernGM("registerMenuCommand");
  if (register) {
    try {
      register.call(typeof GM === "object" ? GM : null, "下载当前视频或页面", downloadCurrentMedia);
      register.call(typeof GM === "object" ? GM : null, "设置 Motrix RPC 密钥", configureSecret);
    } catch (error) {
      // Stay versions without menu support can still use Option-click.
    }
  }
})();
