const axios = require('axios');
const categories = {
    '': '全部',
    'fiction': '虚构类',
    'nonfiction': '非虚构类'
};

async function getCategories() {
    return Object.entries(categories).map(([id, name]) => ({
        id: id,
        name: name,
        url: null,
        children: []
    }));
}

async function getFeeds(page, {category, extra, filter}) {
    const type = category.id;
    const referer = `https://m.douban.com/book/${type}`;

    const fetchBooks = async (bookType) => {
        const response = await axios.get(
            `https://m.douban.com/rexxar/api/v2/subject_collection/book_${bookType}/items?start=0&count=10`,
            {
                headers: {
                    'Referer': referer,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            }
        );
        return response.data.subject_collection_items;
    };

    let items;
    if (type) {
        items = await fetchBooks(type);
    } else {
        // 获取虚构和非虚构两种类型
        const [fiction, nonfiction] = await Promise.all([
            fetchBooks('fiction'),
            fetchBooks('nonfiction')
        ]);
        items = [...fiction, ...nonfiction];
    }

    const list = items.map(({ title, url, cover, info, rating, null_rating_reason }) => {
        const rate = rating ? `${rating.value.toFixed(1)}分` : null_rating_reason;
        const coverUrl = cover ? cover.url : null;
        const description = `${title}/${info}/${rate}`;

        return {
            type: 'webpage',
            title: `${title}-${info}`,
            description: description,
            url: url,
            coverImage: coverUrl,
            author: 'Douban',
            publishTime: new Date().toISOString()
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
    name: "豆瓣热门图书",
    description: "豆瓣热门图书排行榜。",
    author: "Douban",
    logo: "https://img3.doubanio.com/favicon.ico",
    siteUrl: "https://m.douban.com/book/",
    version: "1.0.0",
    category: "yuedu",
    getCategories,
    getFeeds
};
