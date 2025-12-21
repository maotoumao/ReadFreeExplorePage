const axios = require('axios');
const dayjs = require('dayjs');

function parseDate(date) {
    return dayjs.unix(parseInt(date)).toDate();
}

const categoryMap = {
    android: { id: '6809637767543259144', name: 'Android' },
    frontend: { id: '6809637767543259142', name: '前端' },
    ios: { id: '6809637767543259140', name: 'iOS' },
    backend: { id: '6809637767543259144', name: '后端' },
    design: { id: '6809637769959178254', name: '设计' },
    product: { id: '6809637769959178254', name: '产品' },
    freebie: { id: '6809637767543259139', name: '工具资源' },
    article: { id: '6809637767543259146', name: '阅读' },
    ai: { id: '6809637773935378440', name: '人工智能' },
    devops: { id: '6809637769959178254', name: '运维' },
    all: { id: '', name: '全部' }
};

const typeMap = {
    monthly: { title: '本月', sort_type: 30 },
    weekly: { title: '本周', sort_type: 7 },
    historical: { title: '历史', sort_type: 0 }
};

async function getCategories() {
    return Object.entries(categoryMap).map(([id, cat]) => ({
        id: id,
        name: cat.name,
        url: `https://juejin.cn/${id === 'all' ? '' : id}`,
        children: Object.entries(typeMap).map(([typeId, type]) => ({
            id: `${id}/${typeId}`,
            name: type.title,
            url: `https://juejin.cn/${id === 'all' ? '' : id}?sort=${typeId}`
        }))
    }));
}

async function getFeeds(page, {category, extra, filter}) {
    let catId = category.id;
    let typeId = 'weekly';
    
    if (catId.includes('/')) {
        [catId, typeId] = catId.split('/');
    }
    
    const cat = categoryMap[catId] || categoryMap.all;
    const typeInfo = typeMap[typeId] || typeMap.weekly;
    
    let url = 'https://api.juejin.cn/recommend_api/v1/article/recommend_all_feed';
    const body = {
        cursor: '0',
        id_type: 2,
        limit: 20,
        sort_type: typeInfo.sort_type,
    };
    
    if (catId !== 'all' && cat.id) {
        url = 'https://api.juejin.cn/recommend_api/v1/article/recommend_cate_feed';
        body.cate_id = cat.id;
    }
    
    const response = await axios.post(url, body, {
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    let entrylist = response.data.data || [];
    
    if (catId === 'all' || catId === 'devops' || catId === 'product' || catId === 'design') {
        entrylist = entrylist.filter(item => item.item_type === 2).map(item => item.item_info);
    }
    
    const items = entrylist.map(item => {
        const isArticle = !!item.article_info;
        const info = isArticle ? item.article_info : (item.content_info || {});
        const authorInfo = item.author_user_info || {};
        
        return {
            type: 'webpage',
            title: info.title || '',
            description: info.brief_content || info.brief || '',
            pubDate: parseDate(info.ctime || 0).toISOString(),
            publishTime: parseDate(info.ctime || 0).toISOString(),
            author: authorInfo.user_name || '',
            url: `https://juejin.cn${isArticle ? `/post/${item.article_id}` : `/news/${item.content_id}`}`,
            coverImage: info.cover_image
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
    name: "Juejin Trending",
    description: "掘金热门文章",
    author: "Juejin",
    logo: "https://juejin.cn/favicon.ico",
    siteUrl: "https://juejin.cn",
    version: "1.0.0",
    category: "kaifa",
    getCategories,
    getFeeds
};
