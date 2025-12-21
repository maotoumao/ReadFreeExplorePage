const axios = require('axios');
const dayjs = require('dayjs');

function parseDate(dateStr) {
    // Format: YYYYMMDD_HHmm
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(9, 11);
    const minute = dateStr.substring(11, 13);
    return new Date(year, month - 1, day, hour, minute);
}

const allowedTypes = ['1920x1080', 'UHD', '1920x1200', '768x1366', '1080x1920', '1080x1920_logo'];

async function getCategories() {
    return [
        {
            id: 'zh',
            name: '中国 (zh-CN)',
            url: null,
            children: allowedTypes.map(type => ({
                id: `zh|${type}`,
                name: type,
                url: null,
                children: []
            }))
        },
        {
            id: 'en',
            name: 'International (en-US)',
            url: null,
            children: allowedTypes.map(type => ({
                id: `en|${type}`,
                name: type,
                url: null,
                children: []
            }))
        }
    ];
}

async function getFeeds(page, {category, extra, filter}) {
    let lang = 'zh';
    let type = '1920x1080';
    
    if (category.id.includes('|')) {
        [lang, type] = category.id.split('|');
    } else {
        lang = category.id;
    }
    
    let apiUrl;
    let mtk;
    if (lang === 'en') {
        mtk = 'en-US';
        apiUrl = 'https://www.bing.com';
    } else {
        mtk = 'zh-CN';
        apiUrl = 'https://cn.bing.com';
    }
    
    const response = await axios.get(`${apiUrl}/hp/api/model`, {
        params: {
            mtk: mtk
        },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    const list = (response.data.MediaContents || []).map(item => {
        const ssd = item.Ssd;
        const imageContent = item.ImageContent || {};
        const image = imageContent.Image || {};
        
        // 提取图片链接
        const urlMatch = image.Url?.match(/\/th\?id=[^_]+_[^_]+/);
        const link = urlMatch ? `${apiUrl}${urlMatch[0].replace(/(_\d+x\d+\.webp)$/i, '')}_${type}.jpg` : '';
        
        let description = '';
        if (imageContent.Headline) {
            description += `${imageContent.Headline}\n`;
        }
        if (imageContent.QuickFact?.MainText) {
            description += `${imageContent.QuickFact.MainText}\n`;
        }
        if (imageContent.Description) {
            description += `${imageContent.Description}`;
        }
        
        return {
            type: 'image',
            title: imageContent.Title || 'Bing Wallpaper',
            description: description,
            url: link, // The image itself is the content
            coverImage: link,
            author: imageContent.Copyright || 'Bing',
                        pubDate: ssd ? parseDate(ssd).toISOString() : new Date().toISOString()
        };
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
    name: "Bing 每日壁纸",
    description: "Bing 每日壁纸更新。",
    author: "Microsoft",
    logo: "https://cn.bing.com/favicon.ico",
    siteUrl: "https://cn.bing.com/",
    version: "1.0.0",
    category: "shenghuo",
    getCategories,
    getFeeds
};
