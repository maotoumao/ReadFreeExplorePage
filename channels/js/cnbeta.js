const axios = require('axios');
const cheerio = require('cheerio');
const dayjs = require('dayjs');

function parseDate(date, format) {
    if (format) {
        const match = date.match(/(\d{4})年(\d{2})月(\d{2})日\s+(\d{2}):(\d{2})/);
        if (match) {
            return new Date(match[1], match[2] - 1, match[3], match[4], match[5]);
        }
    }
    return dayjs(date).toDate();
}

const rootUrl = 'https://www.cnbeta.com.tw';

async function getCategories() {
    return [{
        id: 'default',
        name: '头条资讯',
        url: null,
        children: []
    }];
}

async function getFeeds(page, {category, extra, filter}) {
    const limit = 30;
    
    const response = await axios.get(rootUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    const $ = cheerio.load(response.data);
    const token = encodeURI($('meta[name="csrf-token"]').attr('content') || '');
    const dataType = $('div[data-type]').data('type') || '';
    
    const apiUrl = `${rootUrl}/home/more?&type=${dataType}&page=1&_csrf=${token}&_=${Date.now()}`;
    
    const apiResponse = await axios.get(apiUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': rootUrl
        }
    });
    
    const basicItems = apiResponse.data.result.slice(0, limit).map(item => ({
        title: item.title,
        link: item.url_show.startsWith('//') ? `https:${item.url_show}` : item.url_show.replace('http:', 'https:'),
        category: item.label ? item.label.name : '',
    }));
    
    const list = await Promise.all(
        basicItems.map(async item => {
            try {
                const detailResponse = await axios.get(item.link, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                const content = cheerio.load(detailResponse.data);
                content('.topic, .article-topic, .article-global').remove();
                
                const description = (content('.article-summary').text() || '') + (content('.article-content').text() || '');
                const author = content('header.title div.meta span.source').text() || '';
                const dateText = content('.meta span').first().text();
                let pubDate = null;
                if (dateText) {
                    pubDate = parseDate(dateText, 'YYYY年MM月DD日 HH:mm').toISOString();
                }
                
                const coverImage = content('.article-content img').first().attr('src');

                return {
                    type: 'webpage',
                    title: item.title,
                    description: description.slice(0, 200),
                    url: item.link,
                    coverImage: coverImage,
                    author: author,
                    publishTime: pubDate
                };
            } catch (e) {
                return {
                    type: 'webpage',
                    title: item.title,
                    description: '',
                    url: item.link,
                    author: 'cnBeta',
                    publishTime: null
                };
            }
        })
    );
    
    return {
        data: list.filter(Boolean),
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
    name: "cnBeta 头条",
    description: "cnBeta 科技新闻头条。",
    author: "cnBeta",
    logo: "https://www.cnbeta.com.tw/favicon.ico",
    siteUrl: "https://www.cnbeta.com.tw/",
    version: "1.0.0",
    getCategories,
    getFeeds
};
