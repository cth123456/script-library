WidgetMetadata = {
  id: "HuangGuo.DuanJu_TuT",
  title: "黄果短剧",
  description: "黄果短剧列表、分类、搜索、详情及按集实时取播放地址。",
  author: "Codex",
  version: "0.1.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 0,
  site: "https://huangguoai.com",
  icon: "https://huangguoai.com/favicon.ico",
  globalParams: [
    {
      name: "coverWorker",
      title: "封面解密 Worker",
      type: "input",
      value: "",
      description: "留空时复用此模块存储的 Worker 地址；新安装可填入你自己的封面解密 Worker。",
    },
  ],
  modules: [
    {
      title: "热门推荐",
      functionName: "loadRecommend",
      cacheDuration: 600,
      params: [{ name: "page", title: "页码", type: "page", value: "1" }],
    },
    {
      title: "最近上新",
      functionName: "loadNewest",
      cacheDuration: 600,
      params: [{ name: "page", title: "页码", type: "page", value: "1" }],
    },
    {
      title: "AI短剧",
      functionName: "loadAiDuanju",
      cacheDuration: 600,
      params: [
        {
          name: "channel",
          title: "排序",
          type: "enumeration",
          value: "latest",
          enumOptions: [
            { title: "最新更新", value: "latest" },
            { title: "当前热播", value: "hot" },
            { title: "独家原创", value: "original" },
            { title: "随机推荐", value: "random" },
          ],
        },
        { name: "page", title: "页码", type: "page", value: "1" },
      ],
    },
    {
      title: "AI漫剧",
      functionName: "loadAiManju",
      cacheDuration: 600,
      params: [
        {
          name: "channel",
          title: "排序",
          type: "enumeration",
          value: "latest",
          enumOptions: [
            { title: "最新更新", value: "latest" },
            { title: "当前热播", value: "hot" },
            { title: "独家原创", value: "original" },
            { title: "随机推荐", value: "random" },
          ],
        },
        { name: "page", title: "页码", type: "page", value: "1" },
      ],
    },
    {
      title: "专题",
      functionName: "loadTopics",
      cacheDuration: 600,
      params: [
        {
          name: "topic",
          title: "专题",
          type: "enumeration",
          value: "hot-aiduanju",
          enumOptions: [
            { title: "精品高分短剧", value: "hot-aiduanju" },
            { title: "家庭伦理短剧", value: "luanlun-aiduanju" },
            { title: "灵异诡事短剧", value: "paranormal-aiduanju" },
            { title: "欧美精选短剧", value: "oumei-duanju" },
          ],
        },
        { name: "page", title: "页码", type: "page", value: "1" },
      ],
    },
    {
      title: "排行榜",
      functionName: "loadRanking",
      cacheDuration: 600,
      params: [
        {
          name: "ranking",
          title: "榜单",
          type: "enumeration",
          value: "hot",
          enumOptions: [
            { title: "热播榜", value: "hot" },
            { title: "推荐榜", value: "recommend" },
            { title: "潜力榜", value: "potential" },
          ],
        },
        { name: "page", title: "页码", type: "page", value: "1" },
      ],
    },
    {
      id: "loadResource",
      title: "黄果短剧播放资源",
      functionName: "loadResource",
      type: "stream",
      cacheDuration: 0,
      params: [],
    },
  ],
  search: {
    title: "搜索",
    functionName: "searchVideos",
    params: [
      { name: "keyword", title: "剧名", type: "input", value: "" },
      { name: "page", title: "页码", type: "page", value: "1" },
    ],
  },
};

var HUANGGUO_SITE = "https://huangguoai.com";
var HUANGGUO_STORAGE_WORKER = "hg_cover_worker";
var HUANGGUO_CATEGORIES = {
  aiDuanju: "/ai-duanju/",
  aiManju: "/ai-manju/",
};
var HUANGGUO_TOPICS = [
  "hot-aiduanju",
  "luanlun-aiduanju",
  "paranormal-aiduanju",
  "oumei-duanju",
];
var HUANGGUO_RANKINGS = ["hot", "recommend", "potential"];
var HUANGGUO_EPISODE_LIMIT = 300;

function hgPageNumber(value) {
  var page = parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? Math.min(page, 200) : 1;
}

function hgText(value) {
  return String(value || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x([\da-f]+);/gi, function (_, code) {
      return String.fromCharCode(parseInt(code, 16));
    })
    .replace(/&#(\d+);/g, function (_, code) {
      return String.fromCharCode(parseInt(code, 10));
    })
    .replace(/\s+/g, " ")
    .trim();
}

function hgAbsoluteUrl(value) {
  var url = String(value || "").trim().replace(/&amp;/g, "&");
  if (!url || /^(?:data|blob|javascript):/i.test(url)) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.indexOf("//") === 0) return "https:" + url;
  return HUANGGUO_SITE + (url.charAt(0) === "/" ? url : "/" + url);
}

function hgAttribute(tag, name) {
  var escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var match = String(tag || "").match(
    new RegExp("\\b" + escaped + "\\s*=\\s*['\"]([^'\"]*)", "i"),
  );
  return match ? hgText(match[1]) : "";
}

function hgCoverSource(tag) {
  var names = ["data-src", "data-lazy-src", "data-bg", "data-cover", "data-image", "data-thumb", "src"];
  for (var i = 0; i < names.length; i++) {
    var value = hgAttribute(tag, names[i]);
    if (value && !/cover-placeholder|avatar-default/i.test(value)) return hgAbsoluteUrl(value);
  }
  return "";
}

async function hgWorkerUrl(params) {
  var override = String((params && params.coverWorker) || "").trim().replace(/\/+$/, "");
  if (override) {
    try {
      if (Widget.storage && Widget.storage.set) await Widget.storage.set(HUANGGUO_STORAGE_WORKER, override);
    } catch (_) {}
    return override;
  }
  try {
    var saved = await Widget.storage.get(HUANGGUO_STORAGE_WORKER);
    if (typeof saved === "string" && /^https:\/\//i.test(saved)) return saved.replace(/\/+$/, "");
  } catch (_) {}
  return "";
}

function hgCoverUrl(source, worker) {
  if (!source || !worker) return source || "";
  if (source.indexOf(worker) === 0) return source;
  return worker + (worker.indexOf("?") >= 0 ? "&" : "?") + "url=" + encodeURIComponent(source);
}

function hgListUrl(path, page, sort) {
  var question = path.indexOf("?");
  var pathname = question >= 0 ? path.slice(0, question) : path;
  var query = question >= 0 ? path.slice(question + 1) : "";
  var widgetPath = pathname + (query ? "?" + query : "") + (sort ? (query ? "&" : "?") + "sort=" + encodeURIComponent(sort) : "");
  var params = [];
  if (query) params.push(query);
  if (sort) params.push("sort=" + encodeURIComponent(sort));
  params.push("page=" + hgPageNumber(page));
  params.push("_hg_widget=" + encodeURIComponent(widgetPath));
  return HUANGGUO_SITE + pathname + "?" + params.join("&");
}

async function hgGetPage(url, referer) {
  var response = await Widget.http.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
      Referer: referer || HUANGGUO_SITE + "/",
    },
  });
  var status = Number(response && (response.statusCode || response.status)) || 0;
  var body = response && response.data;
  if (status >= 400) {
    console.warn("黄果页面请求失败", status, url);
    return { status: status, html: "" };
  }
  var html = typeof body === "string" ? body : body == null ? "" : JSON.stringify(body);
  if (/内容已下线|页面不存在|404 Not Found/i.test(html)) {
    console.warn("黄果分类或内容已下线", url);
    return { status: status || 410, html: "" };
  }
  return { status: status || 200, html: html };
}

function hgVisibleRegion(html, channel) {
  var source = String(html || "").replace(/<template\b[\s\S]*?<\/template>/gi, "");
  var grids = [];
  var pattern = /<div\b[^>]*class=["'][^"']*\bhg-card-grid\b[^"']*["'][^>]*>/gi;
  var match;
  while ((match = pattern.exec(source))) grids.push({ index: match.index, tag: match[0] });
  if (!grids.length) return source;
  var selected = null;
  for (var i = 0; i < grids.length; i++) {
    if ((channel === "latest" && /\bis-active\b/i.test(grids[i].tag)) || new RegExp("(?:data-channel-panel|data-channel|data-sort|data-tab|id)=[\"'][^\"']*" + channel + "[^\"']*[\"']", "i").test(grids[i].tag)) {
      selected = grids[i];
      break;
    }
  }
  if (!selected) selected = grids[channel === "hot" ? 1 : channel === "original" ? 2 : channel === "random" ? 3 : 0] || grids[0];
  var end = source.slice(selected.index + selected.tag.length).search(/<div\b[^>]*class=["'][^"']*\bhg-card-grid\b/i);
  return end < 0 ? source.slice(selected.index) : source.slice(selected.index, selected.index + selected.tag.length + end);
}

function hgParseCards(html, worker, channel) {
  var source = hgVisibleRegion(html, channel);
  var starts = [];
  var pattern = /<div\b[^>]*class=["'][^"']*\bhg-drama-card\b[^"']*["'][^>]*>/gi;
  var match;
  while ((match = pattern.exec(source))) starts.push(match.index);
  var items = [];
  var seen = Object.create(null);
  for (var i = 0; i < starts.length; i++) {
    var card = source.slice(starts[i], starts[i + 1] || source.length);
    var linkMatch = card.match(/href=["'](?:https?:\/\/huangguoai\.com)?\/(?:video|detail)\/(\d+)\/?["']/i);
    if (!linkMatch || seen[linkMatch[1]]) continue;
    var id = linkMatch[1];
    var image = card.match(/<img\b[^>]*>/i);
    var titleMatch = card.match(/data-track-title=["']([^"']+)|class=["'][^"']*hg-drama-card__title[^"']*["'][^>]*>[\s\S]*?<a\b[^>]*>([\s\S]*?)<\/a>/i);
    var title = hgText(titleMatch && (titleMatch[1] || titleMatch[2] || "")) || "黄果短剧 " + id;
    var scoreMatch = card.match(/hg-drama-card__score[^>]*>([\s\S]*?)<\//i);
    var episodeMatch = card.match(/hg-drama-card__episode[^>]*>([\s\S]*?)<\//i);
    var poster = hgCoverUrl(hgCoverSource(image ? image[0] : ""), worker);
    var link = "hg://detail/" + id + "/" + (poster ? "?cover=" + encodeURIComponent(poster) : "");
    seen[id] = true;
    items.push({
      id: link,
      type: "url",
      mediaType: "tv",
      title: title,
      description: hgText(episodeMatch && episodeMatch[1]),
      link: link,
      coverUrl: poster,
      posterPath: poster,
      backdropPath: poster,
      rating: scoreMatch ? parseFloat(hgText(scoreMatch[1]).replace(/[^0-9.]/g, "")) || undefined : undefined,
    });
  }
  return items;
}

async function hgLoadList(path, params, sort) {
  params = params || {};
  var pageUrl = hgListUrl(path, params.page, sort);
  var response = await hgGetPage(pageUrl, params.referer || HUANGGUO_SITE + "/");
  if (response.status >= 400 || !response.html) return [];
  return hgParseCards(response.html, await hgWorkerUrl(params), sort || "latest");
}

async function loadRecommend(params) { return hgLoadList("/recommend", params); }
async function loadNewest(params) { return hgLoadList("/newest", params); }
async function loadAiDuanju(params) { return hgLoadList("/ai-duanju/", params, params && params.channel); }
async function loadAiManju(params) { return hgLoadList("/ai-manju/", params, params && params.channel); }

async function loadTopics(params) {
  params = params || {};
  var topic = HUANGGUO_TOPICS.indexOf(String(params.topic || "")) >= 0 ? String(params.topic) : HUANGGUO_TOPICS[0];
  return hgLoadList("/topics/" + topic + "/", params);
}

async function loadRanking(params) {
  params = params || {};
  var ranking = ["hot", "recommend", "potential"].indexOf(String(params.ranking || "")) >= 0 ? String(params.ranking) : "hot";
  return hgLoadList("/ranks/" + ranking + "/", params);
}

async function searchVideos(params) {
  params = params || {};
  var keyword = String(params.keyword || params.query || "").trim();
  if (!keyword) return [];
  var page = hgPageNumber(params.page);
  var first = "/search/?keyword=" + encodeURIComponent(keyword);
  var result = await hgLoadList(first, params);
  if (result.length) return result;
  return hgLoadList("/search/video/" + encodeURIComponent(keyword) + "/", params);
}

function hgParseDetailLink(value) {
  var text = String(value || "");
  var custom = text.match(/^hg:\/\/detail\/(\d+)\//i);
  var web = text.match(/\/video\/(\d+)\//i);
  var id = custom ? custom[1] : web ? web[1] : "";
  if (!id) return null;
  var coverMatch = text.match(/[?&]cover=([^&#]*)/i);
  var cover = "";
  if (coverMatch) {
    try { cover = decodeURIComponent(coverMatch[1]); } catch (_) { cover = coverMatch[1]; }
  }
  return { id: id, cover: cover };
}

function hgExtractVideoData(html) {
  var match = String(html || "").match(/<script\b[^>]*id=["']videoInitialData["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return null;
  try { return JSON.parse(match[1]); } catch (_) { return null; }
}

function hgEpisodes(data) {
  var tracking = data && data.trackingEpisodes;
  var episodes = tracking && typeof tracking === "object" ? Object.keys(tracking).map(Number).filter((n) => Number.isInteger(n) && n > 0) : [];
  return episodes.sort((a, b) => a - b).slice(0, HUANGGUO_EPISODE_LIMIT);
}

function hgMakeLink(id, poster, episode) {
  var link = "hg://detail/" + id + "/";
  var query = [];
  if (poster) query.push("cover=" + encodeURIComponent(poster));
  if (episode) query.push("ep=" + episode);
  return link + (query.length ? "?" + query.join("&") : "");
}

async function loadDetail(link) {
  var identity = hgParseDetailLink(link);
  if (!identity) return null;
  var url = HUANGGUO_SITE + "/video/" + identity.id + "/";
  var response = await hgGetPage(url, HUANGGUO_SITE + "/");
  if (!response.html || response.status >= 400) return null;
  var data = hgExtractVideoData(response.html);
  var posterSource = identity.cover || (data && (data.posterSrc || data.coverSrc)) || "";
  var poster = hgCoverUrl(hgAbsoluteUrl(posterSource), await hgWorkerUrl());
  var titleMatch = response.html.match(/<meta\b[^>]*(?:property|name)=["']og:title["'][^>]*content=["']([^"']+)/i);
  var descriptionMatch = response.html.match(/<meta\b[^>]*(?:property|name)=["']og:description["'][^>]*content=["']([^"']+)/i);
  var title = hgText(titleMatch && titleMatch[1]) || hgText(data && data.title) || "黄果短剧 " + identity.id;
  title = title.replace(/\s*[-|_]\s*(?:黄果短剧|黄果AI|黄果影视).*$/i, "").trim();
  var description = hgText(descriptionMatch && descriptionMatch[1]) || hgText(data && data.description) || title;
  var episodes = hgEpisodes(data);
  var episodeItems = episodes.map((episode) => {
    var episodeLink = hgMakeLink(identity.id, poster, episode);
    var epData = data.trackingEpisodes[String(episode)] || {};
    return {
      id: episodeLink,
      type: "url",
      mediaType: "tv",
      link: episodeLink,
      title: "第 " + episode + " 集",
      episodeNumber: episode,
      duration: Number(epData.drama_duration) || undefined,
      posterPath: poster,
      coverUrl: poster,
    };
  });
  return {
    id: String(link),
    type: "url",
    mediaType: "tv",
    link: String(link),
    title: title,
    description: description,
    releaseDate: data && data.time ? String(data.time).slice(0, 10) : undefined,
    posterPath: poster,
    coverUrl: poster,
    backdropPath: poster,
    episodeItems: episodeItems,
  };
}

function hgResourceIdentity(params) {
  var link = String((params && (params.link || params.id)) || "");
  var detail = hgParseDetailLink(link);
  if (!detail) {
    var web = link.match(/\/video\/(\d+)\/(?:ep-(\d+)\/?)?/i);
    if (web) detail = { id: web[1], cover: "" };
  }
  if (!detail && params) detail = hgParseDetailLink(params.videoLink || params.parentLink);
  if (!detail) return null;
  var epMatch = link.match(/[?&]ep=(\d+)/i);
  var episode = Number((params && (params.episodeNumber || params.ep || params.episode)) || (epMatch && epMatch[1]) || 1);
  if (!Number.isInteger(episode) || episode < 1) episode = 1;
  return { id: detail.id, episode: episode, referer: HUANGGUO_SITE + "/video/" + detail.id + "/" };
}

async function loadResource(params) {
  params = params || {};
  var direct = String(params.videoUrl || params.url || "");
  if (direct && /^https:\/\//i.test(direct)) {
    return [{ name: params.title || "黄果短剧", url: direct }];
  }
  var identity = hgResourceIdentity(params);
  if (!identity) return [];
  var endpoint = HUANGGUO_SITE + "/api/videos/" + identity.id + "/episodes/" + identity.episode + "/playback";
  var response = await Widget.http.post(endpoint, "{}", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
      Accept: "application/json",
      "Content-Type": "application/json",
      Origin: HUANGGUO_SITE,
      Referer: identity.referer,
    },
    timeout: 20000,
  });
  var status = Number(response && (response.statusCode || response.status)) || 0;
  var envelope = response && response.data;
  if (typeof envelope === "string") {
    try { envelope = JSON.parse(envelope); } catch (_) { return []; }
  }
  if (status >= 400 || !envelope || Number(envelope.status) !== 1) {
    console.warn("黄果播放地址获取失败", status, envelope && envelope.msg ? envelope.msg : "接口返回异常");
    return [];
  }
  var playback = envelope.data || {};
  if (String(playback.id) !== identity.id || Number(playback.ep) !== identity.episode) {
    console.warn("黄果播放接口返回的剧集身份不匹配", identity.id, identity.episode);
    return [];
  }
  var streamUrl = playback.streams && playback.streams.main;
  if (playback.manifest_method !== "GET" || typeof streamUrl !== "string" || !/^https:\/\//i.test(streamUrl)) return [];
  var headers = {};
  var cdn = playback.cdn || {};
  if (cdn.otherEnabled && cdn.authKey && cdn.authValue && cdn.app) {
    headers[cdn.authKey] = cdn.authValue;
    headers["x-cdn-app"] = cdn.app;
  }
  return [{
    name: "第 " + identity.episode + " 集",
    description: "HLS 播放资源（播放时实时获取）",
    url: streamUrl,
    playerType: "app",
    customHeaders: Object.keys(headers).length ? headers : undefined,
  }];
}

if (typeof module !== "undefined" && module && module.exports) {
  module.exports = {
    loadRecommend: loadRecommend,
    loadNewest: loadNewest,
    loadAiDuanju: loadAiDuanju,
    loadAiManju: loadAiManju,
    loadTopics: loadTopics,
    loadRanking: loadRanking,
    searchVideos: searchVideos,
    loadDetail: loadDetail,
    loadResource: loadResource,
    hgParseCards: hgParseCards,
    hgResourceIdentity: hgResourceIdentity,
  };
}
