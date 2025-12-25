const CryptoJs = require("crypto-js");
const axios = require('axios');

// =================================================================================================
// 工具函数
// =================================================================================================

function hmacSha256(key, message) {
  const hmac = CryptoJs.HmacSHA256(message, key);
  return hmac.toString(CryptoJs.enc.Hex);
}

async function getBiliTicket(csrf) {
  const ts = Math.floor(Date.now() / 1000);
  const hexSign = hmacSha256('XgwSnGZ1p', `ts${ts}`);
  const url = 'https://api.bilibili.com/bapis/bilibili.api.ticket.v1.Ticket/GenWebTicket';

  try {
    const response = await axios.post(url, null, {
      params: {
        key_id: 'ec02',
        hexsign: hexSign,
        'context[ts]': ts,
        csrf: csrf || ''
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0'
      }
    });

    const data = await response.data;
    return data.data;
  } catch (e) {
    throw e;
  }
}

let img, sub, syncedTime;
async function getWBIKeys() {
  if (img && sub && syncedTime && syncedTime.getDate() === (new Date()).getDate()) {
    return {
      img,
      sub
    }
  } else {
    const data = await getBiliTicket('');
    img = data.nav.img;
    img = img.slice(img.lastIndexOf('/') + 1, img.lastIndexOf('.'));
    sub = data.nav.sub;
    sub = sub.slice(sub.lastIndexOf('/') + 1, sub.lastIndexOf('.'))
    syncedTime = new Date();
    return {
      img,
      sub
    }
  }
}

function getMixinKey(e) {
  var t = [];
  return (
    [
      46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5,
      49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55,
      40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57,
      62, 11, 36, 20, 34, 44, 52,
    ].forEach(function (r) {
      e.charAt(r) && t.push(e.charAt(r));
    }),
    t.join("").slice(0, 32)
  );
}

async function getRid(params) {
  const wbiKeys = await getWBIKeys();
  const npi = wbiKeys.img + wbiKeys.sub;
  const o = getMixinKey(npi);
  const l = Object.keys(params).sort();
  let c = [];
  for (let d = 0, u = /[!'\(\)*]/g; d < l.length; ++d) {
    let [h, p] = [l[d], params[l[d]]];
    p && "string" == typeof p && (p = p.replace(u, "")),
      null != p &&
      c.push(
        "".concat(encodeURIComponent(h), "=").concat(encodeURIComponent(p))
      );
  }
  const f = c.join("&");
  const w_rid = CryptoJs.MD5(f + o).toString();
  return w_rid;
}

// =================================================================================================
// 业务逻辑
// =================================================================================================

let allWeeks = [];
async function getAllWeeks(useCache = true) {
  if (useCache && allWeeks.length > 0) {
    return allWeeks;
  }

  const weeklyRes = await fetch(
    "https://api.bilibili.com/x/web-interface/popular/series/list",
    {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      },
    }).then((res) => res.json());

  const list = weeklyRes.data.list;

  if (list.length > 0) {
    allWeeks = list;
  }

  return allWeeks;
}

async function loadWeekContent(weekNumber) {
  const params = {
    number: weekNumber,
    wts: Math.floor(Date.now() / 1000),
  }

  const w_rid = await getRid(params);
  params.w_rid = w_rid;

  const url = new URL('https://api.bilibili.com/x/web-interface/popular/series/one');
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));


  const data = (await fetch(url.toString(), {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.63",
      referer: "https://www.bilibili.com/"
    }
  }).then(res => res.json()));


  if (data.length === 0) {
    throw new Error("No data found for the specified week number.");
  }

  return data.data.list.map(mapBilibiliVideoToTarget);
}

function mapBilibiliVideoToTarget(bilibiliData) {
  return {
    id: bilibiliData.bvid || bilibiliData.aid.toString(),
    title: bilibiliData.title,
    subTitle: bilibiliData.rcmd_reason,
    description: bilibiliData.desc || null,
    coverImage: bilibiliData.pic || null,
    author: bilibiliData.owner?.name || null,
    type: "video",
    tags: bilibiliData.tname ? [bilibiliData.tname] : [],
    extra: JSON.stringify(bilibiliData),
    createdTime: bilibiliData.ctime ? new Date(bilibiliData.ctime * 1000).toISOString() : null,
    updatedTime: null, 
    publishTime: bilibiliData.pubdate ? new Date(bilibiliData.pubdate * 1000).toISOString() : null,
    url: `https://www.bilibili.com/video/${bilibiliData.bvid || 'av' + bilibiliData.aid}`,
    duration: bilibiliData.duration,
    viewCount: bilibiliData.stat?.view
  };
}

async function getCid(bvid, aid) {
  const params = bvid
    ? {
      bvid: bvid,
    }
    : {
      aid: aid,
    };
  const cidRes = (
    await axios.get("https://api.bilibili.com/x/web-interface/view", {
      params: params,
    })
  ).data;
  return cidRes;
}

// =================================================================================================
// 接口实现
// =================================================================================================

/**
 * 获取分类列表
 */
async function getCategories() {
    return [{
        id: "weekly",
        name: "每周必看",
        children: []
    }];
}

/**
 * 获取 Feed 列表
 */
async function getFeeds(page, options) {
  const allWeeks = await getAllWeeks(page === 1 ? false : true);
  const number = allWeeks[page - 1]?.number;

  if (!number) {
    return {
      hasMore: false,
      data: [],
      page: page,
      totalPage: allWeeks.length
    };
  }
  
  const data = await loadWeekContent(number);
  
  return {
    page: page,
    totalPage: allWeeks.length,
    hasMore: page < allWeeks.length,
    data: data
  }
}

/**
 * 获取视频资源
 */
async function getVideoResource(feed, extra) {
  if (feed.type !== "video") {
    return null;
  }

  const rawData = JSON.parse(feed.extra);
  let cid = rawData.cid;

  if (!cid) {
    const cidData = await getCid(rawData.bvid, rawData.aid);
    cid = cidData.data?.cid;
  }
  
  if (!cid) {
      throw new Error("Could not find CID for video");
  }

  const _params = rawData.bvid
    ? {
      bvid: rawData.bvid,
    }
    : {
      aid: rawData.aid,
    };

  const res = (
    await axios.get("https://api.bilibili.com/x/player/playurl", {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.63",
        accept: "*/*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
      },
      params: { ..._params, cid: cid, fnval: 16 },
    })
  ).data;

  let audioUrl, videoUrl;

  if (res.data.dash) {
    const audios = res.data.dash.audio;
    const videos = res.data.dash.video;
    // 简单的质量选择逻辑：选最高质量
    audios.sort((a, b) => a.bandwidth - b.bandwidth);
    videos.sort((a, b) => a.bandwidth - b.bandwidth);

    audioUrl = audios[audios.length - 1].baseUrl;
    videoUrl = videos[videos.length - 1].baseUrl;
  } else {
    videoUrl = res.data.durl[0].url;
  }

  let headers = {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.63",
      "referer": "https://www.bilibili.com/"
  };

  return {
    sources: [{
        url: videoUrl,
        audioUrl: audioUrl,
        headers: headers
    }],
    headers: headers,
    userAgent: headers["user-agent"]
  };
}

/**
 * 获取 Feed 详情
 */
async function getFeedDetail(feed) {
    if (feed.type === 'video') {
        const resource = await getVideoResource(feed);
        return {
            sources: resource.sources,
            headers: resource.headers,
            userAgent: resource.userAgent
        };
    }
    return {
        url: feed.url
    };
}

module.exports = {
  name: "B站-每周必看",
  description: "每周五晚 18:00 更新",
  author: "Bilibili",
  logo: "https://s1.hdslb.com/bfs/static/jinkela/popular/assets/icon_weekly.png",
  siteUrl: "https://www.bilibili.com/v/popular/weekly",
  version: "1.0.0",
  category: "yule",
  getCategories,
  getFeeds,
  getFeedDetail,
  getVideoResource
};
