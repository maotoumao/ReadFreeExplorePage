const cheerio = require("cheerio");

const CHANNEL_ID = "avenuebeads";
const BASE_URL = "https://www.avenuebeads.com";

const channel = {
    indentifier: CHANNEL_ID,
    name: "片多多",
    description: "片多多影视插件",
    siteUrl: BASE_URL,
    version: "1.0.0",
    category: "yule",
    supportedFeatures: [
        "GetCategories",
        "GetFeeds",
        "GetFeedDetail",
        "GetVideoResource"
    ],

    async getCategories() {
        return [
            { id: "1", name: "电影", type: "media" },
            { id: "2", name: "电视剧", type: "media" },
            { id: "3", name: "短剧", type: "media" },
            { id: "4", name: "动漫", type: "media" },
            { id: "5", name: "综艺", type: "media" }
        ];
    },

    async getFeeds(page, {category, extra, filter}) {
        const categoryId = category ? category.id : "2";
        const url = `${BASE_URL}/show/${categoryId}/page/${page}.html`;
        
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const feeds = [];
        $(".fed-list-item").each((i, el) => {
            const $el = $(el);
            const title = $el.find(".fed-list-title").text().trim();
            const href = $el.find(".fed-list-title").attr("href");
            const cover = $el.find(".fed-list-pics").attr("data-original");
            const remarks = $el.find(".fed-list-remarks").text().trim();
            const actors = $el.find(".fed-list-desc").text().trim();

            if (title && href) {
                feeds.push({
                    id: href,
                    title: title,
                    subTitle: remarks,
                    description: actors,
                    coverImage: cover ? (cover.startsWith("http") ? cover : BASE_URL + cover) : null,
                    url: BASE_URL + href,
                    type: "video"
                });
            }
        });

        const hasMore = $(".fed-page-info a:contains('下一页')").length > 0;

        return {
            data: feeds,
            page: page,
            hasMore: hasMore
        };
    },

    async getFeedDetail(feed) {
        const response = await fetch(feed.url);
        const html = await response.text();
        const $ = cheerio.load(html);

        const lineNames = [];
        $(".fed-conv-play .fed-tabs-foot").first().find("li a").each((i, el) => {
            lineNames.push($(el).text().trim());
        });

        const episodesMap = new Map(); // title -> { title, extra: { lines: [{ name, url }] } }

        $(".fed-conv-play ul.fed-tabs-btm").each((lineIdx, ul) => {
            const lineName = lineNames[lineIdx] || `线路${lineIdx + 1}`;
            $(ul).find("li a").each((i, el) => {
                const $el = $(el);
                const title = $el.text().trim();
                const href = $el.attr("href");
                
                if (title && href && !title.includes("下载APP")) {
                    if (!episodesMap.has(title)) {
                        episodesMap.set(title, {
                            title: title,
                            extra: {
                                lines: []
                            }
                        });
                    }
                    episodesMap.get(title).extra.lines.push({
                        name: lineName,
                        url: BASE_URL + href
                    });
                }
            });
        });

        return {
            poster: feed.coverImage ? feed.coverImage.url : null,
            episodes: Array.from(episodesMap.values())
        };
    },

    async getVideoResource(feed, extra) {
        if (!extra || !extra.lines || extra.lines.length === 0) {
            return { sources: [] };
        }

        const sources = [];
        
        // 并行获取所有线路的资源
        const results = await Promise.all(extra.lines.map(async (line) => {
            try {
                const response = await fetch(line.url);
                const html = await response.text();
                const playerMatch = html.match(/var player_aaaa=(.*?)</);
                if (playerMatch) {
                    const playerConfig = JSON.parse(playerMatch[1]);
                    let videoUrl = playerConfig.url;
                    
                    if (playerConfig.encrypt == 1) {
                        videoUrl = unescape(videoUrl);
                    } else if (playerConfig.encrypt == 2) {
                        videoUrl = unescape(atob(videoUrl));
                    }

                    if (videoUrl) {
                        return {
                            url: videoUrl,
                            label: line.name,
                        };
                    }
                }
            } catch (e) {
                // ignore
            }
            return null;
        }));

        results.forEach(s => {
            if (s) sources.push(s);
        });

        return {
            sources: sources
        };
    }
};

module.exports = channel;
