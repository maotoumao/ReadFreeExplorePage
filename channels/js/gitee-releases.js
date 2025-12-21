const axios = require('axios');
const dayjs = require('dayjs');

function parseDate(date) {
  return dayjs(date).toDate();
}

async function getCategories() {
    return [{
        id: 'default',
        name: 'Releases',
        url: null,
        children: []
    }];
}

async function getFeeds(page, {category, extra, filter}) {
  const owner = 'y_project';
  const repo = 'RuoYi';

  const params = {
    per_page: 100,
    direction: 'desc'
  };

  const response = await axios.get(`https://gitee.com/api/v5/repos/${owner}/${repo}/releases`, {
    params,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const list = response.data.map(item => ({
    type: 'webpage',
    title: item.tag_name,
    description: (item.body || '').replace(/<[^>]+>/g, ''),
    url: `https://gitee.com/${owner}/${repo}/releases/${item.tag_name}`,
    coverImage: null,
    author: item.author.login,
    publishTime: parseDate(item.created_at).toISOString()
  }));

  return {
    data: list,
    page: 1,
    totalPage: 1,
    hasMore: false,
    extra: null
  };
}


async function getFeedDetail(feed) {
    return {
        content: feed.url,
    };
}

module.exports = {
    getFeedDetail,
    name: "Gitee Releases",
    description: "Gitee 仓库发行版更新。",
    author: "Gitee",
    logo: "https://gitee.com/favicon.ico",
    siteUrl: "https://gitee.com/",
    version: "1.0.0",
    category: "kaifa",
    getCategories,
    getFeeds
};
