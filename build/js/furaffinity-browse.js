const axios = require('axios');const modes = {    'sfw': 'Safe',    'nsfw': 'Adult'};async function getCategories() {    return Object.entries(modes).map(([id, name]) => ({        id: id,        name: name,        url: null,        children: []    }));}async function getFeeds(page, {category, extra, filter}) {  const mode = category.id;  const url = mode === 'nsfw'     ? 'https://faexport.spangle.org.uk/browse.json'    : 'https://faexport.spangle.org.uk/browse.json?sfw=1';  const response = await axios.get(url, {    headers: {      Referer: 'https://faexport.spangle.org.uk/',      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'    }  });  const list = response.data.map(item => ({    type: 'image',    title: item.title,    description: `<img src="${item.thumbnail}">`,    url: item.link,    coverImage: item.thumbnail,    author: item.name,    publishTime: null  }));  return {    data: list,    page: 1,    totalPage: 1,    hasMore: false,    extra: null  };}
async function getFeedDetail(feed) {
    return {
        content: feed.url,
        type: "webpage"
    };
}

module.exports = {
    getFeedDetail,    name: "Fur Affinity Browse",    description: "Fur Affinity 浏览作品。",    author: "Fur Affinity",    logo: "https://www.furaffinity.net/themes/beta/img/banners/fa_logo.png",    siteUrl: "https://www.furaffinity.net/browse/",
    version: "1.0.0",
    category: "yule",
    getCategories,
    getFeeds
};
