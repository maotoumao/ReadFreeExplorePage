const axios = require('axios');
const cheerio = require('cheerio');
const dayjs = require('dayjs');

function parseDate(dateStr) {
    // Format: MM-DD HH:mm
    if (!dateStr) return new Date();
    
    const now = new Date();
    const [datePart, timePart] = dateStr.split(' ');
    if (!datePart || !timePart) return now;
    
    const [month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    if (isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) return now;
    
    const date = new Date(now.getFullYear(), month - 1, day, hour, minute);
    return date;
}

async function getCategories() {
    return [
        { id: '34', name: '步行街主干道', url: 'https://bbs.hupu.com/34' },
        { id: '1', name: 'NBA', url: 'https://bbs.hupu.com/1' },
        { id: '114', name: 'CBA', url: 'https://bbs.hupu.com/114' },
        { id: '4596', name: '英雄联盟', url: 'https://bbs.hupu.com/4596' }
    ];
}

async function getFeeds(page, {category, extra, filter}) {
    const id = category.id;
    const order = '1'; // Default to latest post
    
    const rootUrl = 'https://bbs.hupu.com';
    const currentUrl = `${rootUrl}/${id}${order === '1' ? '-postdate' : ''}-${page}`;
    
    const response = await axios.get(currentUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    const $ = cheerio.load(response.data);
    $('.page-icon').remove();
    
    const list = $('.bbs-sl-web-post-layout .post-title a').toArray().map(item => {
        const $item = $(item);
        const timeText = $item.parent().parent().find('.post-time').text().trim();
        return {
            title: $item.text().trim(),
            link: `${rootUrl}${$item.attr('href')}`,
            pubDate: timeText ? parseDate(timeText) : new Date()
        };
    });
    
    const items = await Promise.all(
        list.map(async item => {
            try {
                // Fetch detail for description and author
                // Note: This might be slow for many items, but it's what the original script did
                const detailRes = await axios.get(item.link, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                const $detail = cheerio.load(detailRes.data);
                $detail('.seo-dom').remove();
                
                const author = $detail('.post-user-comp-info-top-name').first().text().trim();
                const description = $detail('.main-thread').first().html() || '';
                
                return {
                    type: 'webpage',
                    title: item.title,
                    url: item.link,
                    author: author,
                    description: description,
                    pubDate: item.pubDate.toISOString(),
                    publishTime: item.pubDate.toISOString()
                };
            } catch (e) {
                return {
                    type: 'webpage',
                    title: item.title,
                    url: item.link,
                    pubDate: item.pubDate.toISOString(),
                    publishTime: item.pubDate.toISOString()
                };
            }
        })
    );
    
    return {
        data: items,
        page: page,
        totalPage: 10,
        hasMore: true,
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
    name: "Hupu BBS",
    description: "虎扑社区",
    author: "Hupu",
    logo: "https://w1.hoopchina.com.cn/images/pc/old/favicon.ico",
    siteUrl: "https://bbs.hupu.com",
    version: "1.0.0",
    category: "shenghuo",
    getCategories,
    getFeeds
};
