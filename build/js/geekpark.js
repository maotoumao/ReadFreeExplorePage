const axios = require('axios');
const dayjs = require('dayjs');

function parseDate(date, format) {
    if (format === 'X') {
        return dayjs.unix(parseInt(date)).toDate();
    }
    return dayjs(date).toDate();
}

const columns = {
    '': '首页资讯',
    '179': '综合报道',
    '304': 'AI新浪潮观察',
    '305': '新造车观察'
};

async function getCategories() {
    return Object.entries(columns).map(([id, name]) => ({
        id: id,
        name: name,
        url: null,
        children: []
    }));
}

async function getFeeds(page, {category, extra, filter}) {
    const column = category.id;
    const limit = 20;
    
    const rootUrl = 'https://geekpark.net';
    const apiRootUrl = 'https://mainssl.geekpark.net';
    const apiUrl = column ? `${apiRootUrl}/api/v1/columns/${column}` : `${apiRootUrl}/api/v2`;
    
    const response = await axios.get(apiUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': rootUrl
        }
    });
    
    const posts = response.data.homepage_posts || response.data.column?.posts || [];
    
    const list = await Promise.all(
        posts.slice(0, limit).map(async (rawItem) => {
            const item = rawItem.post || rawItem;
            const postId = item.id;
            const detailApiUrl = `${apiRootUrl}/api/v1/posts/${postId}`;
            
            try {
                const detailRes = await axios.get(detailApiUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer': rootUrl
                    }
                });
                
                const data = detailRes.data.post;
                const title = data.title;
                const image = data.cover_url;
                const description = (data.content || data.abstract || '').replace(/<[^>]+>/g, '');
                
                return {
                    type: 'webpage',
                    title: title,
                    description: description.slice(0, 200),
                    url: `${rootUrl}/news/${data.id}`,
                    coverImage: image,
                    author: data.authors?.map(a => a.realname || a.nickname).join('/') || '',
                    publishTime: parseDate(data.published_timestamp, 'X').toISOString()
                };
            } catch (e) {
                return {
                    type: 'webpage',
                    title: item.title,
                    description: item.abstract,
                    url: `${rootUrl}/news/${item.id}`,
                    coverImage: item.cover_url,
                    author: item.authors?.map(a => a.realname || a.nickname).join('/') || '',
                    publishTime: parseDate(item.published_timestamp, 'X').toISOString()
                };
            }
        })
    );
    
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
    name: "极客公园",
    description: "极客公园 GeekPark 科技资讯。",
    author: "GeekPark",
    logo: "https://geekpark.net/favicon.ico",
    siteUrl: "https://geekpark.net/",
    version: "1.0.0",
    category: "keji",
    getCategories,
    getFeeds
};
