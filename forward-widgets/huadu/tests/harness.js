/*
 * 花都影视模块测试公共夹具（纯本地，不访问网络）
 *
 * huadu.js 是宿主脚本：顶层赋值 WidgetMetadata、使用全局 Widget，并在末尾挂
 * globalThis.huaduWidgetApi 命名空间。测试用 require 加载它，并通过每次清缓存
 * 获得干净的模块状态；HTTP 全部走下面的假宿主路由表。
 */

"use strict";

const fs = require("fs");
const path = require("path");

const MODULE_SOURCE = fs.readFileSync(path.join(__dirname, "..", "huadu.js"), "utf8");

// 构造一个假的宿主：http.get 走路由表，storage 可正常或「坏掉」
function createWidget(options) {
  const opts = options || {};
  const state = {
    calls: [],
    storage: Object.assign({}, opts.storage || {}),
    storageBroken: !!opts.storageBroken,
    routes: opts.routes || {},
  };

  state.findRoute = function findRoute(url) {
    const keys = Object.keys(state.routes);
    for (const key of keys) {
      if (url.indexOf(key) >= 0) return state.routes[key];
    }
    return undefined;
  };

  const widget = {
    http: {
      async get(url, requestOptions) {
        state.calls.push({ url: url, options: requestOptions || {} });
        if (opts.intercept) {
          const injected = opts.intercept(url, state);
          if (injected) return injected;
        }
        const route = state.findRoute(url);
        if (route === undefined) return { statusCode: 404, data: "not found" };
        if (typeof route === "function") return route(url, state);
        return route;
      },
    },
    storage: {
      async get(key) {
        if (state.storageBroken) throw new Error("storage unavailable");
        return state.storage[key];
      },
      async set(key, value) {
        if (state.storageBroken) throw new Error("storage unavailable");
        state.storage[key] = value;
      },
      async remove(key) {
        if (state.storageBroken) throw new Error("storage unavailable");
        delete state.storage[key];
      },
    },
  };
  return { widget: widget, state: state };
}

// 加载模块：清 require 缓存 -> 注入全局 Widget -> require 取模块导出
function loadModule(widget) {
  delete require.cache[require.resolve("../huadu.js")];
  global.Widget = widget;
  const api = require("../huadu.js");
  return { metadata: global.WidgetMetadata, api: api };
}

module.exports = {
  MODULE_SOURCE: MODULE_SOURCE,
  createWidget: createWidget,
  loadModule: loadModule,
};
