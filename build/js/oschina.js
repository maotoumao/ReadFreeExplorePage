const axios = require('axios');
const cheerio = require('cheerio');
const dayjs = require('dayjs');

function parseDate(date) {
    return dayjs(date).toDate();
}

function parseRelativeDate(date) {
    const now = dayjs();
    if (date.includes('分钟前')) {
        const minutes = parseInt(date);
        return now.subtract(minutes, 'minute').toDate();
    }
    if (date.includes('小时前')) {
        const hours = parseInt(date);
        return now.subtract(hours, 'hour').toDate();
    }
    if (date.includes('天前')) {
        const days = parseInt(date);
        return now.subtract(days, 'day').toDate();
    }
    if (date.includes('昨天')) {
        return now.subtract(1, 'day').toDate();
    }
    if (date.includes('前天')) {
        return now.subtract(2, 'day').toDate();
    }
    return dayjs(date).toDate();
}

const configs = {
    all: {
        name: '最新资讯',
        link: 'https://www.oschina.net/news/project',
        ajaxUrl: 'https://www.oschina.net/news/widgets/_news_index_all_list?p=1&type=ajax',
    },
    industry: {
        name: '综合资讯',
        link: 'https://www.oschina.net/news/industry',
        ajaxUrl: 'https://www.oschina.net/news/widgets/_news_index_generic_list?p=1&type=ajax',
    },
    project: {
        name: '软件更新资讯',
        link: 'https://www.oschina.net/news/project',
        ajaxUrl: 'https://www.oschina.net/news/widgets/_news_index_project_list?p=1&type=ajax',
    },
    'industry-news': {
        name: '行业资讯',
        link: 'https://www.oschina.net/news/industry-news',
        ajaxUrl: 'https://www.oschina.net/news/widgets/_news_index_industry_list?p=1&type=ajax',
    },
    programming: {
        name: '编程语言资讯',
        link: 'https://www.oschina.net/news/programming',
        ajaxUrl: 'https://www.oschina.net/news/widgets/_news_index_programming_language_list?p=1&type=ajax',
    },
};

async function getCookie() {
    try {
        const res = await axios.get('https://www.oschina.net/news', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        const setCookie = res.headers['set-cookie'];
        if (setCookie) {
            return setCookie.map(c => c.split(';')[0]).join('; ');
        }
    } catch (e) {
        // ignore
    }
    return '';
}

async function getCategories() {
    return Object.entries(configs).map(([id, config]) => ({
        id: id,
        name: config.name,
        url: config.link,
        children: []
    }));
}

async function getFeeds(page, {category, extra, filter}) {
    const id = category.id;
    const config = configs[id] || configs.all;
    
    const cookie = await getCookie();
    
    // The original script uses p=1 in ajaxUrl. We should replace it with current page.
    const ajaxUrl = config.ajaxUrl.replace('p=1', `p=${page}`);
    
    const response = await axios.get(ajaxUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': config.link,
            'Cookie': cookie,
            'X-Requested-With': 'XMLHttpRequest'
        }
    });
    
    const $ = cheerio.load(response.data);
    const list = $('.news-item');
    
    const items = list.toArray().map(item => {
        const $item = $(item);
        const $title = $item.find('.title a');
        const title = $title.attr('title') || $title.text();
        const link = $title.attr('href');
        const description = $item.find('.description').text();
        const author = $item.find('.item-login-user span').text();
        const dateStr = $item.find('.item-login-user').contents().filter((_, el) => el.type === 'text').text().trim().split(/\s+/).pop();
        
        let pubDate = new Date();
        if (dateStr) {
            pubDate = parseRelativeDate(dateStr);
        }
        
        return {
            type: 'webpage',
            title: title,
            description: description,
            url: link,
            author: author,
            pubDate: pubDate.toISOString(),
            publishTime: pubDate.toISOString()
        };
    }).filter(item => item.url);
    
    return {
        data: items,
        page: page,
        totalPage: 10, // Unknown
        hasMore: true,
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
    name: "OSChina",
    description: "开源中国资讯",
    author: "OSChina",
    logo: "https://www.oschina.net/favicon.ico",
    siteUrl: "https://www.oschina.net",
    version: "1.0.0",
    category: "kaifa",
    getCategories,
    getFeeds
};
