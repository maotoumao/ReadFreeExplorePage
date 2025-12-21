const axios = require('axios');
const cheerio = require('cheerio');

async function getCategories() {
    return [
        { id: 'psngame', name: '最新游戏', url: 'https://www.psnine.com/psngame' }
    ];
}

async function getFeeds(page, {category, extra, filter}) {
    const url = 'https://www.psnine.com/psngame';
    
    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    const $ = cheerio.load(response.data);
    
    const items = $('table tr').toArray().map((item) => {
        const $item = $(item);
        const title = $item.find('.title a').text();
        const href = $item.find('.title a').attr('href');
        const subtitle = $item.find('.title span').text();
        const info = $item.find('.twoge').text();
        
        return {
            type: 'webpage',
            title: title,
            url: href ? `https://www.psnine.com${href}` : url,
            description: `${subtitle} ${info}`.trim(),
            pubDate: new Date().toISOString(),
            publishTime: new Date().toISOString()
        };
    }).filter(item => item.title);
    
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
    };
}

module.exports = {
    getFeedDetail,
    name: "PSNine",
    description: "PSNine 最新游戏",
    author: "PSNine",
    logo: "https://www.psnine.com/favicon.ico",
    siteUrl: "https://www.psnine.com",
    version: "1.0.0",
    category: "youxi",
    getCategories,
    getFeeds
};
