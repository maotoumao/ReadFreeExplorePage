const axios = require('axios');

async function getCategories() {
    return [{
        id: 'default',
        name: '即将上映',
        url: null,
        children: []
    }];
}

async function getFeeds(page, {category, extra, filter}) {
    const response = await axios.get('https://m.douban.com/rexxar/api/v2/movie/coming_soon', {
        headers: {
            'Referer': 'https://m.douban.com/movie/',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
        }
    });
    
    const list = (response.data.subjects || []).map(item => {
        let description = '';
        if (item.pubdate && item.pubdate.length > 0) {
            description += `上映日期: ${item.pubdate.join(', ')}\n`;
        }
        if (item.directors && item.directors.length > 0) {
            description += `导演: ${item.directors.map(d => d.name).join(', ')}\n`;
        }
        if (item.actors && item.actors.length > 0) {
            description += `演员: ${item.actors.map(a => a.name).join(', ')}\n`;
        }
        if (item.genres && item.genres.length > 0) {
            description += `类型: ${item.genres.join(', ')}\n`;
        }
        if (item.intro) {
            description += `${item.intro}\n`;
        }
        if (item.wish_count) {
            description += `想看人数: ${item.wish_count}`;
        }
        
        return {
            type: 'webpage',
            title: item.title,
            description: description,
            url: item.url,
            coverImage: item.cover_url,
            author: 'Douban',
            publishTime: null
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
    name: "豆瓣电影即将上映",
    description: "豆瓣电影即将上映列表。",
    author: "Douban",
    logo: "https://img3.doubanio.com/favicon.ico",
    siteUrl: "https://movie.douban.com/coming",
    version: "1.0.0",
    category: "yule",
    getCategories,
    getFeeds
};
