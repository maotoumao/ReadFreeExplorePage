const axios = require('axios');
const dayjs = require('dayjs');
const CryptoJS = require('crypto-js');

function parseDate(timestamp) {
    return dayjs(timestamp).toDate();
}

const rootUrl = 'https://www.cls.cn';

const categories = {
    watch: '看盘',
    announcement: '公司',
    explain: '解读',
    red: '加红',
    jpush: '推送',
    remind: '提醒',
    fund: '基金',
    hk: '港股',
};

async function getCategories() {
    const list = Object.entries(categories).map(([id, name]) => ({
        id: id,
        name: name,
        url: null,
        children: []
    }));
    // Add 'all' category
    list.unshift({
        id: 'all',
        name: '全部',
        url: null,
        children: []
    });
    return list;
}

function getSearchParams(moreParams) {
    const params = {
        appName: 'CailianpressWeb',
        os: 'web',
        sv: '7.7.5',
        ...moreParams
    };
    
    const searchParams = new URLSearchParams(params);
    const entries = Array.from(searchParams.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const sortedParams = new URLSearchParams(entries);
    const sign = CryptoJS.MD5(CryptoJS.SHA1(sortedParams.toString()).toString()).toString();
    sortedParams.append('sign', sign);
    
    return sortedParams.toString();
}

async function getFeeds(page, {category, extra, filter}) {
    const limit = 50;
    const catId = category.id === 'all' ? '' : category.id;
    
    let apiUrl;
    if (catId) {
        apiUrl = `${rootUrl}/v1/roll/get_roll_list`;
    } else {
        apiUrl = `${rootUrl}/nodeapi/updateTelegraphList`;
    }
    
    const searchParams = getSearchParams({
        category: catId,
        hasFirstVipArticle: 1
    });
    
    const response = await axios.get(`${apiUrl}?${searchParams}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': rootUrl
        }
    });
    
    const list = response.data.data.roll_data.slice(0, limit).map(item => {
        const description = (item.content || '').replace(/<[^>]+>/g, '');
        const coverImage = (item.images && item.images.length > 0) ? item.images[0] : null;
        
        return {
            type: 'webpage',
            title: item.title || description.substring(0, 50) || '',
            description: description,
            url: item.shareurl,
            coverImage: coverImage,
            author: '财联社',
            publishTime: parseDate(item.ctime * 1000).toISOString()
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
    };
}

module.exports = {
    getFeedDetail,
    name: "财联社电报",
    description: "财联社电报，提供24小时滚动财经新闻。",
    author: "Cailianpress",
    logo: "https://www.cls.cn/favicon.ico",
    siteUrl: "https://www.cls.cn/telegraph",
    version: "1.0.0",
    getCategories,
    getFeeds
};
