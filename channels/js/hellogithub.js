const axios = require('axios');
const dayjs = require('dayjs');

function parseDate(date) {
  return dayjs(date).toDate();
}

const SORTS = {
  featured: '精选',
  all: '全部'
};

async function getCategories() {
    return Object.entries(SORTS).map(([id, name]) => ({
        id: id,
        name: name,
        url: null,
        children: []
    }));
}

async function getFeeds(page, {category, extra, filter}) {
  const sort = category.id;
  const limit = 20;
  
  const rootUrl = 'https://hellogithub.com';
  const apiRootUrl = 'https://api.hellogithub.com';
  const apiUrl = `${apiRootUrl}/v1/?sort_by=${sort}&page=1`;
  
  const response = await axios.get(apiUrl);
  
  const data = response.data.data || [];
  const list = data.slice(0, limit).map(item => ({
    type: 'webpage',
    title: `${item.name}: ${item.title}`,
    description: item.summary,
    url: `${rootUrl}/repository/${item.item_id}`,
    author: item.author,
    publishTime: parseDate(item.updated_at).toISOString(),
    coverImage: null
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
    name: "HelloGitHub",
    description: "HelloGitHub 开源项目推荐。",
    author: "HelloGitHub",
    logo: "https://hellogithub.com/favicon.ico",
    siteUrl: "https://hellogithub.com/",
    version: "1.0.0",
    category: "kaifa",
    getCategories,
    getFeeds
};
