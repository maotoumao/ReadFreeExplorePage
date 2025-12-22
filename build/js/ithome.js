const axios = require('axios');
const cheerio = require('cheerio');

const categoryConfig = {
    it: { title: 'IT 资讯' },
    soft: { title: '软件之家' },
    win10: { title: 'win10 之家' },
    win11: { title: 'win11 之家' },
    iphone: { title: 'iphone 之家' },
    ipad: { title: 'ipad 之家' },
    android: { title: 'android 之家' },
    digi: { title: '数码之家' },
    next: { title: '智能时代' },
};

async function getCategories() {
    return Object.entries(categoryConfig).map(([id, cfg]) => ({
        id: id,
        name: cfg.title,
        url: `https://${id}.ithome.com/`,
        children: []
    }));
}

async function getFeeds(page, {category, extra, filter}) {
    const id = category.id;
    const currentUrl = `https://${id}.ithome.com/`;
    
    const response = await axios.get(currentUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    const $ = cheerio.load(response.data);
    
    const list = $('#list > div.fl > ul > li > div > h2 > a')
        .slice(0, 10)
        .toArray()
        .map(item => ({
            title: $(item).text(),
            link: $(item).attr('href'),
        }));
    
    const items = await Promise.all(
        list.map(async item => {
            try {
                const res = await axios.get(item.link, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                const content = cheerio.load(res.data);
                const post = content('#paragraph');
                
                post.find('img[data-original]').each((_, ele) => {
                    const $ele = content(ele);
                    $ele.attr('src', $ele.attr('data-original'));
                    $ele.removeAttr('class');
                    $ele.removeAttr('data-original');
                });
                
                const description = post.html() || '';
                const pubtime = content('#pubtime_baidu').text();
                let pubDate = new Date();
                if (pubtime) {
                    // pubtime format: 2023/10/27 10:00:00 or similar
                    // Adding GMT+8 for China Standard Time
                    pubDate = new Date(pubtime.replace(/\//g, '-') + ' GMT+8');
                }
                
                return {
                    type: 'webpage',
                    title: item.title,
                    url: item.link,
                    description: description,
                    pubDate: pubDate.toISOString(),
                    publishTime: pubDate.toISOString()
                };
            } catch (e) {
                return {
                    type: 'webpage',
                    title: item.title,
                    url: item.link,
                    description: '',
                    pubDate: new Date().toISOString(),
                    publishTime: new Date().toISOString()
                };
            }
        })
    );
    
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
        url: feed.url,
    };
}

module.exports = {
    getFeedDetail,
    name: "IT Home",
    description: "IT之家分类资讯",
    author: "ITHome",
    logo: "https://img.ithome.com/m/images/logo.png",
    siteUrl: "https://www.ithome.com",
    version: "1.0.0",
    category: "shuma",
    getCategories,
    getFeeds
};
