WidgetMetadata = {
  id: "forward.adult.aggregate",
  title: "成人聚合搜索",
  version: "0.1.0",
  requiredVersion: "0.0.1",
  description:
    "聚合服务器资源、Hanime1、MissAV、Jable 的搜索结果，并用番号/标题优先匹配服务器播放源。",
  author: "Codex",
  site: "https://github.com/cth123456/script-library",
  detailCacheDuration: 120,
  globalParams: [
    {
      name: "serverApi",
      title: "服务器搜索 API",
      type: "input",
      value: "",
      description:
        "可选。GET JSON 接口，模块会追加 q/code/title 参数。返回 results/items/data 或数组。",
    },
    {
      name: "serverToken",
      title: "服务器 Token",
      type: "input",
      value: "",
      description: "可选。填写后使用 Authorization: Bearer <token> 请求服务器 API。",
    },
  ],
  modules: [
    {
      title: "聚合搜索",
      description: "同时搜索网站和你的服务器资源",
      requiresWebView: false,
      functionName: "loadAggregate",
      cacheDuration: 60,
      params: [
        {
          name: "keyword",
          title: "关键词/番号",
          type: "input",
          description: "例如 SNOS-283、FC2-PPV-1234567 或标题关键词",
        },
        {
          name: "source",
          title: "来源",
          type: "enumeration",
          value: "all",
          enumOptions: [
            { title: "全部", value: "all" },
            { title: "服务器", value: "server" },
            { title: "Hanime1", value: "hanime1" },
            { title: "MissAV", value: "missav" },
            { title: "Jable", value: "jable" },
          ],
        },
        {
          name: "preferServer",
          title: "服务器优先",
          type: "enumeration",
          value: "yes",
          enumOptions: [
            { title: "开启", value: "yes" },
            { title: "关闭", value: "no" },
          ],
        },
        { name: "page", title: "页码", type: "page", value: "1" },
      ],
    },
    {
      title: "服务器资源",
      description: "只搜索你的服务器资源索引",
      requiresWebView: false,
      functionName: "loadServerOnly",
      cacheDuration: 30,
      params: [
        { name: "keyword", title: "关键词/番号", type: "input" },
        { name: "page", title: "页码", type: "page", value: "1" },
      ],
    },
    {
      id: "loadResource",
      title: "聚合播放资源",
      functionName: "loadResource",
      type: "stream",
      cacheDuration: 0,
      requiresWebView: false,
      params: [],
    },
  ],
  search: {
    title: "聚合搜索",
    functionName: "search",
    params: [
      { name: "keyword", title: "关键词", type: "input" },
      { name: "page", title: "页码", type: "page" },
    ],
  },
};

var ADULT_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
};
var HANIME1_BASE = "https://hanime1.me";
var MISSAV_BASE = "https://missav.ai";
var JABLE_BASE = "https://jable.tv";
var READER_BASE = "https://r.jina.ai/";
var AGG_CACHE = {};

function decodeHtml(value) {
  return String(value || "")
    .replace(/&#x([0-9a-f]+);/gi, function (_, code) {
      return String.fromCharCode(parseInt(code, 16));
    })
    .replace(/&#([0-9]+);/g, function (_, code) {
      return String.fromCharCode(parseInt(code, 10));
    })
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cleanText(value) {
  return decodeHtml(
    String(value || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function attr(tag, name) {
  var pattern = new RegExp("\\b" + name + "\\s*=\\s*([\"'])([\\s\\S]*?)\\1", "i");
  var match = String(tag || "").match(pattern);
  return match ? decodeHtml(match[2]).trim() : "";
}

function firstMatch(text, pattern, group) {
  var match = String(text || "").match(pattern);
  return match ? decodeHtml(match[group || 1]).trim() : "";
}

function absoluteUrl(base, url) {
  url = decodeHtml(String(url || "")).trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.indexOf("//") === 0) return "https:" + url;
  if (url.charAt(0) === "/") return base.replace(/\/$/, "") + url;
  return base.replace(/\/$/, "") + "/" + url;
}

function appendQuery(url, values) {
  var parts = [];
  for (var key in values || {}) {
    var value = values[key];
    if (value === undefined || value === null || value === "") continue;
    parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(value)));
  }
  if (!parts.length) return url;
  return url + (url.indexOf("?") >= 0 ? "&" : "?") + parts.join("&");
}

function parseJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(String(value));
  } catch (error) {
    return null;
  }
}

function uniq(items) {
  var seen = {};
  var results = [];
  for (var i = 0; i < (items || []).length; i++) {
    var item = items[i];
    if (!item) continue;
    var key = String(item.source || "") + "|" + String(item.code || "") + "|" + String(item.url || item.link || item.title || "");
    if (seen[key]) continue;
    seen[key] = true;
    results.push(item);
  }
  return results;
}

function extractCode(value) {
  var text = decodeHtml(String(value || "")).toUpperCase();
  var fc2 = text.match(/\bFC2\s*[-_ ]?\s*(?:PPV\s*[-_ ]?\s*)?(\d{5,8})\b/i);
  if (fc2) return "FC2-PPV-" + fc2[1];

  var blacklist = {
    H264: true,
    H265: true,
    HEVC: true,
    X264: true,
    X265: true,
    FHD: true,
    UHD: true,
    HD: true,
  };
  var pattern = /\b([A-Z]{2,8})[-_ ]?(\d{2,6})\b/g;
  var match;
  while ((match = pattern.exec(text))) {
    var prefix = match[1].toUpperCase();
    if (blacklist[prefix]) continue;
    if (/^\d+$/.test(prefix)) continue;
    return prefix + "-" + match[2];
  }
  return "";
}

function packedLink(payload) {
  return "adultagg:" + encodeURIComponent(JSON.stringify(payload || {}));
}

function unpackLink(link) {
  var text = String(link || "");
  if (text.indexOf("adultagg:") !== 0) return null;
  try {
    return JSON.parse(decodeURIComponent(text.slice("adultagg:".length)));
  } catch (error) {
    return null;
  }
}

function sourceTitle(source) {
  var map = {
    server: "服务器",
    hanime1: "Hanime1",
    missav: "MissAV",
    jable: "Jable",
  };
  return map[source] || source || "未知";
}

function toVideoItem(raw) {
  if (!raw || !raw.title) return null;
  var code = raw.code || extractCode(raw.title + " " + (raw.url || ""));
  var payload = {
    source: raw.source,
    title: raw.title,
    code: code,
    url: raw.url || "",
    videoUrl: raw.videoUrl || "",
    coverUrl: raw.coverUrl || "",
    previewUrl: raw.previewUrl || "",
    quality: raw.quality || "",
  };
  var link = packedLink(payload);
  var titlePrefix = raw.source === "server" ? "[服务器] " : "[" + sourceTitle(raw.source) + "] ";
  return {
    id: raw.source + ":" + (code || raw.url || raw.title),
    type: "url",
    mediaType: "movie",
    title: titlePrefix + raw.title,
    description: [code, sourceTitle(raw.source), raw.quality].filter(Boolean).join(" | "),
    coverUrl: raw.coverUrl || raw.posterPath || raw.backdropPath,
    posterPath: raw.coverUrl || raw.posterPath || raw.backdropPath,
    backdropPath: raw.backdropPath || raw.coverUrl || raw.posterPath,
    previewUrl: raw.previewUrl,
    videoUrl: raw.videoUrl,
    link: link,
    playerType: "system",
    customHeaders: raw.headers,
  };
}

async function requestText(url, headers, fallbackReader) {
  var cacheKey = url;
  var now = Date.now();
  var cached = AGG_CACHE[cacheKey];
  if (cached && cached.expires > now) return cached.text;

  var text = "";
  try {
    var response = await Widget.http.get(url, { headers: headers || ADULT_HEADERS });
    text = response && response.data;
  } catch (error) {
    text = "";
  }

  if ((!text || String(text).length < 200 || /just a moment|cf-chl-|cloudflare/i.test(String(text))) && fallbackReader) {
    var reader = await Widget.http.get(READER_BASE + url, {
      headers: { Accept: "text/html", "X-Return-Format": "html" },
    });
    text = reader && reader.data;
  }

  text = String(text || "");
  AGG_CACHE[cacheKey] = { text: text, expires: now + 120000 };
  return text;
}

function serverHeaders(params) {
  var headers = { Accept: "application/json" };
  if (params && params.serverToken) headers.Authorization = "Bearer " + params.serverToken;
  return headers;
}

function serverRows(data) {
  var parsed = parseJson(data);
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.results)) return parsed.results;
  if (Array.isArray(parsed.items)) return parsed.items;
  if (Array.isArray(parsed.data)) return parsed.data;
  if (parsed.result && Array.isArray(parsed.result.items)) return parsed.result.items;
  return [];
}

function normalizeServerItem(item, query) {
  if (!item) return null;
  var title = item.title || item.name || item.fileName || item.filename || item.path || query;
  var url = item.videoUrl || item.url || item.streamUrl || item.playUrl || item.fileUrl || item.path;
  if (!title || !url) return null;
  return {
    source: "server",
    title: cleanText(title),
    code: item.code || item.number || item.javCode || extractCode(title),
    url: url,
    videoUrl: url,
    coverUrl: item.coverUrl || item.posterPath || item.poster || item.image || item.thumb || "",
    quality: item.quality || item.resolution || item.source || "服务器",
    headers: item.headers || item.customHeaders,
  };
}

async function queryServer(params, query, code, limit) {
  params = params || {};
  var api = String(params.serverApi || "").trim();
  if (!api) return [];
  var url = appendQuery(api, {
    q: query || code || "",
    code: code || extractCode(query),
    title: query || "",
    limit: limit || 12,
  });
  try {
    var response = await Widget.http.get(url, { headers: serverHeaders(params) });
    var rows = serverRows(response && response.data);
    var results = [];
    for (var i = 0; i < rows.length; i++) {
      var normalized = normalizeServerItem(rows[i], query || code);
      if (normalized) results.push(normalized);
    }
    return results;
  } catch (error) {
    console.warn("[adult-aggregate] server search failed:", error.message || error);
    return [];
  }
}

function parseHanimeCards(html) {
  var results = [];
  var seen = {};
  var source = String(html || "");
  var linkPattern = /<a\b([^>]*\bhref\s*=\s*(["'])(?:https?:\/\/hanime1\.me)?\/watch\?v=(\d+)[^"']*\2[^>]*)>([\s\S]*?)<\/a>/gi;
  var match;
  while ((match = linkPattern.exec(source))) {
    var id = match[3];
    var block = match[4];
    if (seen[id]) continue;
    var title = cleanText(firstMatch(block, /<div\b[^>]*class=["'][^"']*(?:home-rows-videos-title|card-mobile-title|\btitle\b)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) || firstMatch(block, /<img\b[^>]*\balt=["']([^"']+)["'][^>]*>/i));
    var imgTag = firstMatch(block, /(<img\b[^>]*>)/i);
    var image = attr(imgTag, "src") || attr(imgTag, "data-src");
    if (!title || !image) continue;
    seen[id] = true;
    results.push({
      source: "hanime1",
      title: title,
      code: extractCode(title),
      url: HANIME1_BASE + "/watch?v=" + id,
      coverUrl: image,
      headers: hanimeHeaders(id),
    });
  }
  return results;
}

async function searchHanime(keyword, page) {
  keyword = String(keyword || "").trim();
  if (!keyword) return [];
  var url = appendQuery(HANIME1_BASE + "/search", { query: keyword, page: page || 1 });
  var html = await requestText(url, ADULT_HEADERS, true);
  return parseHanimeCards(html);
}

function parseMissavCards(html) {
  var text = String(html || "");
  var blocks = text.match(/<div\b[^>]*class=["'][^"']*group[^"']*["'][\s\S]*?(?=<div\b[^>]*class=["'][^"']*group[^"']*["']|$)/gi) || [];
  var results = [];
  var seen = {};
  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    var href = firstMatch(block, /<a\b[^>]*href=["']([^"']+)["'][^>]*>/i);
    if (!href || seen[href]) continue;
    var title = cleanText(firstMatch(block, /<a\b[^>]*class=["'][^"']*text-secondary[^"']*["'][^>]*>([\s\S]*?)<\/a>/i) || firstMatch(block, /<a\b[^>]*href=["'][^"']+["'][^>]*>([\s\S]*?)<\/a>/i));
    var imgTag = firstMatch(block, /(<img\b[^>]*>)/i);
    var image = attr(imgTag, "data-src") || attr(imgTag, "src");
    if (!title) continue;
    seen[href] = true;
    results.push({
      source: "missav",
      title: title,
      code: extractCode(title || href),
      url: absoluteUrl(MISSAV_BASE, href),
      coverUrl: absoluteUrl(MISSAV_BASE, image),
      headers: { Referer: MISSAV_BASE + "/", "User-Agent": ADULT_HEADERS["User-Agent"] },
    });
  }
  return results;
}

async function searchMissav(keyword, page) {
  keyword = String(keyword || "").trim();
  if (!keyword) return [];
  var url = MISSAV_BASE + "/cn/search/" + encodeURIComponent(keyword);
  if (Number(page || 1) > 1) url = appendQuery(url, { page: page });
  var html = await requestText(url, { Referer: MISSAV_BASE + "/", "User-Agent": ADULT_HEADERS["User-Agent"] }, false);
  return parseMissavCards(html);
}

function parseJableCards(html) {
  var text = String(html || "");
  var results = [];
  var seen = {};
  var anchorPattern = /<a\b[^>]*href=["']([^"']*jable\.tv\/videos\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  var match;
  while ((match = anchorPattern.exec(text))) {
    var href = absoluteUrl(JABLE_BASE, match[1]);
    if (seen[href]) continue;
    var start = Math.max(0, match.index - 1200);
    var end = Math.min(text.length, anchorPattern.lastIndex + 1200);
    var block = text.slice(start, end);
    var title = cleanText(match[2]) || cleanText(firstMatch(block, /<div\b[^>]*class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/div>/i));
    var imgTag = firstMatch(block, /(<img\b[^>]*>)/i);
    var image = attr(imgTag, "data-src") || attr(imgTag, "src");
    var preview = attr(imgTag, "data-preview");
    if (!title) continue;
    seen[href] = true;
    results.push({
      source: "jable",
      title: title,
      code: extractCode(title || href),
      url: href,
      coverUrl: absoluteUrl(JABLE_BASE, image),
      previewUrl: absoluteUrl(JABLE_BASE, preview),
      headers: { Referer: JABLE_BASE + "/", "User-Agent": ADULT_HEADERS["User-Agent"] },
    });
  }
  return results;
}

async function searchJable(keyword, page) {
  keyword = String(keyword || "").trim();
  if (!keyword) return [];
  var url = JABLE_BASE + "/search/" + encodeURIComponent(keyword) + "/";
  url = appendQuery(url, {
    mode: "async",
    function: "get_block",
    block_id: "list_videos_videos_list_search_result",
    q: keyword,
    from: Math.max(0, Number(page || 1) - 1) * 24,
  });
  var html = await requestText(url, { Referer: JABLE_BASE + "/", "User-Agent": ADULT_HEADERS["User-Agent"] }, false);
  return parseJableCards(html);
}

async function loadAggregate(params) {
  params = params || {};
  var keyword = String(params.keyword || "").trim();
  if (!keyword) return [];
  var source = params.source || "all";
  var page = Number(params.page || 1);
  var code = extractCode(keyword);
  var all = [];

  if (source === "all" || source === "server") {
    all = all.concat(await queryServer(params, keyword, code, 20));
  }
  if (source === "all" || source === "hanime1") {
    all = all.concat(await safeSource(function () { return searchHanime(keyword, page); }, "hanime1"));
  }
  if (source === "all" || source === "missav") {
    all = all.concat(await safeSource(function () { return searchMissav(keyword, page); }, "missav"));
  }
  if (source === "all" || source === "jable") {
    all = all.concat(await safeSource(function () { return searchJable(keyword, page); }, "jable"));
  }

  all = uniq(all);
  if (params.preferServer !== "no") all.sort(sortServerFirst);
  return all.map(toVideoItem).filter(Boolean);
}

async function loadServerOnly(params) {
  params = params || {};
  var keyword = String(params.keyword || "").trim();
  if (!keyword) return [];
  return (await queryServer(params, keyword, extractCode(keyword), 30)).map(toVideoItem).filter(Boolean);
}

async function search(params) {
  params = params || {};
  params.source = params.source || "all";
  return loadAggregate(params);
}

async function safeSource(fn, name) {
  try {
    return await fn();
  } catch (error) {
    console.warn("[adult-aggregate] " + name + " failed:", error.message || error);
    return [];
  }
}

function sortServerFirst(a, b) {
  if (a.source === "server" && b.source !== "server") return -1;
  if (a.source !== "server" && b.source === "server") return 1;
  return 0;
}

async function loadDetail(link) {
  var payload = unpackLink(link) || { url: link, source: "unknown" };
  var serverMatches = await queryServer(arguments.length > 1 ? arguments[1] : {}, payload.title || payload.code, payload.code, 5);
  var detail = {
    id: payload.source + ":" + (payload.code || payload.url || payload.title),
    type: "url",
    mediaType: "movie",
    title: payload.title || payload.code || sourceTitle(payload.source),
    description: [payload.code, sourceTitle(payload.source)].filter(Boolean).join(" | "),
    coverUrl: payload.coverUrl,
    posterPath: payload.coverUrl,
    backdropPath: payload.coverUrl,
    previewUrl: payload.previewUrl,
    link: packedLink(payload),
    playerType: "system",
  };

  if (serverMatches.length) {
    detail.videoUrl = serverMatches[0].videoUrl;
    detail.relatedItems = serverMatches.map(toVideoItem).filter(Boolean);
  } else if (payload.videoUrl) {
    detail.videoUrl = payload.videoUrl;
  } else if (payload.source === "hanime1") {
    var hanime = await hanimeDetail(payload);
    mergeDetail(detail, hanime);
  } else if (payload.source === "missav") {
    var missav = await missavDetail(payload);
    mergeDetail(detail, missav);
  } else if (payload.source === "jable") {
    var jable = await jableDetail(payload);
    mergeDetail(detail, jable);
  }
  return detail;
}

function mergeDetail(target, source) {
  source = source || {};
  for (var key in source) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") target[key] = source[key];
  }
  return target;
}

function hanimeHeaders(idOrUrl) {
  var id = firstMatch(idOrUrl, /[?&]v=(\d+)/i) || firstMatch(idOrUrl, /:(\d+)$/) || idOrUrl;
  return {
    Referer: HANIME1_BASE + "/watch?v=" + encodeURIComponent(String(id || "")),
    Origin: HANIME1_BASE,
    "User-Agent": ADULT_HEADERS["User-Agent"],
  };
}

function parseMp4Sources(html) {
  var results = [];
  var seen = {};
  var pattern = /https:(?:\\?\/){2}vdownload\.hembed\.com(?:\\?\/)[^"' <>)]+?\.mp4(?:\?[^"' <>)]+)?/gi;
  var match;
  while ((match = pattern.exec(String(html || "")))) {
    var url = decodeHtml(match[0]).replace(/\\\//g, "/").replace(/&amp;/g, "&");
    if (seen[url]) continue;
    seen[url] = true;
    var q = firstMatch(url, /-(\d{3,4})p?\.mp4/i) || "MP4";
    results.push({ quality: q, url: url });
  }
  results.sort(function (a, b) { return Number(b.quality || 0) - Number(a.quality || 0); });
  return results;
}

async function hanimeDetail(payload) {
  var url = payload.url;
  var html = await requestText(url, hanimeHeaders(url), true);
  var sources = parseMp4Sources(html);
  if (!sources.length) {
    var id = firstMatch(url, /[?&]v=(\d+)/i);
    if (id) sources = parseMp4Sources(await requestText(HANIME1_BASE + "/download?v=" + id, hanimeHeaders(id), true));
  }
  return {
    title: cleanText(firstMatch(html, /<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)) || payload.title,
    coverUrl: firstMatch(html, /<video\b[^>]*poster=["']([^"']+)["']/i) || payload.coverUrl,
    videoUrl: sources.length ? sources[0].url : "",
    customHeaders: hanimeHeaders(url),
  };
}

async function missavDetail(payload) {
  var html = await requestText(payload.url, { Referer: MISSAV_BASE + "/", "User-Agent": ADULT_HEADERS["User-Agent"] }, false);
  var videoUrl = firstMatch(html, /(https:\/\/surrit\.com\/[^"'\s<>]+?\.m3u8)/i);
  if (!videoUrl) {
    var uuid = firstMatch(html, /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (uuid) videoUrl = "https://surrit.com/" + uuid + "/playlist.m3u8";
  }
  return {
    title: cleanText(firstMatch(html, /<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)) || payload.title,
    coverUrl: firstMatch(html, /<meta\b[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || payload.coverUrl,
    videoUrl: videoUrl,
    customHeaders: { Referer: MISSAV_BASE + "/", Origin: MISSAV_BASE, "User-Agent": ADULT_HEADERS["User-Agent"] },
  };
}

async function jableDetail(payload) {
  var html = await requestText(payload.url, { Referer: JABLE_BASE + "/", "User-Agent": ADULT_HEADERS["User-Agent"] }, false);
  var videoUrl = firstMatch(html, /var\s+hlsUrl\s*=\s*['"]([^'"]+)['"]/i) || firstMatch(html, /(https?:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*)/i);
  return {
    title: cleanText(firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i)).replace(/\s*-\s*Jable.*$/i, "") || payload.title,
    videoUrl: videoUrl,
    customHeaders: { Referer: payload.url, "User-Agent": ADULT_HEADERS["User-Agent"] },
  };
}

function streamItem(name, url, description, headers) {
  return {
    name: name,
    description: description || name,
    url: url,
    headers: headers,
    customHeaders: headers,
  };
}

async function loadResource(params) {
  params = params || {};
  var payload = unpackLink(params.link) || unpackLink(params.id) || null;
  var code = (payload && payload.code) || extractCode(params.title || params.id || "");
  var title = (payload && payload.title) || params.title || code;

  var serverMatches = await queryServer(params, title, code, 8);
  if (serverMatches.length) {
    return serverMatches.map(function (item, index) {
      return streamItem(
        (index === 0 ? "服务器" : "服务器 " + (index + 1)) + (item.quality ? " " + item.quality : ""),
        item.videoUrl,
        [item.code, item.quality, "服务器资源"].filter(Boolean).join(" | "),
        item.headers
      );
    });
  }

  if (params.videoUrl || (payload && payload.videoUrl)) {
    return [streamItem("直接播放", params.videoUrl || payload.videoUrl, "直接播放", params.customHeaders || (payload && payload.headers))];
  }

  if (!payload) return [];
  if (payload.source === "hanime1") {
    var h = await hanimeDetail(payload);
    return h.videoUrl ? [streamItem("Hanime1", h.videoUrl, "网站播放源", h.customHeaders)] : [];
  }
  if (payload.source === "missav") {
    var m = await missavDetail(payload);
    return m.videoUrl ? [streamItem("MissAV", m.videoUrl, "网站播放源", m.customHeaders)] : [];
  }
  if (payload.source === "jable") {
    var j = await jableDetail(payload);
    return j.videoUrl ? [streamItem("Jable", j.videoUrl, "网站播放源", j.customHeaders)] : [];
  }
  return [];
}
