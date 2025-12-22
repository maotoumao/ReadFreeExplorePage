const axios = require('axios');
const dayjs = require('dayjs');

function parseDate(date) {
    return dayjs(date).toDate();
}

const rootUrl = 'https://www.36kr.com';

const CATEGORY_MAP = {
    'newsflashes': '快讯',
    'news': '新闻',
    'information/web_news': '资讯',
    'information/web_recommend': '推荐',
    'information/happy_life': '生活',
    'information/real_estate': '房产',
    'information/web_zhichang': '职场'
};

const shortcuts = {
    '/information': '/information/web_news',
    '/information/latest': '/information/web_news',
    '/information/recommend': '/information/web_recommend',
    '/information/life': '/information/happy_life',
    '/information/estate': '/information/real_estate',
    '/information/workplace': '/information/web_zhichang',
};

async function getCategories() {
    return Object.entries(CATEGORY_MAP).map(([id, name]) => ({
        id: id,
        name: name,
        url: null,
        children: []
    }));
}

async function getFeeds(page, {category, extra, filter}) {
    const limit = 30;
    const categoryId = category.id;
    
    let path = '/' + categoryId;
    path = path.replace(/^\/news(?!flashes)/, '/information');
    
    const currentUrl = rootUrl + (shortcuts[path] || path);
    
    const response = await axios.get(currentUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    const dataMatch = response.data.match(/"itemList":(\[.*?\])(?=,")/s);
    if (!dataMatch) {
        throw new Error('无法解析页面数据');
    }
    
    const data = JSON.parse(dataMatch[1]);
    
    const list = data
        .slice(0, limit)
        .filter(item => item.itemType !== 0)
        .map(item => {
            item = item.templateMaterial || item;
            const description = (item.widgetContent || item.content || '').replace(/<[^>]+>/g, '');
            return {
                type: 'webpage',
                title: (item.widgetTitle || '').replace(/<\/?em>/g, ''),
                description: description,
                author: item.author || '',
                publishTime: parseDate(item.publishTime).toISOString(),
                url: rootUrl + '/' + (path === '/newsflashes' ? 'newsflashes' : 'p') + '/' + item.itemId,
                coverImage: null // 36kr doesn't seem to expose image easily in this JSON without more parsing
            };
        });

    return {
        data: list,
        page: 1,
        totalPage: -1,
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
    name: "36氪资讯",
    description: "36氪提供科技、创投等领域的新闻资讯。",
    author: "36Kr",
    logo: "https://www.36kr.com/favicon.ico",
    siteUrl: "https://www.36kr.com/",
    version: "1.0.0",
    category: "keji",
    getCategories,
    getFeeds
};
