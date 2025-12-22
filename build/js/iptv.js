const axios = require('axios');

const M3U_URL = 'https://gh-proxy.org/https://raw.githubusercontent.com/Guovin/iptv-api/gd/output/ipv4/result.m3u';

let cachedM3u = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

async function fetchM3u() {
    const now = Date.now();
    if (cachedM3u && (now - lastFetchTime < CACHE_DURATION)) {
        return cachedM3u;
    }
    
    try {
        const response = await axios.get(M3U_URL, {
            timeout: 30000 // Increase timeout for large file
        });
        cachedM3u = response.data;
        lastFetchTime = now;
        return cachedM3u;
    } catch (e) {
        console.error("Failed to fetch IPTV M3U:", e.message);
        if (cachedM3u) return cachedM3u; // Return stale cache if available
        throw e;
    }
}

function parseM3u(content) {
    const lines = content.split('\n');
    const items = [];
    let currentItem = {};
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        if (line.startsWith('#EXTINF:')) {
            // Parse metadata
            const info = line.substring(8);
            const parts = info.split(',');
            const title = parts[parts.length - 1].trim();
            
            // Extract attributes
            const groupTitleMatch = info.match(/group-title="([^"]*)"/);
            const logoMatch = info.match(/tvg-logo="([^"]*)"/);
            
            currentItem = {
                title: title,
                group: groupTitleMatch ? groupTitleMatch[1] : '其他频道',
                logo: logoMatch ? logoMatch[1] : null
            };
        } else if (!line.startsWith('#')) {
            // URL line
            if (currentItem.title) {
                currentItem.url = line;
                items.push(currentItem);
                currentItem = {};
            }
        }
    }
    return items;
}

async function getCategories() {
    const content = await fetchM3u();
    const items = parseM3u(content);
    const groups = new Set(items.map(i => i.group));
    
    // Filter out "更新时间" if present, or keep it? User didn't say.
    // Usually it's not a channel group.
    
    return Array.from(groups).map(g => ({
        id: g,
        name: g,
        type: 'media',
        url: null,
        children: []
    }));
}

async function getFeeds(page, {category}) {
    const content = await fetchM3u();
    const items = parseM3u(content);
    
    let filtered = items;
    if (category && category.id) {
        filtered = items.filter(i => i.group === category.id);
    }
    
    // Handle duplicates by appending index
    const titleCounts = {};
    const feeds = filtered.map(item => {
        let title = item.title;
        if (!titleCounts[title]) {
            titleCounts[title] = 1;
        } else {
            titleCounts[title]++;
            title = `${title} (${titleCounts[title]})`;
        }
        
        return {
            type: 'video',
            title: title,
            description: item.url,
            url: item.url,
            coverImage: item.logo,
            author: 'IPTV',
            publishTime: new Date().toISOString()
        };
    });
    
    return {
        data: feeds,
        page: 1,
        totalPage: 1,
        hasMore: false,
        extra: null
    };
}

async function getFeedDetail(feed) {
    return {
        url: feed.url
    };
}

module.exports = {
    name: "IPTV 直播",
    description: "电视直播频道，包含央视、卫视等。",
    author: "Guovin",
    logo: "https://raw.githubusercontent.com/Guovin/iptv-api/master/output/favicon.ico",
    siteUrl: "https://github.com/Guovin/iptv-api",
    version: "1.0.0",
    category: "yule",
    getCategories,
    getFeeds,
    getFeedDetail
};
