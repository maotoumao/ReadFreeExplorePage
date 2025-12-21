const axios = require('axios');
const cheerio = require('cheerio');
const dayjs = require('dayjs');

function parseDate(date) {
    return dayjs(date).toDate();
}

const sections = {
    'index': 'Top',
    'newest': 'New',
    'best': 'Best',
    'ask': 'Ask',
    'show': 'Show',
    'jobs': 'Jobs'
};

async function getCategories() {
    return Object.entries(sections).map(([id, name]) => ({
        id: id,
        name: name,
        url: null,
        children: []
    }));
}

async function getFeeds(page, {category, extra, filter}) {
    const section = category.id;
    const limit = 30;
    
    const rootUrl = 'https://news.ycombinator.com';
    const sectionUrl = section === 'index' ? '' : '/' + section;
    const currentUrl = rootUrl + sectionUrl;
    
    const response = await axios.get(currentUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    const $ = cheerio.load(response.data);
    
    const list = [];
    $('.athing').slice(0, limit).each((i, thing) => {
        const $thing = $(thing);
        const $subtext = $thing.next();
        
        const id = $thing.attr('id');
        const titleEl = $thing.find('.titleline > a').first();
        const title = titleEl.text();
        const origin = titleEl.attr('href');
        const author = $subtext.find('.hnuser').text();
        const ageTitle = $thing.find('.age').attr('title') || $subtext.find('.age').attr('title');
        const score = $subtext.find('.score').text();
        const commentsText = $subtext.find('a').last().text();
        
        const link = origin && origin.startsWith('http') ? origin : `${rootUrl}/item?id=${id}`;
        
        const description = `Score: ${score} | ${commentsText}`;
        
        list.push({
            type: 'webpage',
            title: title,
            description: description,
            url: link,
            coverImage: null,
            author: author,
            publishTime: ageTitle ? parseDate(ageTitle).toISOString() : new Date().toISOString()
        });
    });
    
    return {
        data: list,
        page: 1,
        totalPage: 1,
        hasMore: false,
        extra: null
    };
}

module.exports = {
    name: "Hacker News",
    description: "Hacker News 科技新闻。",
    author: "YCombinator",
    logo: "https://news.ycombinator.com/favicon.ico",
    siteUrl: "https://news.ycombinator.com/",
    version: "1.0.0",
    category: "keji",
    getCategories,
    getFeeds
};
