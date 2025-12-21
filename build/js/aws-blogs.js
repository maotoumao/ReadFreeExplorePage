const axios = require('axios');
const dayjs = require('dayjs');

function parseDate(date) {
  return dayjs(date).toDate();
}

async function getCategories() {
    return [
        { id: 'zh_CN', name: '中文', url: null, children: [] },
        { id: 'en_US', name: 'English', url: null, children: [] }
    ];
}

async function getFeeds(page, {category, extra, filter}) {
  const locale = category.id;

  const response = await axios.get('https://aws.amazon.com/api/dirs/items/search', {
    params: {
      'item.directoryId': 'blog-posts',
      sort_by: 'item.additionalFields.createdDate',
      sort_order: 'desc',
      size: 50,
      'item.locale': locale
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const items = response.data.items;

  const list = items.map(item => ({
    type: 'webpage',
    title: item.item.additionalFields.title,
    description: item.item.additionalFields.postExcerpt,
    publishTime: parseDate(item.item.dateCreated).toISOString(),
    url: item.item.additionalFields.link,
    author: item.item.additionalFields.contributors,
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

module.exports = {
    name: "AWS Blog",
    description: "AWS 官方博客更新。",
    author: "AWS",
    logo: "https://a0.awsstatic.com/libra-css/images/site/fav/favicon.ico",
    siteUrl: "https://aws.amazon.com/blogs/",
    version: "1.0.0",
    category: "kaifa",
    getCategories,
    getFeeds
};
