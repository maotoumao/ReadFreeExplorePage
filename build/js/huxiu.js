const axios = require('axios');
const dayjs = require('dayjs');
const CryptoJS = require('crypto-js');

function parseDate(date, format) {
    if (format === 'X') {
        return dayjs.unix(parseInt(date)).toDate();
    }
    return dayjs(date).toDate();
}

const categories = {
    '': '首页',
    '10': '视频',
    '21': '车与出行',
    '106': '年轻一代',
    '103': '十亿消费者',
    '105': '前沿科技',
    '115': '财经',
    '22': '娱乐淘金',
    '111': '医疗健康',
    '113': '文化教育',
    '114': '出海',
    '102': '金融地产',
    '110': '企业服务',
    '2': '创业维艰',
    '112': '社交通讯',
    '107': '全球热点',
    '4': '生活腔调'
};

async function getCategories() {
    return Object.entries(categories).map(([id, name]) => ({
        id: id || 'default',
        name: name,
        url: null,
        children: []
    }));
}

const rootUrl = 'https://www.huxiu.com';
const apiArticleRootUrl = 'https://api-article.huxiu.com';

async function getFeeds(page, {category, extra, filter}) {
    const channelId = category.id === 'default' ? '' : category.id;
    const limit = 20;
    
    const apiUrl = channelId 
        ? `${apiArticleRootUrl}/web/channel/articleList`
        : `${apiArticleRootUrl}/web/article/articleList`;
    
    const response = await axios.post(apiUrl, 
        new URLSearchParams({
            platform: 'www',
            channel_id: channelId,
            pagesize: limit.toString(),
        }).toString(),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }
    );
    
    const dataList = response.data.data?.dataList || response.data.data?.datalist || [];
    
    const list = dataList.slice(0, limit).map(item => {
        let link = '';
        if (item.brief_id) {
            link = `${rootUrl}/brief/${item.brief_id}.html`;
        } else if (item.aid) {
            link = `${rootUrl}/article/${item.aid}.html`;
        }
        
        const description = (item.summary || item.content || item.preface || '').replace(/<[^>]+>/g, '');
        const coverImage = item.pic_path;
        
        return {
            type: 'webpage',
            title: (item.title || item.summary || '').replace(/<\/?(?:em|br)?>/g, ''),
            description: description,
            url: link,
            coverImage: coverImage,
            author: item.user_info?.username || item.author || '',
            publishTime: (item.publish_time || item.dateline) ? parseDate(item.publish_time || item.dateline, 'X').toISOString() : null
        };
    }).filter(item => item.url);
    
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
    name: "虎嗅资讯",
    description: "虎嗅网商业资讯。",
    author: "Huxiu",
    logo: "https://www.huxiu.com/favicon.ico",
    siteUrl: "https://www.huxiu.com/",
    version: "1.0.0",
    category: "shangye",
    getCategories,
    getFeeds
};
