var _ = {};

function load() {
    // 动态加载 cheerio
    if (!_.cheerio) {
        _.cheerio = require("cheerio");
    }
    return _;
}

const CHANNEL_ID = "blog.catcat.work";

const channel = {
    identifier: CHANNEL_ID,
    name: "猫头猫的博客",
    description: "猫头猫的个人博客",
    siteUrl: "https://blog.catcat.work/",
    version: "1.0.0",
    category: "boke",
    allowDuplicate: false,
    async getFeeds(page, args) {
        load();
        const $ = _.cheerio;
        
        let url = "https://blog.catcat.work/archives/";
        if (page > 1) {
            url = `https://blog.catcat.work/archives/page/${page}/`;
        }
        
        try {
            const response = await fetch(url);
            const html = await response.text();
            const $doc = $.load(html);
            
            const feeds = [];
            
            $doc("article[itemscope]").each((i, el) => {
                const $el = $doc(el);
                const titleElement = $el.find(".post-title-link");
                const title = titleElement.text().trim();
                const href = titleElement.attr("href");
                const date = $el.find("time").attr("datetime");
                
                if (title && href) {
                    const fullUrl = new URL(href, "https://blog.catcat.work").toString();
                    feeds.push({
                        id: fullUrl,
                        title: title,
                        url: fullUrl,
                        createdTime: date,
                        author: "猫头猫",
                        type: "article"
                    });
                }
            });
            
            const hasMore = $doc(".pagination .next").length > 0;
            
            return {
                data: feeds,
                hasMore: hasMore
            };
        } catch (e) {
            console.error(e);
            return {
                data: [],
                hasMore: false,
                error: e.message
            };
        }
    },
    
    async getFeedDetail(feed) {
        load();
        const $ = _.cheerio;
        
        try {
            const response = await fetch(feed.url);
            const html = await response.text();
            const $doc = $.load(html);

               // 处理 Hexo/Next 主题的代码块
            $doc("figure.highlight").each((i, el) => {
                const $figure = $doc(el);
                const classes = $figure.attr("class").split(/\s+/);
                let lang = "plaintext";
                // 通常结构是 highlight language-name 或 highlight name
                if (classes.length > 1) {
                    lang = classes[1];
                }

                const lines = [];
                $figure.find("td.code .line").each((j, line) => {
                    lines.push($doc(line).text());
                });
                
                // 如果没有找到 .line，尝试直接获取 pre 的文本
                let codeText = "";
                if (lines.length > 0) {
                    codeText = lines.join("\n");
                } else {
                    codeText = $figure.find("td.code pre").text();
                }

                // 简单的 HTML 转义
                const escapeHtml = (unsafe) => {
                    return unsafe
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#039;");
                };

                const newHtml = `<pre><code class="language-${lang}">${escapeHtml(codeText)}</code></pre>`;
                $figure.replaceWith(newHtml);
            });
            
            const content = $doc(".post-body").html();
            const title = $doc(".post-title").text().trim();
            const date = $doc("time[itemprop='dateCreated']").attr("datetime");
            const author = $doc(".site-author-name").text().trim();
            
            return {
                content: content,
                title: title,
                createdTime: date,
                author: author,
                type: "html"
            };
        } catch (e) {
            console.error(e);
            return {
                content: "Error loading content: " + e.message
            };
        }
    }
};

module.exports = channel;
