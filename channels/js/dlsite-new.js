const axios = require('axios');
const cheerio = require('cheerio');
const dayjs = require('dayjs');

function parseDate(dateStr) {
    // Format: YYYY年M月D日
    const match = dateStr.match(/(\d+)年(\d+)月(\d+)日/);
    if (match) {
        return new Date(match[1], match[2] - 1, match[3]);
    }
    return new Date();
}

const infos = {
  home: { name: '同人', url: '/home/new' },
  comic: { name: 'コミック', url: '/comic/new' },
  soft: { name: 'PCソフト', url: '/soft/new' },
  maniax: { name: '同人 - R18', url: '/maniax/new' },
  books: { name: '成年コミック - R18', url: '/books/new' },
  pro: { name: '美少女ゲーム', url: '/pro/new' },
  girls: { name: '乙女', url: '/girls/new' },
  bl: { name: 'BL', url: '/bl/new' }
};

async function getCategories() {
    return Object.entries(infos).map(([id, info]) => ({
        id: id,
        name: info.name,
        url: null,
        children: []
    }));
}

async function getFeeds(page, {category, extra, filter}) {
  const type = category.id;
  const info = infos[type];
  
  if (!info) {
    throw new Error(`不支持的类型: ${type}`);
  }
  
  const host = 'https://www.dlsite.com';
  const link = info.url.slice(1);
  const fullUrl = `${host}/${link}`;
  
  const response = await axios.get(fullUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  const $ = cheerio.load(response.data);
  
  const list = $('.n_worklist_item');
  
  // 解析日期
  const dateText = $('.work_update')
    .text()
    .trim()
    .replace(/（.*）/g, '');
  const pubDate = parseDate(dateText);
  
  const items = list.toArray().map((element) => {
    const $item = $(element);
    const itemTitle = $item.find('.work_name').text();
    const itemLink = $item.find('.work_name > a').attr('href');
    
    const itemDescription = $item.text().replace(/\s+/g, ' ').trim();
    const author = $item.find('.maker_name').text();
    
    // Try to find image
    const coverImage = $item.find('img').attr('src');

    return {
      type: 'webpage',
      title: itemTitle,
      description: itemDescription,
      url: itemLink,
      coverImage: coverImage,
      author: author,
      publishTime: pubDate.toISOString()
    };
  });
  
  return {
    data: items,
    page: 1,
    totalPage: 1,
    hasMore: false,
    extra: null
  };
}


async function getFeedDetail(feed) {
    return {
        content: feed.url,
        type: "webpage"
    };
}

module.exports = {
    getFeedDetail,
    name: "DLsite 最新作品",
    description: "DLsite 各类最新作品。",
    author: "DLsite",
    logo: "https://www.dlsite.com/favicon.ico",
    siteUrl: "https://www.dlsite.com/",
    version: "1.0.0",
    category: "yule",
    getCategories,
    getFeeds
};
