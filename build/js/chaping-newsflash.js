const axios = require('axios');
const dayjs = require('dayjs');

function parseDate(timestamp) {
  return dayjs(timestamp).toDate();
}

async function getCategories() {
    return [{
        id: 'default',
        name: '最新快讯',
        url: null,
        children: []
    }];
}

async function getFeeds(page, {category, extra, filter}) {
  const host = 'https://chaping.cn';
  const newsflashAPI = `${host}/api/official/information/newsflash?page=1&limit=21`;
  
  const response = await axios.get(newsflashAPI, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  const data = response.data.data;
  
  const list = (data || []).map((item) => ({
      type: 'webpage',
      title: item.title,
      description: item.summary,
      publishTime: parseDate(item.time_publish_timestamp * 1000).toISOString(),
      url: item.origin_url,
      coverImage: null,
      author: '差评'
  }));

  return {
    data: list,
    page: 1,
    totalPage: 1,
    hasMore: false,
    extra: null
  };
}

module.exports = {
    name: "差评快讯",
    description: "差评快讯 - 科技资讯。",
    author: "Chaping",
    logo: "https://chaping.cn/favicon.ico",
    siteUrl: "https://chaping.cn/newsflash",
    version: "1.0.0",
    category: "keji",
    getCategories,
    getFeeds
};
