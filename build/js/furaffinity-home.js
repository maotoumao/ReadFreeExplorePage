const axios = require('axios');

const categories = {
    'artwork': 'Artwork',
    'writing': 'Writing',
    'music': 'Music',
    'crafts': 'Crafts'
};

const modes = {
    'sfw': 'Safe',
    'nsfw': 'Adult'
};

async function getCategories() {
    const list = [];
    for (const [catId, catName] of Object.entries(categories)) {
        const catNode = {
            id: catId,
            name: catName,
            url: null,
            children: []
        };
        for (const [modeId, modeName] of Object.entries(modes)) {
            catNode.children.push({
                id: `${catId}|${modeId}`,
                name: modeName,
                url: null,
                children: []
            });
        }
        list.push(catNode);
    }
    return list;
}

async function getFeeds(page, {category, extra, filter}) {
  let catId = 'artwork';
  let modeId = 'sfw';
  
  if (category.id.includes('|')) {
      [catId, modeId] = category.id.split('|');
  } else {
      catId = category.id;
  }

  const url = modeId === 'nsfw'
    ? 'https://faexport.spangle.org.uk/home.json'
    : 'https://faexport.spangle.org.uk/home.json?sfw=1';

  const response = await axios.get(url, {
    headers: {
      Referer: 'https://faexport.spangle.org.uk/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const data = response.data;
  const dataSelect = data[catId] || data.artwork;

  const list = dataSelect.map(item => ({
    type: 'image',
    title: item.title,
    description: `<img src="${item.thumbnail}">`,
    url: item.link,
    coverImage: item.thumbnail,
    author: item.name,
    publishTime: null
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
    name: "Fur Affinity Home",
    description: "Fur Affinity 首页作品。",
    author: "Fur Affinity",
    logo: "https://www.furaffinity.net/themes/beta/img/banners/fa_logo.png",
    siteUrl: "https://www.furaffinity.net/",
    version: "1.0.0",
    category: "yule",
    getCategories,
    getFeeds
};
