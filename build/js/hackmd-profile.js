const axios = require('axios');

async function getCategories() {
    return [
        { id: 'hackmd', name: 'HackMD Blog', url: 'https://hackmd.io/@hackmd' },
        { id: 'tutorials', name: 'HackMD Tutorials', url: 'https://hackmd.io/@tutorials' }
    ];
}

async function getFeeds(page, {category, extra, filter}) {
    const path = category.id;
    
    const response = await axios.get(`https://hackmd.io/api/@${path}/overview`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });

    const data = response.data;
    const profile = data.user || data.team;

    const items = data.notes.map(note => ({
        type: 'webpage',
        title: note.title,
        description: `<pre>${note.content}</pre>`,
        pubDate: new Date(note.publishedAt).toISOString(),
        publishTime: new Date(note.publishedAt).toISOString(),
        url: `https://hackmd.io/@${path}/${note.permalink || note.shortId}`,
        author: profile.name
    }));

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
    name: "HackMD Profile",
    description: "HackMD 用户/团队 Profile 文档",
    author: "HackMD",
    logo: "https://hackmd.io/favicon.png",
    siteUrl: "https://hackmd.io",
    version: "1.0.0",
    category: "kaifa",
    getCategories,
    getFeeds
};
