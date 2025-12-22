const axios = require('axios');
const cheerio = require('cheerio');
const dayjs = require('dayjs');

function parseDate(date, format) {
  if (format === 'X') {
    return dayjs.unix(parseInt(date, 10)).toDate();
  }
  return dayjs(date).toDate();
}

async function getCategories() {
    return [{
        id: 'daily',
        name: '最新',
        url: null,
        children: []
    }];
}

async function getFeeds(page, {category, extra, filter}) {
  const limit = 10;
  
  // 获取知乎日报首页
  const response = await axios.get('https://daily.zhihu.com/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  const $ = cheerio.load(response.data);
  
  // 获取所有文章
  const boxes = $('.box').toArray().slice(0, limit);
  
  const list = await Promise.all(
    boxes.map(async (item) => {
      const $item = $(item);
      const linkElem = $item.find('.link-button');
      const href = linkElem.attr('href');
      const coverImage = $item.find('img').attr('src');
      
      if (!href) return null;
      
      // 获取文章详情 API
      const storyUrl = 'https://daily.zhihu.com/api/7' + href;
      
      try {
        const storyRes = await axios.get(storyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const story = storyRes.data;
        const description = (story.body || '').replace(/<[^>]+>/g, '');
        
        return {
          type: 'webpage',
          title: story.title,
          description: description,
          url: story.share_url || story.url || ('https://daily.zhihu.com' + href),
          coverImage: story.image || coverImage,
          author: 'Zhihu Daily',
          publishTime: story.publish_time ? parseDate(story.publish_time, 'X').toISOString() : new Date().toISOString()
        };
      } catch (e) {
        return null;
      }
    })
  );
  
  return {
      data: list.filter(Boolean),
      page: 1,
      totalPage: 1,
      hasMore: false,
      extra: null
  };
}


async function getFeedDetail(feed) {
    return {
        url: feed.url,
    };
}

module.exports = {
    getFeedDetail,
    name: "知乎日报",
    description: "知乎日报，每天3次，每次7分钟。",
    author: "Zhihu",
    logo: "http://static.daily.zhihu.com/img/new_home_v3/mobile_top_logo.png",
    siteUrl: "https://daily.zhihu.com/",
    version: "1.0.0",
    category: "yuedu",
    getCategories,
    getFeeds
};
