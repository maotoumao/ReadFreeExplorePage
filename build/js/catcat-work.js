const CHANNEL_ID = "tools.v1v.kinship";

const channel = {
    identifier: CHANNEL_ID,
    name: "猫头猫小工具",
    description: "猫头猫做的小工具合集",
    version: "1.0.0",
    category: "ruanjian",
    allowDuplicate: false,
    getCategories(){
        return [{
            id: "default",
            name: "默认",
            type: "social"
        }]
    },
    async getFeeds() {
        const data = [{
            id: "http://musicfree.catcat.work",
            title: "MusicFree 官方站点",
            description: "https://musicfree.catcat.work",
            url: "https://musicfree.catcat.work",
            coverImage: "https://musicfree.catcat.work/img/logo.png",
            type: "webpage"
        },{
            id: "http://tools.v1v.fun/kinship/",
            title: "亲戚计算器",
            description: "还在发愁怎么称呼你的亲戚吗？试试这个亲戚计算器吧~",
            url: "http://tools.v1v.fun/kinship/",
            coverImage: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMjE5NkYzIi8+CjxyZWN0IHg9IjIwIiB5PSIzMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjUwIiByeD0iNSIgZmlsbD0id2hpdGUiIHN0cm9rZT0iIzAwNzZBRiIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik0zNSA0MEg2NUw2OCAzNUgzMkwzNSA0MFoiIGZpbGw9IiMwMDc2QUYiLz4KPHJlY3QgeD0iMzAiIHk9IjQ1IiB3aWR0aD0iMTAiIGhlaWdodD0iMzAiIGZpbGw9IiNGRkMxMDciLz4KPHJlY3QgeD0iNjAiIHk9IjQ1IiB3aWR0aD0iMTAiIGhlaWdodD0iMzAiIGZpbGw9IiNGRkMxMDciLz4KPGNpcmNsZSBjeD0iNTAiIGN5PSI2MCIgcj0iOCIgZmlsbD0iIzQxRDU5NCIvPgo8L3N2Zz4K",
            type: "webpage"
        },];
        return {
            data,
            hasMore: false
        };
    },
    async getFeedDetail(feed) {
        return {
            url: feed.url
        }
    }
};

module.exports = channel;
