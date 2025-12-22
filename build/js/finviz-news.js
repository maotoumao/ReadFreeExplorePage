const axios = require('axios');
const cheerio = require('cheerio');
const dayjs = require('dayjs');

const categories = {
  news: 0,
  blogs: 1
};

async function getCategories() {
    return Object.keys(categories).map(key => ({
        id: key,
        name: key,
        url: null,
        children: []
    }));
}

function parseDate(dateStr) {
    // Formats: HH:mmA (e.g. 09:30AM) or MMM-DD (e.g. Dec-03)
    
    // Try HH:mmA
    const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})(AM|PM)/);
    if (timeMatch) {
        let hour = parseInt(timeMatch[1], 10);
        const minute = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[3];
        if (ampm === 'PM' && hour < 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;
        
        const d = new Date();
        d.setHours(hour, minute, 0, 0);
        return d;
    }
    
    // Try MMM-DD
    const dateMatch = dateStr.match(/([A-Z][a-z]{2})-(\d{1,2})/);
    if (dateMatch) {
        const monthStr = dateMatch[1];
        const day = parseInt(dateMatch[2], 10);
        const months = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
        const month = months[monthStr];
        if (month !== undefined) {
            const d = new Date();
            d.setMonth(month, day);
            return d;
        }
    }
    
    return new Date();
}

async function getFeeds(page, {category, extra, filter}) {
  const catId = category.id;
  const limit = 200;
  
  const rootUrl = 'https://finviz.com';
  const currentUrl = `${rootUrl}/news.ashx`;
  
  const response = await axios.get(currentUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  const $ = cheerio.load(response.data);
  
  const list = $('table.table-fixed')
    .eq(categories[catId])
    .find('tr')
    .slice(0, limit)
    .toArray()
    .map((item) => {
      const $item = $(item);
      const a = $item.find('a.nn-tab-link');
      
      const boxover = a.parent().attr('data-boxover') || '';
      const descriptionMatches = boxover.match(/<td class='news_tooltip-tab'>(.*?)<\/td>/);
      
      const useHref = $item.find('use').first().attr('href') || '';
      const authorMatches = useHref.match(/#(.*?)-(light|dark)/);
      
      const dateText = $item.find('td.news_date-cell').text();
      
      return {
        type: 'webpage',
        title: a.text(),
        url: a.attr('href'),
        description: descriptionMatches ? descriptionMatches[1] : '',
        author: authorMatches ? authorMatches[1].replace(/-/g, ' ') : 'finviz',
        publishTime: parseDate(dateText).toISOString(),
        coverImage: null
      };
    })
    .filter((item) => item.title);
  
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
        url: feed.url,
    };
}

module.exports = {
    getFeedDetail,
    name: "Finviz News",
    description: "Finviz 财经新闻。",
    author: "Finviz",
    logo: "https://finviz.com/favicon.ico",
    siteUrl: "https://finviz.com/news.ashx",
    version: "1.0.0",
    category: "jinrong",
    getCategories,
    getFeeds
};
