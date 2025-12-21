const axios = require('axios');
const dayjs = require('dayjs');

function parseDate(date) {
    return dayjs(date).toDate();
}

async function getCategories() {
    return [{
        id: 'default',
        name: '首页',
        url: null,
        children: []
    }];
}

async function getFeeds(page, {category, extra, filter}) {
    const apiUrl = 'https://sso.ifanr.com/api/v5/wp/web-feed/?limit=20&offset=0';
    
    const response = await axios.get(apiUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    const list = await Promise.all(
        response.data.objects.map(async item => {
            const link = `https://sso.ifanr.com/api/v5/wp/article/?post_id=${item.post_id}`;
            let description = '';
            let coverImage = null;
            
            try {
                const detailRes = await axios.get(link, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                const articleData = detailRes.data.objects[0];
                
                coverImage = articleData.post_cover_image;
                description = (articleData.post_content || '').replace(/<[^>]+>/g, '');
            } catch (e) {
                description = item.post_excerpt || '';
            }
            
            return {
                type: 'webpage',
                title: (item.post_title || '').trim(),
                description: description.slice(0, 200),
                url: item.post_url,
                coverImage: coverImage,
                author: item.created_by ? item.created_by.name : '',
                publishTime: parseDate(item.created_at * 1000).toISOString()
            };
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

module.exports = {
    name: "爱范儿",
    description: "爱范儿科技资讯。",
    author: "ifanr",
    logo: "https://www.ifanr.com/favicon.ico",
    siteUrl: "https://www.ifanr.com/",
    version: "1.0.0",
    category: "shuma",
    getCategories,
    getFeeds
};
