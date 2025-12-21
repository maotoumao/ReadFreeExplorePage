const axios = require('axios');
const dayjs = require('dayjs');

function parseDate(dateStr) {
    return dayjs(dateStr).toDate();
}

async function getCategories() {
    return [
        { id: 'newsflash', name: '快讯', url: 'https://www.odaily.news/newsflash' }
    ];
}

async function getFeeds(page, {category, extra, filter}) {
    const limit = 100;
    const rootUrl = 'https://www.odaily.news';
    const currentUrl = `${rootUrl}/api/pp/api/info-flow/newsflash_columns/newsflashes?b_id=&per_page=${limit}`;
    
    const response = await axios.get(currentUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    const items = response.data.data.items.map((item) => ({
        type: 'webpage',
        title: item.title,
        url: item.news_url,
        pubDate: parseDate(item.published_at).toISOString(),
        publishTime: parseDate(item.published_at).toISOString(),
        description: `<p>${item.description}</p>`,
        author: 'Odaily'
    }));
    
    return {
        data: items,
        page: 1,
        totalPage: 1,
        hasMore: false,
        extra: null
    };
}

module.exports = {
    name: "Odaily Newsflash",
    description: "Odaily星球日报快讯",
    author: "Odaily",
    logo: "https://www.odaily.news/favicon.ico",
    siteUrl: "https://www.odaily.news",
    version: "1.0.0",
    category: "jinrong",
    getCategories,
    getFeeds
};
