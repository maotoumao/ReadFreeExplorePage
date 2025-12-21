const axios = require('axios');
const dayjs = require('dayjs');

function parseDate(date) {
  return dayjs(date).toDate();
}

async function getCategories() {
    return [{
        id: 'default',
        name: 'Latest Models',
        url: null,
        children: []
    }];
}

async function getFeeds(page, {category, extra, filter}) {
  const response = await axios.get('https://civitai.com/api/v1/models', {
    params: {
      limit: 20,
      sort: 'Newest'
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const data = response.data;

  const list = data.items.map(item => {
    // 处理图片
    const images = item.modelVersions?.[0]?.images || [];
    const coverImage = images.length > 0 ? images[0].url.replace(/width=\d+\//, `width=${images[0].width}/`) : null;
    
    const description = (item.description || '').replace(/<[^>]+>/g, '');

    return {
      type: 'webpage',
      title: item.name,
      url: `https://civitai.com/models/${item.id}`,
      description: description,
      publishTime: parseDate(item.lastVersionAt).toISOString(),
      author: item.creator?.username,
      coverImage: coverImage
    };
  });

  return {
    data: list,
    page: 1,
    totalPage: 1,
    hasMore: false,
    extra: null
  };
}

module.exports = {
    name: "Civitai Models",
    description: "Civitai 最新发布的 AI 模型。",
    author: "Civitai",
    logo: "https://civitai.com/favicon.ico",
    siteUrl: "https://civitai.com/",
    version: "1.0.0",
    category: "rengongzhineng",
    getCategories,
    getFeeds
};
