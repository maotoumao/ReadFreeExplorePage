const axios = require('axios');
const dayjs = require('dayjs');
const CryptoJS = require('crypto-js');

function parseDate(timestamp) {
    return dayjs.unix(parseInt(timestamp)).toDate();
}

function md5(str) {
    return CryptoJS.MD5(str).toString();
}

function getRandomDeviceId() {
    let id = [10, 6, 6, 6, 14];
    id = id.map(i => Math.random().toString(36).substring(2, i));
    return id.join('-');
}

function getAppToken() {
    const DEVICE_ID = getRandomDeviceId();
    const now = Math.round(Date.now() / 1000);
    const hexNow = '0x' + now.toString(16);
    const md5Now = md5(now.toString());
    const s = 'token://com.coolapk.market/c67ef5943784d09750dcfbb31020f0ab?' + md5Now + '$' + DEVICE_ID + '&com.coolapk.market';
    const md5S = md5(Buffer.from(s).toString('base64'));
    const token = md5S + DEVICE_ID + hexNow;
    return token;
}

function getHeaders() {
    return {
        'X-Requested-With': 'XMLHttpRequest',
        'X-App-Id': 'com.coolapk.market',
        'X-App-Token': getAppToken(),
        'X-Sdk-Int': '29',
        'X-Sdk-Locale': 'zh-CN',
        'X-App-Version': '11.0',
        'X-Api-Version': '11',
        'X-App-Code': '2101202',
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 10; Redmi K30 5G MIUI/V12.0.3.0.QGICMXM) (#Build; Redmi; Redmi K30 5G; QKQ1.191222.002 test-keys; 10) +CoolMarket/11.0-2101202'
    };
}

const types = {
    jrrm: { title: '今日热门' },
    dzb: { title: '点赞榜' },
    scb: { title: '收藏榜' },
    plb: { title: '评论榜' },
    ktb: { title: '酷图榜' }
};

const periods = {
    daily: { title: '日榜' },
    weekly: { title: '周榜' }
};

async function getCategories() {
    const list = [];
    for (const [typeId, typeInfo] of Object.entries(types)) {
        const typeNode = {
            id: typeId,
            name: typeInfo.title,
            url: null,
            children: []
        };
        for (const [periodId, periodInfo] of Object.entries(periods)) {
            typeNode.children.push({
                id: `${typeId}|${periodId}`,
                name: periodInfo.title,
                url: null,
                children: []
            });
        }
        list.push(typeNode);
    }
    return list;
}

function getLinkAndTitle(type, period) {
    const baseURL = 'https://api.coolapk.com/v6/page/dataList?url=';
    const typeConfig = {
        jrrm: {
            url: baseURL + '%2Ffeed%2FstatList%3FcacheExpires%3D300%26statType%3Dday%26sortField%3Ddetailnum%26title%3D%E4%BB%8A%E6%97%A5%E7%83%AD%E9%97%A8&title=%E4%BB%8A%E6%97%A5%E7%83%AD%E9%97%A8&subTitle=&page=1'
        },
        dzb: { sortField: 'likenum' },
        scb: { sortField: 'favnum' },
        plb: { sortField: 'replynum' },
        ktb: { sortField: 'likenum' }
    };

    const periodConfig = {
        daily: { description: '日榜', statType: 'day' },
        weekly: { description: '周榜', statType: '7days' }
    };

    if (type === 'jrrm') {
        return { link: typeConfig.jrrm.url, title: types.jrrm.title };
    } else if (type === 'ktb') {
        const trans = {
            daily: { description: '周榜', statDays: '7days' },
            weekly: { description: '月榜', statDays: '30days' }
        };
        const urlPath = `#/feed/coolPictureList?statDays=${trans[period].statDays}&listType=statFavNum&buildCard=1&title=${trans[period].description}&page=1`;
        return {
            link: baseURL + encodeURIComponent(urlPath),
            title: '酷图榜-' + trans[period].description
        };
    } else {
        const urlPath = `#/feed/statList?statType=${periodConfig[period].statType}&sortField=${typeConfig[type].sortField}&title=${periodConfig[period].description}&page=1`;
        return {
            link: baseURL + encodeURIComponent(urlPath),
            title: types[type].title + '-' + periodConfig[period].description
        };
    }
}

async function getFeeds(page, {category, extra, filter}) {
    let type = 'jrrm';
    let period = 'daily';
    
    if (category.id.includes('|')) {
        [type, period] = category.id.split('|');
    } else {
        type = category.id;
    }
    
    const { link } = getLinkAndTitle(type, period);
    
    const response = await axios.get(link, {
        headers: getHeaders()
    });
    
    const data = response.data.data || [];
    
    // 扁平化嵌套数据
    const items = [];
    for (const i of data) {
        if (i.entityType === 'card' && i.entities) {
            for (const k of i.entities) {
                items.push(k);
            }
        } else {
            items.push(i);
        }
    }
    
    const list = items.map(item => {
        if (item.entityType === 'sponsorCard' || !item.url) {
            return null;
        }
        
        const pubDate = parseDate(item.dateline);
        let description = '';
        let title = '';
        
        // 处理消息内容
        if (item.message) {
            description += item.message.replace(/<[^>]+>/g, '');
        }
        
        // 处理图片
        let coverImage = null;
        if (item.picArr && item.picArr.length > 0) {
            const pics = item.picArr.filter(Boolean);
            if (pics.length > 0) coverImage = pics[0];
        }
        
        // 生成标题
        title = item.title || (item.message ? item.message.substring(0, 50) : '');
        if (title.length > 50) {
            title = title.substring(0, 50) + '...';
        }
        
        return {
            type: 'webpage',
            title: title,
            description: description,
            publishTime: pubDate.toISOString(),
            url: `https://www.coolapk.com${item.url}`,
            author: item.username || '',
            coverImage: coverImage
        };
    }).filter(Boolean);
    
    return {
        data: list,
        page: 1,
        totalPage: 1,
        hasMore: false,
        extra: null
    };
}

module.exports = {
    name: "酷安热榜",
    description: "酷安图文热榜。",
    author: "Coolapk",
    logo: "https://www.coolapk.com/favicon.ico",
    siteUrl: "https://www.coolapk.com/",
    version: "1.0.0",
    category: "shuma",
    getCategories,
    getFeeds
};
