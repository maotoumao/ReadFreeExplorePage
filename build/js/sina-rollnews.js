const axios = require('axios');
const dayjs = require('dayjs');

function parseDate(date, format) {
    if (format === 'X') {
        return dayjs.unix(parseInt(date)).toDate();
    }
    return dayjs(date).toDate();
}

const CATEGORY_MAP = {
    '2509': '全部',
    '2510': '国内',
    '2511': '国际',
    '2669': '社会',
    '2512': '体育',
    '2513': '娱乐',
    '2514': '军事',
    '2515': '科技',
    '2516': '财经',
    '2517': '股市',
    '2518': '美股'
};

/**
 * 获取所有分类
 * 返回结构符合 ChannelCategory
 */
async function getCategories() {
    return Object.entries(CATEGORY_MAP).map(([id, name]) => ({
        id: id,
        name: name,
        url: null,
        children: []
    }));
}

/**
 * 获取分类下的新闻列表
 * 返回结构符合 Pagination
 */
async function getFeeds(page, {category, extra, filter}) {
    const pageid = '153';
    const lid = category.id;
    const limit = 50;
    const pageNum = page || 1;
    
    const response = await axios.get('https://feed.mix.sina.com.cn/api/roll/get', {
        params: {
            pageid,
            lid,
            k: '',
            num: limit,
            page: pageNum,
            r: Math.random(),
            _: Date.now()
        },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://news.sina.com.cn/'
        }
    });
    
    const result = response.data.result;
    const data = result?.data || [];
    const total = result?.total || 0;
    
    const list = data.map(item => ({
        type: 'webpage',
        title: item.title,
        description: item.intro,
        url: item.url.replace('http://', 'https://'),
        author: item.media_name,
        publishTime: parseDate(item.intime, 'X').toISOString(),
        // coverImage: item.img // If available
    }));
    
    // 判断是否还有更多数据
    // 如果当前获取的数据量等于limit，且当前已获取的总数小于total，则认为还有更多
    const hasMore = list.length === limit && (pageNum * limit) < total;
    
    // 计算总页数 (可选)
    const totalPage = total > 0 ? Math.ceil(total / limit) : -1;

    return {
        data: list,
        page: pageNum,
        totalPage: totalPage,
        hasMore: hasMore,
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
    name: "新浪滚动新闻",
    description: "新浪新闻滚动频道，提供最新的即时新闻资讯。",
    author: "Sina",
    logo: "https://news.sina.com.cn/favicon.ico",
    siteUrl: "https://news.sina.com.cn/",
    version: "1.0.0",
    category: "shenghuo",
    getCategories,
    getFeeds
};
