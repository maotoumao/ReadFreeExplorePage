const axios = require('axios');

const M3U_URLS = [
    'https://gh-proxy.org/https://raw.githubusercontent.com/Guovin/iptv-api/gd/output/ipv4/result.m3u',
    'https://hk.gh-proxy.org/https://raw.githubusercontent.com/Guovin/iptv-api/gd/output/ipv4/result.m3u',
    'https://cdn.gh-proxy.org/https://raw.githubusercontent.com/Guovin/iptv-api/gd/output/ipv4/result.m3u',
    'https://edgeone.gh-proxy.org/https://raw.githubusercontent.com/Guovin/iptv-api/gd/output/ipv4/result.m3u'
];

let cachedM3u = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

async function fetchM3u() {
    const now = Date.now();
    if (cachedM3u && (now - lastFetchTime < CACHE_DURATION)) {
        return cachedM3u;
    }
    
    let lastError = null;
    for (const url of M3U_URLS) {
        try {
            console.log(`Trying to fetch IPTV M3U from: ${url}`);
            const response = await axios.get(url, {
                timeout: 30000 // Increase timeout for large file
            });
            cachedM3u = response.data;
            lastFetchTime = now;
            return cachedM3u;
        } catch (e) {
            console.error(`Failed to fetch from ${url}:`, e.message);
            lastError = e;
            // Continue to next mirror
        }
    }

    if (cachedM3u) {
        console.warn("All mirrors failed, returning stale cache.");
        return cachedM3u;
    }
    
    throw lastError || new Error("All IPTV mirrors failed.");
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
    
    // Filter out "更新时间"
    groups.delete('🕘️更新时间');

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
    
    // Group by title to merge duplicates
    const grouped = {};
    for (const item of filtered) {
        if (!grouped[item.title]) {
            grouped[item.title] = [];
        }
        grouped[item.title].push(item);
    }
    
    const feeds = Object.keys(grouped).map(title => {
        const items = grouped[title];
        const first = items[0];
        
        return {
            type: 'video',
            title: title,
            description: items.map(i => i.url).join('\n'),
            url: first.url,
            coverImage: first.logo,
            author: 'IPTV',
            publishTime: new Date().toISOString(),
            extra: {
                sources: items
            }
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
        sources: (feed.extra?.sources || []).map((source, index) => ({
            label: `源 ${index + 1}`,
            url: source.url
        }))
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
