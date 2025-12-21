const axios = require('axios');
const cheerio = require('cheerio');
const dayjs = require('dayjs');

function parseDate(dateStr) {
    // Format: YYYY-MM-DD HH:mm
    return new Date(dateStr);
}

const categories = {
    '': '全部',
    'manhuaqingbao': '漫画情报',
    'qingxiaoshuoqingbao': '轻小说情报',
    'manhuazhoubian': '动漫周边',
    'shengyouqingbao': '声优情报',
    'yinyuezixun': '音乐资讯',
    'youxizixun': '游戏资讯',
    'meituxinshang': '美图欣赏',
    'manzhanqingbao': '漫展情报',
    'dazahui': '大杂烩'
};

async function getCategories() {
    return Object.entries(categories).map(([id, name]) => ({
        id: id,
        name: name,
        url: null,
        children: []
    }));
}

async function getFeeds(page, {category, extra, filter}) {
  const catId = category.id;
  const url = `https://news.dmzj.com/${catId}`;
  
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  const $ = cheerio.load(response.data);
  
  const list = $('.briefnews_con_li .li_img_de').toArray().map((item) => {
    const $item = $(item);
    const title = $item.find('h3 a').text();
    const link = $item.find('h3 a').attr('href');
    const authorText = $item.find('.head_con_p_o span:nth-child(3)').text();
    const author = authorText.split('：')[1] || '';
    const dateText = $item.find('.head_con_p_o span').first().text();
    const description = $item.find('p.com_about').text();
    const coverImage = $item.find('img').attr('src');
    
    return {
      type: 'webpage',
      title: title,
      description: description,
      url: link,
      coverImage: coverImage,
      author: author,
      publishTime: parseDate(dateText).toISOString()
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
    name: "动漫之家新闻",
    description: "动漫之家新闻资讯。",
    author: "DMZJ",
    logo: "https://news.dmzj.com/favicon.ico",
    siteUrl: "https://news.dmzj.com/",
    version: "1.0.0",
    category: "yule",
    getCategories,
    getFeeds
};
