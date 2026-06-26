WidgetMetadata = {
  id: "forward.hanime.tv",
  title: "Hanime1",
  version: "1.2.5",
  requiredVersion: "0.0.1",
  description:
    "Hanime1.me 成人内容模块。提供官网标题、分类、搜索、详情和支持拖动的多画质 MP4 播放资源。",
  author: "Codex",
  site: "https://hanime1.me",
  icon:
    "https://vdownload.hembed.com/image/icon/tab_logo.png?secure=EJYLwnrDlidVi_wFp3DaGw==,4867726124",
  detailCacheDuration: 300,
  modules: [
    {
      title: "全部影片",
      description: "全部影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 300,
      params: [
        {
          name: "sort_by",
          title: "排序",
          type: "enumeration",
          description: "排序",
          value: "最新上傳",
          enumOptions: [
            { title: "最新上市", value: "最新上市" },
            { title: "最新上传", value: "最新上傳" },
            { title: "本日排行", value: "本日排行" },
            { title: "本周排行", value: "本週排行" },
            { title: "本月排行", value: "本月排行" },
            { title: "观看次数", value: "觀看次數" },
            { title: "好评比例", value: "讚好比例" },
            { title: "时长最长", value: "時長最長" },
            { title: "他们在看", value: "他們在看" },
          ],
        },
        {
          name: "date",
          title: "时间范围",
          type: "enumeration",
          description: "时间范围",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "过去 24 小时", value: "過去 24 小時" },
            { title: "过去 2 天", value: "過去 2 天" },
            { title: "过去 1 周", value: "過去 1 週" },
            { title: "过去 1 个月", value: "過去 1 個月" },
            { title: "过去 3 个月", value: "過去 3 個月" },
            { title: "过去 1 年", value: "過去 1 年" },
          ],
        },
        {
          name: "duration",
          title: "时长",
          type: "enumeration",
          description: "时长",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "1 分钟以上", value: "1 分鐘 +" },
            { title: "5 分钟以上", value: "5 分鐘 +" },
            { title: "10 分钟以上", value: "10 分鐘 +" },
            { title: "20 分钟以上", value: "20 分鐘 +" },
            { title: "30 分钟以上", value: "30 分鐘 +" },
            { title: "60 分钟以上", value: "60 分鐘 +" },
            { title: "0-10 分钟", value: "0 - 10 分鐘" },
            { title: "0-20 分钟", value: "0 - 20 分鐘" },
          ],
        },
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    {
      title: "里番",
      description: "里番",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 600,
      params: [
        {
          name: "genre",
          title: "影片类型",
          type: "constant",
          description: "影片类型",
          value: "裏番",
        },
        {
          name: "sort_by",
          title: "排序",
          type: "enumeration",
          description: "排序",
          value: "最新上傳",
          enumOptions: [
            { title: "最新上市", value: "最新上市" },
            { title: "最新上传", value: "最新上傳" },
            { title: "本日排行", value: "本日排行" },
            { title: "本周排行", value: "本週排行" },
            { title: "本月排行", value: "本月排行" },
            { title: "观看次数", value: "觀看次數" },
            { title: "好评比例", value: "讚好比例" },
            { title: "时长最长", value: "時長最長" },
            { title: "他们在看", value: "他們在看" },
          ],
        },
        {
          name: "date",
          title: "时间范围",
          type: "enumeration",
          description: "时间范围",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "过去 24 小时", value: "過去 24 小時" },
            { title: "过去 2 天", value: "過去 2 天" },
            { title: "过去 1 周", value: "過去 1 週" },
            { title: "过去 1 个月", value: "過去 1 個月" },
            { title: "过去 3 个月", value: "過去 3 個月" },
            { title: "过去 1 年", value: "過去 1 年" },
          ],
        },
        {
          name: "duration",
          title: "时长",
          type: "enumeration",
          description: "时长",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "1 分钟以上", value: "1 分鐘 +" },
            { title: "5 分钟以上", value: "5 分鐘 +" },
            { title: "10 分钟以上", value: "10 分鐘 +" },
            { title: "20 分钟以上", value: "20 分鐘 +" },
            { title: "30 分钟以上", value: "30 分鐘 +" },
            { title: "60 分钟以上", value: "60 分鐘 +" },
            { title: "0-10 分钟", value: "0 - 10 分鐘" },
            { title: "0-20 分钟", value: "0 - 20 分鐘" },
          ],
        },
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    {
      title: "泡面番",
      description: "泡面番",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 600,
      params: [
        {
          name: "genre",
          title: "影片类型",
          type: "constant",
          description: "影片类型",
          value: "泡麵番",
        },
        {
          name: "sort_by",
          title: "排序",
          type: "enumeration",
          description: "排序",
          value: "最新上傳",
          enumOptions: [
            { title: "最新上市", value: "最新上市" },
            { title: "最新上传", value: "最新上傳" },
            { title: "本日排行", value: "本日排行" },
            { title: "本周排行", value: "本週排行" },
            { title: "本月排行", value: "本月排行" },
            { title: "观看次数", value: "觀看次數" },
            { title: "好评比例", value: "讚好比例" },
            { title: "时长最长", value: "時長最長" },
            { title: "他们在看", value: "他們在看" },
          ],
        },
        {
          name: "date",
          title: "时间范围",
          type: "enumeration",
          description: "时间范围",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "过去 24 小时", value: "過去 24 小時" },
            { title: "过去 2 天", value: "過去 2 天" },
            { title: "过去 1 周", value: "過去 1 週" },
            { title: "过去 1 个月", value: "過去 1 個月" },
            { title: "过去 3 个月", value: "過去 3 個月" },
            { title: "过去 1 年", value: "過去 1 年" },
          ],
        },
        {
          name: "duration",
          title: "时长",
          type: "enumeration",
          description: "时长",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "1 分钟以上", value: "1 分鐘 +" },
            { title: "5 分钟以上", value: "5 分鐘 +" },
            { title: "10 分钟以上", value: "10 分鐘 +" },
            { title: "20 分钟以上", value: "20 分鐘 +" },
            { title: "30 分钟以上", value: "30 分鐘 +" },
            { title: "60 分钟以上", value: "60 分鐘 +" },
            { title: "0-10 分钟", value: "0 - 10 分鐘" },
            { title: "0-20 分钟", value: "0 - 20 分鐘" },
          ],
        },
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    {
      title: "Motion Anime",
      description: "Motion Anime",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 600,
      params: [
        {
          name: "genre",
          title: "影片类型",
          type: "constant",
          description: "影片类型",
          value: "Motion Anime",
        },
        {
          name: "sort_by",
          title: "排序",
          type: "enumeration",
          description: "排序",
          value: "最新上傳",
          enumOptions: [
            { title: "最新上市", value: "最新上市" },
            { title: "最新上传", value: "最新上傳" },
            { title: "本日排行", value: "本日排行" },
            { title: "本周排行", value: "本週排行" },
            { title: "本月排行", value: "本月排行" },
            { title: "观看次数", value: "觀看次數" },
            { title: "好评比例", value: "讚好比例" },
            { title: "时长最长", value: "時長最長" },
            { title: "他们在看", value: "他們在看" },
          ],
        },
        {
          name: "date",
          title: "时间范围",
          type: "enumeration",
          description: "时间范围",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "过去 24 小时", value: "過去 24 小時" },
            { title: "过去 2 天", value: "過去 2 天" },
            { title: "过去 1 周", value: "過去 1 週" },
            { title: "过去 1 个月", value: "過去 1 個月" },
            { title: "过去 3 个月", value: "過去 3 個月" },
            { title: "过去 1 年", value: "過去 1 年" },
          ],
        },
        {
          name: "duration",
          title: "时长",
          type: "enumeration",
          description: "时长",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "1 分钟以上", value: "1 分鐘 +" },
            { title: "5 分钟以上", value: "5 分鐘 +" },
            { title: "10 分钟以上", value: "10 分鐘 +" },
            { title: "20 分钟以上", value: "20 分鐘 +" },
            { title: "30 分钟以上", value: "30 分鐘 +" },
            { title: "60 分钟以上", value: "60 分鐘 +" },
            { title: "0-10 分钟", value: "0 - 10 分鐘" },
            { title: "0-20 分钟", value: "0 - 20 分鐘" },
          ],
        },
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    {
      title: "3DCG",
      description: "3DCG",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 600,
      params: [
        {
          name: "genre",
          title: "影片类型",
          type: "constant",
          description: "影片类型",
          value: "3DCG",
        },
        {
          name: "sort_by",
          title: "排序",
          type: "enumeration",
          description: "排序",
          value: "最新上傳",
          enumOptions: [
            { title: "最新上市", value: "最新上市" },
            { title: "最新上传", value: "最新上傳" },
            { title: "本日排行", value: "本日排行" },
            { title: "本周排行", value: "本週排行" },
            { title: "本月排行", value: "本月排行" },
            { title: "观看次数", value: "觀看次數" },
            { title: "好评比例", value: "讚好比例" },
            { title: "时长最长", value: "時長最長" },
            { title: "他们在看", value: "他們在看" },
          ],
        },
        {
          name: "date",
          title: "时间范围",
          type: "enumeration",
          description: "时间范围",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "过去 24 小时", value: "過去 24 小時" },
            { title: "过去 2 天", value: "過去 2 天" },
            { title: "过去 1 周", value: "過去 1 週" },
            { title: "过去 1 个月", value: "過去 1 個月" },
            { title: "过去 3 个月", value: "過去 3 個月" },
            { title: "过去 1 年", value: "過去 1 年" },
          ],
        },
        {
          name: "duration",
          title: "时长",
          type: "enumeration",
          description: "时长",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "1 分钟以上", value: "1 分鐘 +" },
            { title: "5 分钟以上", value: "5 分鐘 +" },
            { title: "10 分钟以上", value: "10 分鐘 +" },
            { title: "20 分钟以上", value: "20 分鐘 +" },
            { title: "30 分钟以上", value: "30 分鐘 +" },
            { title: "60 分钟以上", value: "60 分鐘 +" },
            { title: "0-10 分钟", value: "0 - 10 分鐘" },
            { title: "0-20 分钟", value: "0 - 20 分鐘" },
          ],
        },
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    {
      title: "2.5D",
      description: "2.5D",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 600,
      params: [
        {
          name: "genre",
          title: "影片类型",
          type: "constant",
          description: "影片类型",
          value: "2.5D",
        },
        {
          name: "sort_by",
          title: "排序",
          type: "enumeration",
          description: "排序",
          value: "最新上傳",
          enumOptions: [
            { title: "最新上市", value: "最新上市" },
            { title: "最新上传", value: "最新上傳" },
            { title: "本日排行", value: "本日排行" },
            { title: "本周排行", value: "本週排行" },
            { title: "本月排行", value: "本月排行" },
            { title: "观看次数", value: "觀看次數" },
            { title: "好评比例", value: "讚好比例" },
            { title: "时长最长", value: "時長最長" },
            { title: "他们在看", value: "他們在看" },
          ],
        },
        {
          name: "date",
          title: "时间范围",
          type: "enumeration",
          description: "时间范围",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "过去 24 小时", value: "過去 24 小時" },
            { title: "过去 2 天", value: "過去 2 天" },
            { title: "过去 1 周", value: "過去 1 週" },
            { title: "过去 1 个月", value: "過去 1 個月" },
            { title: "过去 3 个月", value: "過去 3 個月" },
            { title: "过去 1 年", value: "過去 1 年" },
          ],
        },
        {
          name: "duration",
          title: "时长",
          type: "enumeration",
          description: "时长",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "1 分钟以上", value: "1 分鐘 +" },
            { title: "5 分钟以上", value: "5 分鐘 +" },
            { title: "10 分钟以上", value: "10 分鐘 +" },
            { title: "20 分钟以上", value: "20 分鐘 +" },
            { title: "30 分钟以上", value: "30 分鐘 +" },
            { title: "60 分钟以上", value: "60 分鐘 +" },
            { title: "0-10 分钟", value: "0 - 10 分鐘" },
            { title: "0-20 分钟", value: "0 - 20 分鐘" },
          ],
        },
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    {
      title: "2D 动画",
      description: "2D 动画",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 600,
      params: [
        {
          name: "genre",
          title: "影片类型",
          type: "constant",
          description: "影片类型",
          value: "2D動畫",
        },
        {
          name: "sort_by",
          title: "排序",
          type: "enumeration",
          description: "排序",
          value: "最新上傳",
          enumOptions: [
            { title: "最新上市", value: "最新上市" },
            { title: "最新上传", value: "最新上傳" },
            { title: "本日排行", value: "本日排行" },
            { title: "本周排行", value: "本週排行" },
            { title: "本月排行", value: "本月排行" },
            { title: "观看次数", value: "觀看次數" },
            { title: "好评比例", value: "讚好比例" },
            { title: "时长最长", value: "時長最長" },
            { title: "他们在看", value: "他們在看" },
          ],
        },
        {
          name: "date",
          title: "时间范围",
          type: "enumeration",
          description: "时间范围",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "过去 24 小时", value: "過去 24 小時" },
            { title: "过去 2 天", value: "過去 2 天" },
            { title: "过去 1 周", value: "過去 1 週" },
            { title: "过去 1 个月", value: "過去 1 個月" },
            { title: "过去 3 个月", value: "過去 3 個月" },
            { title: "过去 1 年", value: "過去 1 年" },
          ],
        },
        {
          name: "duration",
          title: "时长",
          type: "enumeration",
          description: "时长",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "1 分钟以上", value: "1 分鐘 +" },
            { title: "5 分钟以上", value: "5 分鐘 +" },
            { title: "10 分钟以上", value: "10 分鐘 +" },
            { title: "20 分钟以上", value: "20 分鐘 +" },
            { title: "30 分钟以上", value: "30 分鐘 +" },
            { title: "60 分钟以上", value: "60 分鐘 +" },
            { title: "0-10 分钟", value: "0 - 10 分鐘" },
            { title: "0-20 分钟", value: "0 - 20 分鐘" },
          ],
        },
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    {
      title: "AI 生成",
      description: "AI 生成",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 600,
      params: [
        {
          name: "genre",
          title: "影片类型",
          type: "constant",
          description: "影片类型",
          value: "AI生成",
        },
        {
          name: "sort_by",
          title: "排序",
          type: "enumeration",
          description: "排序",
          value: "最新上傳",
          enumOptions: [
            { title: "最新上市", value: "最新上市" },
            { title: "最新上传", value: "最新上傳" },
            { title: "本日排行", value: "本日排行" },
            { title: "本周排行", value: "本週排行" },
            { title: "本月排行", value: "本月排行" },
            { title: "观看次数", value: "觀看次數" },
            { title: "好评比例", value: "讚好比例" },
            { title: "时长最长", value: "時長最長" },
            { title: "他们在看", value: "他們在看" },
          ],
        },
        {
          name: "date",
          title: "时间范围",
          type: "enumeration",
          description: "时间范围",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "过去 24 小时", value: "過去 24 小時" },
            { title: "过去 2 天", value: "過去 2 天" },
            { title: "过去 1 周", value: "過去 1 週" },
            { title: "过去 1 个月", value: "過去 1 個月" },
            { title: "过去 3 个月", value: "過去 3 個月" },
            { title: "过去 1 年", value: "過去 1 年" },
          ],
        },
        {
          name: "duration",
          title: "时长",
          type: "enumeration",
          description: "时长",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "1 分钟以上", value: "1 分鐘 +" },
            { title: "5 分钟以上", value: "5 分鐘 +" },
            { title: "10 分钟以上", value: "10 分鐘 +" },
            { title: "20 分钟以上", value: "20 分鐘 +" },
            { title: "30 分钟以上", value: "30 分鐘 +" },
            { title: "60 分钟以上", value: "60 分鐘 +" },
            { title: "0-10 分钟", value: "0 - 10 分鐘" },
            { title: "0-20 分钟", value: "0 - 20 分鐘" },
          ],
        },
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    {
      title: "MMD",
      description: "MMD",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 600,
      params: [
        {
          name: "genre",
          title: "影片类型",
          type: "constant",
          description: "影片类型",
          value: "MMD",
        },
        {
          name: "sort_by",
          title: "排序",
          type: "enumeration",
          description: "排序",
          value: "最新上傳",
          enumOptions: [
            { title: "最新上市", value: "最新上市" },
            { title: "最新上传", value: "最新上傳" },
            { title: "本日排行", value: "本日排行" },
            { title: "本周排行", value: "本週排行" },
            { title: "本月排行", value: "本月排行" },
            { title: "观看次数", value: "觀看次數" },
            { title: "好评比例", value: "讚好比例" },
            { title: "时长最长", value: "時長最長" },
            { title: "他们在看", value: "他們在看" },
          ],
        },
        {
          name: "date",
          title: "时间范围",
          type: "enumeration",
          description: "时间范围",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "过去 24 小时", value: "過去 24 小時" },
            { title: "过去 2 天", value: "過去 2 天" },
            { title: "过去 1 周", value: "過去 1 週" },
            { title: "过去 1 个月", value: "過去 1 個月" },
            { title: "过去 3 个月", value: "過去 3 個月" },
            { title: "过去 1 年", value: "過去 1 年" },
          ],
        },
        {
          name: "duration",
          title: "时长",
          type: "enumeration",
          description: "时长",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "1 分钟以上", value: "1 分鐘 +" },
            { title: "5 分钟以上", value: "5 分鐘 +" },
            { title: "10 分钟以上", value: "10 分鐘 +" },
            { title: "20 分钟以上", value: "20 分鐘 +" },
            { title: "30 分钟以上", value: "30 分鐘 +" },
            { title: "60 分钟以上", value: "60 分鐘 +" },
            { title: "0-10 分钟", value: "0 - 10 分鐘" },
            { title: "0-20 分钟", value: "0 - 20 分鐘" },
          ],
        },
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    {
      title: "Cosplay",
      description: "Cosplay",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 600,
      params: [
        {
          name: "genre",
          title: "影片类型",
          type: "constant",
          description: "影片类型",
          value: "Cosplay",
        },
        {
          name: "sort_by",
          title: "排序",
          type: "enumeration",
          description: "排序",
          value: "最新上傳",
          enumOptions: [
            { title: "最新上市", value: "最新上市" },
            { title: "最新上传", value: "最新上傳" },
            { title: "本日排行", value: "本日排行" },
            { title: "本周排行", value: "本週排行" },
            { title: "本月排行", value: "本月排行" },
            { title: "观看次数", value: "觀看次數" },
            { title: "好评比例", value: "讚好比例" },
            { title: "时长最长", value: "時長最長" },
            { title: "他们在看", value: "他們在看" },
          ],
        },
        {
          name: "date",
          title: "时间范围",
          type: "enumeration",
          description: "时间范围",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "过去 24 小时", value: "過去 24 小時" },
            { title: "过去 2 天", value: "過去 2 天" },
            { title: "过去 1 周", value: "過去 1 週" },
            { title: "过去 1 个月", value: "過去 1 個月" },
            { title: "过去 3 个月", value: "過去 3 個月" },
            { title: "过去 1 年", value: "過去 1 年" },
          ],
        },
        {
          name: "duration",
          title: "时长",
          type: "enumeration",
          description: "时长",
          value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "1 分钟以上", value: "1 分鐘 +" },
            { title: "5 分钟以上", value: "5 分鐘 +" },
            { title: "10 分钟以上", value: "10 分鐘 +" },
            { title: "20 分钟以上", value: "20 分鐘 +" },
            { title: "30 分钟以上", value: "30 分鐘 +" },
            { title: "60 分钟以上", value: "60 分鐘 +" },
            { title: "0-10 分钟", value: "0 - 10 分鐘" },
            { title: "0-20 分钟", value: "0 - 20 分鐘" },
          ],
        },
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    {
      id: "loadResource",
      title: "Hanime1 播放资源",
      functionName: "loadResource",
      type: "stream",
      cacheDuration: 0,
      requiresWebView: false,
      params: [],
    }
  ],
  search: {
    title: "搜索",
    functionName: "search",
    params: [
      { name: "keyword", title: "关键词", type: "input" },
      { name: "page", title: "页码", type: "page" },
    ],
  },
};

var HANIME1_SITE = "https://hanime1.me";
var HANIME1_READER = "https://r.jina.ai/";
var HANIME1_HEADERS = {
  Accept: "text/html,application/xhtml+xml",
  Referer: HANIME1_SITE + "/",
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
};
var HANIME1_READER_HEADERS = {
  Accept: "text/html",
  "X-Return-Format": "html",
};
var HANIME1_PAGE_CACHE = {};

function mediaHeaders(id) {
  return {
    Referer: HANIME1_SITE + "/watch?v=" + encodeURIComponent(String(id || "")),
    Origin: HANIME1_SITE,
    "User-Agent": HANIME1_HEADERS["User-Agent"],
  };
}

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
      .replace(/<\/(?:div|p|h[1-6]|li|tr)>/gi, "\n")
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function attributeValue(tag, name) {
  var pattern = new RegExp(
    "\\b" + name + "\\s*=\\s*([\"'])([\\s\\S]*?)\\1",
    "i"
  );
  var match = String(tag || "").match(pattern);
  return match ? decodeHtml(match[2]).trim() : "";
}

function firstMatch(text, pattern, group) {
  var match = String(text || "").match(pattern);
  return match ? decodeHtml(match[group || 1]).trim() : "";
}

function validOfficialPage(html) {
  var text = String(html || "");
  if (text.length < 500) return false;
  if (/just a moment|cf-chl-|cloudflare ray id/i.test(text)) return false;
  return /hanime1|vdownload\.hembed\.com/i.test(text);
}

async function fetchHtml(path, fresh) {
  var key = String(path || "/");
  var now = Date.now();
  var cached = HANIME1_PAGE_CACHE[key];
  if (!fresh && cached && cached.expires > now) {
    return cached.html;
  }

  var html = "";
  var requestPath = key;
  if (fresh) {
    requestPath +=
      (requestPath.indexOf("?") >= 0 ? "&" : "?") +
      "_fwts=" +
      Math.floor(now / 60000);
  }
  var directHeaders = {};
  for (var directHeader in HANIME1_HEADERS) {
    directHeaders[directHeader] = HANIME1_HEADERS[directHeader];
  }
  if (fresh) directHeaders["Cache-Control"] = "no-cache";

  try {
    var direct = await Widget.http.get(HANIME1_SITE + requestPath, {
      headers: directHeaders,
    });
    html = direct && direct.data;
  } catch (error) {
    html = "";
  }

  if (!validOfficialPage(html)) {
    var readerHeaders = {};
    for (var header in HANIME1_READER_HEADERS) {
      readerHeaders[header] = HANIME1_READER_HEADERS[header];
    }
    if (fresh) readerHeaders["X-No-Cache"] = "true";

    var reader = await Widget.http.get(
      HANIME1_READER + HANIME1_SITE + requestPath,
      { headers: readerHeaders }
    );
    html = reader && reader.data;
  }

  if (!validOfficialPage(html)) {
    throw new Error("Hanime1 页面读取失败，请稍后重试");
  }

  if (!fresh) {
    HANIME1_PAGE_CACHE[key] = {
      html: String(html),
      expires: now + 240000,
    };
  }
  return String(html);
}

function queryPath(values) {
  var parts = [];
  for (var key in values) {
    var value = values[key];
    if (value === undefined || value === null || value === "") continue;
    parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(value)));
  }
  return "/search" + (parts.length ? "?" + parts.join("&") : "");
}

function normalizeQueryValue(value) {
  value = String(value || "").trim();
  return value === "全部" ? "" : value;
}

function extractVideoId(value) {
  var text = String(value || "").trim();
  if (!text) return "";
  var queryMatch = text.match(/[?&]v=(\d+)/);
  if (queryMatch) return queryMatch[1];
  var routeMatch = text.match(/(?:hanime1|hanime):(\d+)/);
  if (routeMatch) return routeMatch[1];
  return /^\d+$/.test(text) ? text : "";
}

function durationData(text) {
  var value = String(text || "").trim();
  var parts = value.split(":");
  if (parts.length < 2 || parts.length > 3) {
    return { duration: 0, durationText: "" };
  }
  var seconds = 0;
  for (var i = 0; i < parts.length; i++) {
    if (!/^\d+$/.test(parts[i])) {
      return { duration: 0, durationText: "" };
    }
    seconds = seconds * 60 + Number(parts[i]);
  }
  return { duration: seconds, durationText: value };
}

function imageFromBlock(block) {
  var images = [];
  var imagePattern = /<img\b[^>]*>/gi;
  var match;
  while ((match = imagePattern.exec(String(block || "")))) {
    var src =
      attributeValue(match[0], "src") || attributeValue(match[0], "data-src");
    if (src && /\/image\/(?:cover|thumbnail)\//i.test(src)) images.push(src);
  }
  return images.length ? images[images.length - 1] : "";
}

function titleFromBlock(block) {
  var title =
    firstMatch(
      block,
      /<div\b[^>]*class=["'][^"']*(?:home-rows-videos-title|card-mobile-title|\btitle\b)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
    ) ||
    firstMatch(block, /<img\b[^>]*\balt=["']([^"']+)["'][^>]*>/i);
  return cleanText(title);
}

function parseVideoCards(html) {
  var results = [];
  var seen = {};
  var source = String(html || "");
  var linkPattern =
    /<a\b([^>]*\bhref\s*=\s*(["'])(?:https?:\/\/hanime1\.me)?\/watch\?v=(\d+)[^"']*\2[^>]*)>([\s\S]*?)<\/a>/gi;
  var match;

  while ((match = linkPattern.exec(source))) {
    var id = match[3];
    var block = match[4];
    if (seen[id]) continue;

    var title = titleFromBlock(block);
    var image = imageFromBlock(block);
    if (!title || !image) continue;

    var durationText = firstMatch(
      block,
      /<div\b[^>]*class=["'][^"']*duration[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
    );
    durationText = cleanText(durationText).match(/\d{1,2}:\d{2}(?::\d{2})?/)
      ? cleanText(durationText).match(/\d{1,2}:\d{2}(?::\d{2})?/)[0]
      : "";
    var time = durationData(durationText);
    var ratingMatch = cleanText(block).match(/(\d{1,3})%/);
    var rating = ratingMatch
      ? Math.max(0, Math.min(10, Number(ratingMatch[1]) / 10))
      : 0;

    seen[id] = true;
    results.push({
      id: "hanime1:" + id,
      type: "url",
      mediaType: "movie",
      title: title,
      coverUrl: image,
      posterPath: image,
      backdropPath: image,
      rating: rating,
      duration: time.duration,
      durationText: time.durationText,
      link: "hanime1:" + id,
      customHeaders: mediaHeaders(id),
    });
  }

  return results;
}

async function fetchVideoList(values) {
  var html = await fetchHtml(queryPath(values), false);
  return parseVideoCards(html);
}

function listValues(params, extra) {
  params = params || {};
  var values = {
    sort: normalizeQueryValue(params.sort || params.sort_by || (extra && extra.sort)),
    genre: normalizeQueryValue(params.genre || (extra && extra.genre)),
    date: normalizeQueryValue(params.date || (extra && extra.date)),
    duration: normalizeQueryValue(params.duration || (extra && extra.duration)),
    page: Number(params.page || 1),
  };
  if (extra) {
    for (var key in extra) {
      if (values[key] === undefined || values[key] === "") {
        values[key] = normalizeQueryValue(extra[key]);
      }
    }
  }
  return values;
}

async function loadPage(params) {
  return fetchVideoList(listValues(params, { sort: "最新上傳" }));
}

async function loadLatestRelease(params) {
  if (params && params.genreId) {
    return loadBrowse({
      genreId: params.genreId,
      sort: "最新上市",
      page: params.page,
    });
  }
  return fetchVideoList({
    sort: "最新上市",
    page: Number((params && params.page) || 1),
  });
}

async function loadLatestUpload(params) {
  if (params && params.genreId) {
    return loadBrowse({
      genreId: params.genreId,
      sort: "最新上傳",
      page: params.page,
    });
  }
  return fetchVideoList({
    sort: "最新上傳",
    page: Number((params && params.page) || 1),
  });
}

async function loadWatchingNow(params) {
  return fetchVideoList(listValues(params, { sort: "他們在看" }));
}

async function loadDailyRank(params) {
  return fetchVideoList(listValues(params, { sort: "本日排行" }));
}

async function loadWeeklyRank(params) {
  return fetchVideoList(listValues(params, { sort: "本週排行" }));
}

async function loadMonthlyRank(params) {
  return fetchVideoList(listValues(params, { sort: "本月排行" }));
}

async function loadMostViewed(params) {
  return fetchVideoList(listValues(params, { sort: "觀看次數" }));
}

async function loadTopRated(params) {
  return fetchVideoList(listValues(params, { sort: "讚好比例" }));
}

async function loadAll(params) {
  return fetchVideoList(listValues(params, { sort: "最新上傳" }));
}

async function loadGenre(genre, params) {
  params = params || {};
  if (params.genreId) {
    return loadBrowse({
      genreId: params.genreId,
      sort: params.sort,
      date: params.date,
      duration: params.duration,
      page: params.page,
    });
  }
  return fetchVideoList(listValues(params, { genre: genre, sort: "最新上傳" }));
}

async function loadGenreHentai(params) {
  return loadGenre("裏番", params);
}

async function loadGenreShort(params) {
  return loadGenre("泡麵番", params);
}

async function loadGenreMotionAnime(params) {
  return loadGenre("Motion Anime", params);
}

async function loadGenre3dcg(params) {
  return loadGenre("3DCG", params);
}

async function loadGenre25d(params) {
  return loadGenre("2.5D", params);
}

async function loadGenre2d(params) {
  return loadGenre("2D動畫", params);
}

async function loadGenreAi(params) {
  return loadGenre("AI生成", params);
}

async function loadGenreMmd(params) {
  return loadGenre("MMD", params);
}

async function loadGenreCosplay(params) {
  return loadGenre("Cosplay", params);
}

async function loadBrowse(params) {
  params = params || {};
  var genre = String(params.genreId || params.genre || "");
  if (genre.indexOf("genre:") === 0) genre = genre.slice(6);
  if (genre.indexOf("tag:") === 0) {
    return fetchVideoList({
      "tags[]": genre.slice(4),
      sort: normalizeQueryValue(params.sort || "最新上市"),
      date: normalizeQueryValue(params.date),
      duration: normalizeQueryValue(params.duration),
      page: Number(params.page || 1),
    });
  }
  return fetchVideoList(listValues(params, { genre: genre, sort: "最新上市" }));
}

async function search(params) {
  params = params || {};
  var keyword = String(params.keyword || "").trim();
  if (!keyword) return [];
  return fetchVideoList({
    query: keyword,
    page: Number(params.page || 1),
  });
}

function parseSources(html) {
  var results = [];
  var seen = {};
  var pattern = /<(?:source|a|link)\b[^>]*>/gi;
  var match;
  function addSource(url, qualityHint) {
    url = decodeHtml(String(url || ""))
      .replace(/\\\//g, "/")
      .replace(/&amp;/g, "&")
      .trim();
    if (!/^https:\/\/vdownload\.hembed\.com\/.+\.mp4(?:\?|$)/i.test(url)) {
      return;
    }
    if (seen[url]) return;

    var quality =
      qualityHint ||
      firstMatch(url, /-(\d{3,4})p?\.mp4/i) ||
      "MP4";
    quality = String(quality).replace(/p$/i, "");
    seen[url] = true;
    results.push({
      quality: quality,
      url: url,
    });
  }

  while ((match = pattern.exec(String(html || "")))) {
    var tag = match[0];
    addSource(
      attributeValue(tag, "data-url") ||
        attributeValue(tag, "src") ||
        attributeValue(tag, "href"),
      attributeValue(tag, "size")
    );
  }

  var urlPattern =
    /https:\\?\/\\?\/vdownload\.hembed\.com\\?\/[^"' <>)]+?\.mp4(?:\?[^"' <>)]+)?/gi;
  while ((match = urlPattern.exec(String(html || "")))) {
    addSource(match[0], "");
  }

  results.sort(function (a, b) {
    return Number(b.quality || 0) - Number(a.quality || 0);
  });
  return results;
}

function resourcesFromSources(sources, id) {
  var headers = mediaHeaders(id);
  return (sources || []).map(function (source) {
    var quality = /^\d+$/.test(String(source.quality))
      ? source.quality + "p"
      : source.quality;
    return {
      name: "Hanime1 " + quality,
      description: quality + " | MP4 | 支持拖动进度",
      url: source.url,
      headers: headers,
      customHeaders: headers,
    };
  });
}

function detailTitle(html) {
  return cleanText(
    firstMatch(
      html,
      /<h3\b[^>]*id=["']shareBtn-title["'][^>]*>([\s\S]*?)<\/h3>/i
    ) ||
      firstMatch(
        html,
        /<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i
      )
  ).replace(/\s*-\s*Hanime1\.me.*$/i, "");
}

function detailPoster(html) {
  var videoTag = firstMatch(html, /(<video\b[^>]*>)/i);
  var poster = attributeValue(videoTag, "poster");
  if (poster) return poster;
  return firstMatch(
    html,
    /<img\b[^>]*class=["'][^"']*download-image[^"']*["'][^>]*src=["']([^"']+)["']/i
  );
}

function detailDescription(html) {
  return cleanText(
    firstMatch(
      html,
      /<div\b[^>]*class=["'][^"']*video-caption-text[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
    )
  );
}

function detailDate(html) {
  return firstMatch(html, /觀看次數[^<]*?(\d{4}-\d{2}-\d{2})/i);
}

function detailRating(html) {
  var rating = firstMatch(
    html,
    /id=["']video-like-btn["'][\s\S]{0,500}?(\d{1,3})%/i
  );
  return rating ? Math.max(0, Math.min(10, Number(rating) / 10)) : 0;
}

function detailDuration(html) {
  var playlistPosition = String(html || "").indexOf('id="video-playlist-wrapper"');
  var area =
    playlistPosition >= 0
      ? String(html).slice(playlistPosition, playlistPosition + 12000)
      : String(html);
  var text = firstMatch(
    area,
    /class=["'][^"']*(?:card-mobile-duration|duration)[^"']*["'][^>]*>\s*(\d{1,2}:\d{2}(?::\d{2})?)/i
  );
  return durationData(text);
}

function detailGenres(html) {
  var results = [];
  var seen = {};
  var genre = firstMatch(
    html,
    /id=["']video-artist-name["'][\s\S]{0,900}?href=["'][^"']*genre=([^"'&]+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/i,
    1
  );
  if (genre) {
    try {
      genre = decodeURIComponent(genre.replace(/\+/g, " "));
    } catch (error) {}
    seen["genre:" + genre] = true;
    results.push({ id: "genre:" + genre, title: genre });
  }

  var pattern =
    /<div\b[^>]*class=["'][^"']*single-video-tag[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
  var match;
  while ((match = pattern.exec(String(html || "")))) {
    var text = cleanText(match[1])
      .replace(/^#\s*/, "")
      .replace(/\s*\(\d+\)\s*$/, "")
      .trim();
    if (!text || text === "add" || text === "remove") continue;
    var id = "tag:" + text;
    if (seen[id]) continue;
    seen[id] = true;
    results.push({ id: id, title: text });
    if (results.length >= 14) break;
  }
  return results;
}

function detailPeople(html) {
  var name = cleanText(
    firstMatch(
      html,
      /<a\b[^>]*id=["']video-artist-name["'][^>]*>([\s\S]*?)<\/a>/i
    )
  );
  if (!name) return [];
  var id =
    firstMatch(html, /href=["'][^"']*\/user\/(\d+)["']/i) ||
    "artist:" + name;
  var avatar = firstMatch(
    html,
    /<img\b[^>]*id=["']video-user-avatar["'][^>]*src=["']([^"']+)["']/i
  );
  return [{ id: id, title: name, avatar: avatar, role: "作者" }];
}

function relatedVideos(html, currentId) {
  var start = String(html || "").indexOf('id="related-tabcontent"');
  if (start < 0) return [];
  return parseVideoCards(String(html).slice(start))
    .filter(function (item) {
      return extractVideoId(item.id) !== currentId;
    })
    .slice(0, 16);
}

async function loadDetail(link) {
  var id = extractVideoId(link);
  if (!id) return null;

  var html = await fetchHtml("/watch?v=" + encodeURIComponent(id), true);
  var title = detailTitle(html);
  var poster = detailPoster(html);
  var sources = parseSources(html);
  if (!sources.length) {
    var downloadHtml = await fetchHtml("/download?v=" + encodeURIComponent(id), true);
    sources = parseSources(downloadHtml);
    if (!poster) poster = detailPoster(downloadHtml);
  }
  var time = detailDuration(html);
  var headers = mediaHeaders(id);
  var item = {
    id: "hanime1:" + id,
    type: "url",
    mediaType: "movie",
    title: title || "Hanime1 #" + id,
    description: detailDescription(html),
    coverUrl: poster,
    posterPath: poster,
    detailPoster: poster,
    backdropPath: poster,
    backdropPaths: poster ? [poster] : [],
    releaseDate: detailDate(html),
    rating: detailRating(html),
    duration: time.duration,
    durationText: time.durationText,
    genreItems: detailGenres(html),
    peoples: detailPeople(html),
    relatedItems: relatedVideos(html, id),
    link: "hanime1:" + id,
    playerType: "system",
    customHeaders: headers,
  };
  if (sources.length) {
    item.videoUrl = sources[0].url;
    item.trailers = [{ coverUrl: poster, url: sources[0].url }];
  }
  return item;
}

async function loadResource(params) {
  params = params || {};
  if (params.videoUrl || params.url) {
    return resourcesFromSources(
      [{ quality: "MP4", url: params.videoUrl || params.url }],
      extractVideoId(params.link) || extractVideoId(params.id)
    );
  }
  var id =
    extractVideoId(params.link) ||
    extractVideoId(params.id) ||
    extractVideoId(params.episode) ||
    extractVideoId(params.episodeId) ||
    extractVideoId(params.tmdbId);
  if (!id) return [];

  var html = await fetchHtml("/watch?v=" + encodeURIComponent(id), true);
  var sources = parseSources(html);
  if (!sources.length) {
    html = await fetchHtml("/download?v=" + encodeURIComponent(id), true);
    sources = parseSources(html);
  }
  return resourcesFromSources(sources, id);
}
