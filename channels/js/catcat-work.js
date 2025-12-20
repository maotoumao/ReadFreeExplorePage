const CHANNEL_ID = "tools.v1v.kinship";

const channel = {
    identifier: CHANNEL_ID,
    name: "猫头猫小工具",
    description: "猫头猫做的小工具合集",
    version: "1.0.0",
    allowDuplicate: false,
    async getFeeds() {
        const data = [{
            id: "http://tools.v1v.fun/kinship/",
            title: "亲戚计算器",
            description: "还在发愁怎么称呼你的亲戚吗？试试这个亲戚计算器吧~",
            url: "http://tools.v1v.fun/kinship/",
            type: "webpage"
        }];
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
