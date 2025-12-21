const axios = require('axios');
const cheerio = require('cheerio');
const dayjs = require('dayjs');

function parseDate(date, format) {
    if (format === 'X') {
        return dayjs.unix(parseInt(date)).toDate();
    }
    return dayjs(date).toDate();
}

const baseUrl = 'https://www.dgtle.com';

const categories = {
    '0': '最新',
    '395': '直播',
    '396': '资讯',
    '388': '每日一言'
};

async function getCategories() {
    return Object.entries(categories).map(([id, name]) => ({
        id: id,
        name: name,
        url: null,
        children: []
    }));
}

async function getFeeds(page, {category, extra, filter}) {
    const id = category.id;
    const limit = 30;
    
    const apiUrl = `${baseUrl}/news/getNewsIndexList/${id}`;
    
    // 获取API数据
    const response = await axios.get(apiUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    const dataList = response.data.data?.dataList || [];
    
    const list = await Promise.all(
        dataList.slice(0, limit).map(async item => {
            const title = item.title || item.content;
            const coverImage = item.cover;
            let description = item.content || '';
            
            const linkUrl = `${item.live_status === undefined ? (item.category_name ? 'article' : 'news') : 'live'}-${item.id}-1.html`;
            const link = `${baseUrl}/${linkUrl}`;
            
            // 获取文章详情
            if (item.live_status === undefined) {
                try {
                    const detailRes = await axios.get(link, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    const $detail = cheerio.load(detailRes.data);
                    $detail('div.logo').remove();
                    $detail('p.tip').remove();
                    $detail('p.dgtle').remove();
                    
                    const content = $detail('div.whale_news_detail-daily-content, div#articleContent, div.forum-viewthread-article-box').text();
                    if (content) {
                        description = content;
                    }
                } catch (e) {
                    // 使用列表数据
                }
            }
            
            return {
                type: 'webpage',
                title: title,
                description: description.slice(0, 200),
                url: link,
                coverImage: coverImage,
                author: 'DGTLE',
                publishTime: item.created_at ? parseDate(item.created_at, 'X').toISOString() : null
            };
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
    name: "数字尾巴鲸闻",
    description: "数字尾巴 DGTLE 鲸闻资讯。",
    author: "DGTLE",
    logo: "https://www.dgtle.com/favicon.ico",
    siteUrl: "https://www.dgtle.com/news",
    version: "1.0.0",
    category: "shuma",
    getCategories,
    getFeeds
};
