const axios = require('axios');

const headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
    'Referer': 'https://mp.weixin.qq.com/'
};

module.exports = {
    identifier: "musicfree.update",
    name: "MusicFree 更新",
    description: "MusicFree 软件更新日志",
    version: "0.0.1",
    category: "ruanjian",
    author: "Copilot",
    
    async getCategories() {
        return [{
            id: "default",
            name: "默认"
        }];
    },

    async getFeeds(page, {category, extra, filter}) {
        let url;
        if (page === 1 || !extra || !extra.nextMsgId) {
             // Use getalbum for the first page to get the latest items
             url = `https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzkxOTM5MDI4MA==&action=getalbum&album_id=2704033084660498433&f=json`;
        } else {
             // Use paging for subsequent pages
             const beginMsgId = extra.nextMsgId;
             url = `https://mp.weixin.qq.com/mp/appmsgalbum?action=paging&__biz=MzkxOTM5MDI4MA==&album_id=2704033084660498433&begin_msgid=${beginMsgId}&begin_itemidx=1&count=10&uin=&key=&pass_ticket=&wxtoken=777&devicetype=&clientversion=false&version=false&__biz=MzkxOTM5MDI4MA%3D%3D&appmsg_token=&x5=0&f=json&user_article_role=0`;
        }

        const response = await axios.get(url, { headers });
        const data = response.data;

        if (!data.getalbum_resp || !data.getalbum_resp.article_list) {
            throw new Error('Invalid response');
        }

        const articles = data.getalbum_resp.article_list;
        const feeds = articles.map(item => ({
            id: item.msgid + '',
            title: item.title,
            coverImage: {
                url: item.cover_img_1_1
            },
            createdTime: new Date(item.create_time * 1000).toISOString(),
            publishTime: new Date(item.create_time * 1000).toISOString(),
            url: item.url,
            type: 'webpage'
        }));

        const lastItem = articles[articles.length - 1];
        const nextMsgId = lastItem ? lastItem.msgid : null;
        const hasMore = data.getalbum_resp.continue_flag === 1 || data.getalbum_resp.continue_flag === "1";

        return {
            data: feeds,
            hasMore: hasMore,
            extra: { nextMsgId: nextMsgId }
        };
    },

    async getFeedDetail(feed) {
        return {
            url: feed.url
        };
    }
}
