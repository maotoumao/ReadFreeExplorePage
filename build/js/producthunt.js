const axios = require('axios');
const cheerio = require('cheerio');
const dayjs = require('dayjs');

function parseDate(date) {
    return dayjs(date).toDate();
}

async function getCategories() {
    return [
        { id: 'today', name: 'Today Popular', url: 'https://www.producthunt.com/' }
    ];
}

async function getFeeds(page, {category, extra, filter}) {
    const response = await axios.get('https://www.producthunt.com/', {
        headers: {
            'User-Agent': 'RSSHub/1.0 (+http://github.com/DIYgod/RSSHub; like FeedFetcher-Google)'
        }
    });
    
    const $ = cheerio.load(response.data);
    const scriptText = $('script:contains("ApolloSSRDataTransport")').text();
    const match = scriptText.match(/"events":(\[.+\])\}\)/);
    
    if (!match) {
        throw new Error('无法解析页面数据');
    }
    
    const data = JSON.parse(match[1].trim().replace(/undefined/g, 'null'));
    
    const homefeedEvent = data.find(event => event.type === 'next' && event.value?.data?.homefeed);
    if (!homefeedEvent) {
        throw new Error('无法找到 homefeed 数据');
    }
    
    const todayEdge = homefeedEvent.value.data.homefeed.edges.find(edge => edge.node.id === 'FEATURED-0');
    if (!todayEdge) {
        throw new Error('无法找到今日产品');
    }
    
    const items = todayEdge.node.items
        .filter(i => i.__typename === 'Post')
        .map(item => {
            let description = `<p>${item.tagline}</p>`;
            if (item.thumbnailImageUuid) {
                description = `<img src="https://ph-files.imgix.net/${item.thumbnailImageUuid}"><br>` + description;
            }
            
            return {
                type: 'webpage',
                title: item.name,
                url: `https://www.producthunt.com/products/${item.product.slug}`,
                description: description,
                pubDate: parseDate(item.createdAt).toISOString(),
                publishTime: parseDate(item.createdAt).toISOString(),
                category: item.topics?.edges?.map(topic => topic.node.name) || [],
                coverImage: item.thumbnailImageUuid ? `https://ph-files.imgix.net/${item.thumbnailImageUuid}` : null
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
        type: "webpage"
    };
}

module.exports = {
    getFeedDetail,
    name: "Product Hunt",
    description: "Product Hunt 今日热门",
    author: "Product Hunt",
    logo: "https://www.producthunt.com/favicon.ico",
    siteUrl: "https://www.producthunt.com",
    version: "1.0.0",
    getCategories,
    getFeeds
};
