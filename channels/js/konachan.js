const axios = require('axios');

async function getCategories() {
    return [
        {
            id: 'sfw',
            name: 'Konachan.net (SFW)',
            url: 'https://konachan.net',
            children: [
                { id: 'sfw/1d', name: 'Last 24 hours', url: 'https://konachan.net/post/popular_recent?period=1d' },
                { id: 'sfw/1w', name: 'Last week', url: 'https://konachan.net/post/popular_recent?period=1w' },
                { id: 'sfw/1m', name: 'Last month', url: 'https://konachan.net/post/popular_recent?period=1m' },
                { id: 'sfw/1y', name: 'Last year', url: 'https://konachan.net/post/popular_recent?period=1y' }
            ]
        },
        {
            id: 'nsfw',
            name: 'Konachan.com (NSFW)',
            url: 'https://konachan.com',
            children: [
                { id: 'nsfw/1d', name: 'Last 24 hours', url: 'https://konachan.com/post/popular_recent?period=1d' },
                { id: 'nsfw/1w', name: 'Last week', url: 'https://konachan.com/post/popular_recent?period=1w' },
                { id: 'nsfw/1m', name: 'Last month', url: 'https://konachan.com/post/popular_recent?period=1m' },
                { id: 'nsfw/1y', name: 'Last year', url: 'https://konachan.com/post/popular_recent?period=1y' }
            ]
        }
    ];
}

async function getFeeds(page, {category, extra, filter}) {
    let [type, period] = category.id.split('/');
    if (!period) {
        type = 'sfw';
        period = '1d';
    }
    
    const isSfw = type === 'sfw';
    const baseUrl = isSfw ? 'https://konachan.net' : 'https://konachan.com';

    const response = await axios.get(`${baseUrl}/post/popular_recent.json`, {
        params: { period },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });

    const posts = response.data;

    const items = posts.map(post => {
        const descriptionParts = [
            `<img src="${post.sample_url}" />`,
            `<p>Rating: ${post.rating}</p><p>Score: ${post.score}</p>`
        ];

        if (post.source) {
            descriptionParts.push(`<a href="${post.source}">Source</a>`);
        }
        if (post.parent_id) {
            descriptionParts.push(`<a href="${baseUrl}/post/show/${post.parent_id}">Parent</a>`);
        }

        return {
            type: 'image',
            title: post.tags,
            guid: `konachan-${type}-${period}-${post.id}`,
            url: `${baseUrl}/post/show/${post.id}`,
            author: post.author,
            pubDate: new Date(post.created_at * 1000).toISOString(),
            publishTime: new Date(post.created_at * 1000).toISOString(),
            description: descriptionParts.join(''),
            coverImage: post.sample_url
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
        type: "webpage"
    };
}

module.exports = {
    getFeedDetail,
    name: "Konachan",
    description: "Konachan 近期热门图片",
    author: "Konachan",
    logo: "https://konachan.net/favicon.ico",
    siteUrl: "https://konachan.net",
    version: "1.0.0",
    category: "yule",
    getCategories,
    getFeeds
};
