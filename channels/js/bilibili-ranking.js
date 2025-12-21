const axios = require('axios');
const dayjs = require('dayjs');

function parseDate(date, format) {
    if (format === 'X') {
        return dayjs.unix(parseInt(date)).toDate();
    }
    return dayjs(date).toDate();
}

const ridList = {
    0: { chinese: '全站', english: 'all' },
    1005: { chinese: '动画', english: 'douga' },
    1008: { chinese: '游戏', english: 'game' },
    1007: { chinese: '鬼畜', english: 'kichiku' },
    1003: { chinese: '音乐', english: 'music' },
    1004: { chinese: '舞蹈', english: 'dance' },
    1001: { chinese: '影视', english: 'cinephile' },
    1002: { chinese: '娱乐', english: 'ent' },
    1010: { chinese: '知识', english: 'knowledge' },
    1012: { chinese: '科技数码', english: 'tech' },
    1020: { chinese: '美食', english: 'food' },
    1013: { chinese: '汽车', english: 'car' },
    1014: { chinese: '时尚美妆', english: 'fashion' },
    1018: { chinese: '体育运动', english: 'sports' },
    1024: { chinese: '动物', english: 'animal' },
};

async function getCategories() {
    return Object.values(ridList).map(info => ({
        id: info.english,
        name: info.chinese,
        url: null,
        children: []
    }));
}

function getRidByEnglish(english) {
    for (const [rid, info] of Object.entries(ridList)) {
        if (info.english === english) {
            return { rid, chinese: info.chinese };
        }
    }
    return { rid: '0', chinese: '全站' };
}

async function getFeeds(page, {category, extra, filter}) {
    const ridEnglish = category.id;
    const { rid } = getRidByEnglish(ridEnglish);
    
    const apiUrl = `https://api.bilibili.com/x/web-interface/ranking/v2?rid=${rid}&type=all&web_location=333.934`;
    
    const response = await axios.get(apiUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': `https://www.bilibili.com/v/popular/rank/${ridEnglish}`,
            'Origin': 'https://www.bilibili.com'
        }
    });
    
    if (response.data.code !== 0) {
        throw new Error(response.data.message);
    }
    
    const list = (response.data.data.list || []).map(item => {
        return {
            type: 'video',
            title: item.title,
            description: item.desc || item.title,
            publishTime: item.ctime ? parseDate(item.ctime, 'X').toISOString() : null,
            author: item.owner ? item.owner.name : '',
            url: item.bvid ? `https://www.bilibili.com/video/${item.bvid}` : `https://www.bilibili.com/video/av${item.aid}`,
            coverImage: item.pic
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
    name: "哔哩哔哩排行榜",
    description: "Bilibili 热门视频排行榜。",
    author: "Bilibili",
    logo: "https://www.bilibili.com/favicon.ico",
    siteUrl: "https://www.bilibili.com/",
    version: "1.0.0",
    category: "yule",
    getCategories,
    getFeeds
};
