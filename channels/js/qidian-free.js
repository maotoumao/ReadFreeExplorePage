const axios = require('axios');
const cheerio = require('cheerio');
const dayjs = require('dayjs');

// 解析相对日期 (如 "3小时前", "1天前")
function parseRelativeDate(relativeDate) {
    const now = dayjs();
    
    if (!relativeDate) return now.toDate();
    
    const match = relativeDate.match(/(\d+)(秒|分钟|小时|天|周|月|年)前/);
    if (!match) return now.toDate();
    
    const num = parseInt(match[1], 10);
    const unit = match[2];
    
    const unitMap = {
        '秒': 'second',
        '分钟': 'minute',
        '小时': 'hour',
        '天': 'day',
        '周': 'week',
        '月': 'month',
        '年': 'year'
    };
    
    return now.subtract(num, unitMap[unit] || 'day').toDate();
}

async function getCategories() {
    return [
        { id: 'default', name: '起点中文网', url: 'https://www.qidian.com/free' },
        { id: 'mm', name: '起点女生网', url: 'https://www.qidian.com/mm/free' }
    ];
}

async function getFeeds(page, {category, extra, filter}) {
    const type = category.id === 'default' ? '' : category.id;
    
    let link;
    if (type === 'mm') {
        link = 'https://www.qidian.com/mm/free';
    } else {
        link = 'https://www.qidian.com/free';
    }
    
    const response = await axios.get(link, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    const $ = cheerio.load(response.data);
    const list = $('#limit-list li');
    
    const items = list.toArray().map((item) => {
        const $item = $(item);
        
        const imgSrc = $item.find('.book-img-box img').attr('src');
        const img = imgSrc ? `<img src="https:${imgSrc}">` : '';
        const score = $item.find('.score').text();
        const rank = `<p>评分：${score}</p>`;
        
        const updateLink = $item.find('p.update > a').attr('href');
        const updateText = $item.find('p.update > a').text();
        const update = updateLink ? `<a href="https:${updateLink}">${updateText}</a>` : '';
        
        const intro = $item.find('p.intro').html() || '';
        const titleText = $item.find('.book-mid-info h4 a').text();
        const href = $item.find('.book-mid-info h4 a').attr('href');
        const author = $item.find('p.author a.name').text();
        const updateTime = $item.find('p.update span').text();
        
        const pubDate = parseRelativeDate(updateTime);
        
        return {
            type: 'webpage',
            title: titleText,
            description: img + rank + update + '<br>' + intro,
            pubDate: pubDate.toISOString(),
            publishTime: pubDate.toISOString(),
            url: href ? 'https:' + href : link,
            author: author,
            coverImage: imgSrc ? `https:${imgSrc}` : null
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
    };
}

module.exports = {
    getFeedDetail,
    name: "Qidian Free",
    description: "起点限时免费",
    author: "Qidian",
    logo: "https://www.qidian.com/favicon.ico",
    siteUrl: "https://www.qidian.com",
    version: "1.0.0",
    category: "yuedu",
    getCategories,
    getFeeds
};
