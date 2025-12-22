const axios = require('axios');
const dayjs = require('dayjs');

function parseDate(date) {
    return dayjs(parseInt(date)).toDate();
}

function parseToSimpleText(content) {
    if (!content || !Array.isArray(content)) return '';
    
    return content.map(i => {
        if (!i) return '';
        
        switch (i.type) {
            case 'doc':
                return i.content ? parseToSimpleText(i.content).split('\n').map(v => `<p>${v}</p>`).join('') : '';
            case 'text':
                return i.text || '';
            case 'heading':
                if (i.content) {
                    const level = i.attrs?.level || 2;
                    const text = parseToSimpleText(i.content);
                    return `<h${level}>${text}</h${level}>`;
                }
                return '';
            case 'blockquote':
                return i.content ? `<blockquote>${parseToSimpleText(i.content)}</blockquote>` : '';
            case 'image':
                return i.attrs?.src ? `<img src="${i.attrs.src}">` : '';
            case 'codeblock':
                if (i.content) {
                    const lang = i.attrs?.lang || '';
                    const code = parseToSimpleText(i.content);
                    return `<pre><code lang="${lang}">${code}</code></pre>`;
                }
                return '';
            case 'link':
                const href = i.attrs?.href || '';
                const text = i.content ? parseToSimpleText(i.content) : '';
                return `<a href="${href}">${text}</a>`;
            case 'paragraph':
                return i.content ? `<p>${parseToSimpleText(i.content)}</p>` : '';
            default:
                return i.content ? parseToSimpleText(i.content) : '';
        }
    }).join('');
}

async function getCategories() {
    return [
        { id: 'recommend', name: '推荐', url: 'https://www.infoq.cn' }
    ];
}

async function getFeeds(page, {category, extra, filter}) {
    const limit = 30;
    const apiUrl = 'https://www.infoq.cn/public/v1/my/recommond';
    const pageUrl = 'https://www.infoq.cn';
    
    // InfoQ recommend API doesn't seem to support pagination in the original script (it just sends size).
    // We will just fetch the list.
    
    const response = await axios.post(apiUrl, 
        { size: limit },
        {
            headers: {
                'Content-Type': 'application/json',
                'Referer': pageUrl,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }
    );
    
    const list = response.data.data || [];
    
    const items = await Promise.all(
        list.map(async e => {
            const uuid = e.uuid;
            const link = `https://www.infoq.cn/article/${uuid}`;
            let description = '';
            
            try {
                const detailRes = await axios.post('https://www.infoq.cn/public/v1/article/getDetail',
                    { uuid },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Referer': pageUrl,
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    }
                );
                const content = detailRes.data.data.content;
                description = parseToSimpleText(JSON.parse(content));
            } catch (err) {
                description = e.article_summary || '';
            }
            
            return {
                type: 'webpage',
                title: e.article_title,
                description: description,
                url: link,
                pubDate: parseDate(e.publish_time).toISOString(),
                publishTime: parseDate(e.publish_time).toISOString(),
                author: e.author ? e.author[0].nickname : 'InfoQ',
                coverImage: e.cover
            };
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
    name: "InfoQ",
    description: "InfoQ 推荐",
    author: "InfoQ",
    logo: "https://www.infoq.cn/favicon.ico",
    siteUrl: "https://www.infoq.cn",
    version: "1.0.0",
    category: "kaifa",
    getCategories,
    getFeeds
};
