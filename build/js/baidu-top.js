const axios = require('axios');
const cheerio = require('cheerio');

const CATEGORY_MAP = {
    'realtime': '热搜榜',
    'novel': '小说榜',
    'movie': '电影榜',
    'teleplay': '电视剧榜',
    'car': '汽车榜',
    'game': '游戏榜'
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
    const board = category.id;
    const link = `https://top.baidu.com/board?tab=${board}`;
    
    const response = await axios.get(link, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    const $ = cheerio.load(response.data);
    
    // 提取数据
    const sanRoot = $('#sanRoot').html();
    const match = sanRoot?.match(/s-data:(.*)/);
    
    if (!match) {
        throw new Error('无法解析数据');
    }
    
    const data = JSON.parse(match[1]).data;
    const content = data.cards?.[0]?.content || [];
    
    const list = content.map(item => {
        let description = item.desc || '';
        if (item.hotChange) {
            description += `\n热度变化: ${item.hotChange}`;
        }

        return {
            type: 'webpage',
            title: item.word,
            description: description,
            url: item.rawUrl,
            coverImage: item.img,
            author: 'Baidu Top'
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


async function getFeedDetail(feed) {
    return {
        content: feed.url,
        type: "webpage"
    };
}

module.exports = {
    getFeedDetail,
    name: "百度热搜榜单",
    description: "百度实时热搜榜单。",
    author: "Baidu",
    logo: "https://www.baidu.com/favicon.ico",
    siteUrl: "https://top.baidu.com/",
    version: "1.0.0",
    category: "shenghuo",
    getCategories,
    getFeeds
};
