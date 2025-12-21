const axios = require('axios');
const dayjs = require('dayjs');

function parseDate(timestamp) {
    return dayjs(timestamp).toDate();
}

async function getCategories() {
    return [
        { id: '0', name: '全部', url: 'https://www.nowcoder.com/school/schedule' },
        { id: '1', name: '互联网', url: 'https://www.nowcoder.com/school/schedule?propertyId=1' },
        { id: '2', name: '金融', url: 'https://www.nowcoder.com/school/schedule?propertyId=2' }
    ];
}

async function getFeeds(page, {category, extra, filter}) {
    const propertyId = category.id;
    const typeId = '0'; // Default to all types
    
    const link = `https://www.nowcoder.com/school/schedule/data?token=&query=&typeId=${typeId}&propertyId=${propertyId}&onlyFollow=false&_=${Date.now()}`;
    
    const response = await axios.get(link, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    const responseBody = response.data;
    
    if (responseBody.code !== 0) {
        throw new Error(`接口错误，错误代码:${responseBody.code},错误原因:${responseBody.msg}`);
    }
    
    const data = responseBody.data.companyList;
    
    const items = data.map((item) => {
        let desc = `<tr><td><img src="${item.logo}" referrerpolicy="no-referrer"></td></tr>`;
        for (const each of item.schedules) {
            desc += `<tr><td>${each.content}</td><td>${each.time}</td></tr>`;
        }
        
        return {
            type: 'webpage',
            title: item.name,
            description: `<table>${desc}</table>`,
            pubDate: parseDate(item.createTime).toISOString(),
            publishTime: parseDate(item.createTime).toISOString(),
            url: `https://www.nowcoder.com/school/schedule/${item.id}`,
            coverImage: item.logo
        };
    });
    
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
        content: feed.url,
    };
}

module.exports = {
    getFeedDetail,
    name: "Nowcoder Schedule",
    description: "牛客网校招日程",
    author: "Nowcoder",
    logo: "https://www.nowcoder.com/favicon.ico",
    siteUrl: "https://www.nowcoder.com",
    version: "1.0.0",
    category: "kaifa",
    getCategories,
    getFeeds
};
