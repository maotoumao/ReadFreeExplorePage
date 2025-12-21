const axios = require('axios');
const cheerio = require('cheerio');
const dayjs = require('dayjs');

function parseDate(date) {
    return dayjs(date).toDate();
}

async function getCategories() {
    return [{
        id: 'default',
        name: '科学人',
        url: null,
        children: []
    }];
}

async function getFeeds(page, {category, extra, filter}) {
    const response = await axios.get('https://www.guokr.com/beta/proxy/science_api/articles', {
        params: {
            retrieve_type: 'by_category',
            page: 1,
        },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    const list = await Promise.all(
        response.data.map(async item => {
            const title = item.title;
            const summary = item.summary;
            const link = `https://www.guokr.com/article/${item.id}/`;
            const author = item.author ? item.author.nickname : '';
            const pubDate = parseDate(item.date_published).toISOString();
            
            let description = summary;
            let coverImage = null;
            
            try {
                const detailRes = await axios.get(`https://apis.guokr.com/minisite/article/${item.id}.json`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                const $ = cheerio.load(detailRes.data.result.content);
                $('#meta_content').remove();
                
                description = $.text().slice(0, 200);
                coverImage = $('img').first().attr('src') || $('img').first().attr('data-src');
            } catch (e) {
                // Use summary
            }
            
            return {
                type: 'webpage',
                title: title,
                description: description,
                url: link,
                coverImage: coverImage,
                author: author,
                publishTime: pubDate
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
    name: "果壳网科学人",
    description: "果壳网科学人文章。",
    author: "Guokr",
    logo: "https://www.guokr.com/favicon.ico",
    siteUrl: "https://www.guokr.com/scientific",
    version: "1.0.0",
    category: "keji",
    getCategories,
    getFeeds
};
