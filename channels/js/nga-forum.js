const axios = require('axios');
const dayjs = require('dayjs');

const X_UA = 'NGA_skull/6.0.5(iPhone10,3;iOS 12.0.1)';

function parseDate(timestamp) {
    return dayjs.unix(parseInt(timestamp, 10)).toDate();
}

function formatContent(content) {
    return content
        .replace(/\[img](.+?)\[\/img]/g, (match, p1) => {
            const src = p1.replace(/\?.*/g, '');
            return `<img src="${src}" />`;
        })
        .replace(/\[url](.+?)\[\/url]/g, '<a href="$1">$1</a>');
}

const FORUMS = [
    { id: '-7', name: '网事杂谈' },
    { id: '414', name: '游戏综合' },
    { id: '431', name: '风暴英雄' },
    { id: '310', name: '国家地理' },
    { id: '422', name: '炉石传说' },
    { id: '7', name: '魔兽世界' }
];

async function getCategories() {
    return FORUMS.map(f => ({
        id: f.id,
        name: f.name,
        url: `https://nga.178.com/thread.php?fid=${f.id}`,
        children: []
    }));
}

async function getFeeds(page, {category, extra, filter}) {
    const fid = category.id;
    const recommend = false; // Default to all posts
    
    const timestamp = Math.floor(Date.now() / 1000);
    let cookieString = `guestJs=${timestamp};`;
    
    // 获取帖子列表
    const homeResponse = await axios.post(
        'https://ngabbs.com/app_api.php?__lib=subject&__act=list',
        new URLSearchParams({
            fid,
            recommend: recommend ? '1' : '0',
            page: page.toString()
        }).toString(),
        {
            headers: {
                'X-User-Agent': X_UA,
                'Cookie': cookieString,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    );
    
    const list = homeResponse.data.result.data.filter(({ tid }) => tid);
    
    // 获取帖子详情
    const items = await Promise.all(
        list.slice(0, 20).map(async ({ subject, postdate, tid }) => {
            const link = `https://nga.178.com/read.php?tid=${tid}`;
            
            let description = '';
            try {
                const detailResponse = await axios.post(
                    'https://ngabbs.com/app_api.php?__lib=post&__act=list',
                    new URLSearchParams({ tid }).toString(),
                    {
                        headers: {
                            'X-User-Agent': X_UA,
                            'Cookie': cookieString,
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }
                );
                
                if (detailResponse.data.code === 0) {
                    description = formatContent(detailResponse.data.result[0].content);
                } else {
                    description = detailResponse.data.msg || '';
                }
            } catch (e) {
                description = subject;
            }
            
            return {
                type: 'webpage',
                title: subject,
                description: description,
                url: link,
                pubDate: parseDate(postdate).toISOString(),
                publishTime: parseDate(postdate).toISOString(),
                author: 'NGA User'
            };
        })
    );
    
    return {
        data: items,
        page: page,
        totalPage: 10, // Unknown
        hasMore: true,
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
    name: "NGA Forum",
    description: "NGA 论坛帖子",
    author: "NGA",
    logo: "https://nga.178.com/favicon.ico",
    siteUrl: "https://nga.178.com",
    version: "1.0.0",
    category: "youxi",
    getCategories,
    getFeeds
};
