const axios = require('axios');
const dayjs = require('dayjs');

function parseDate(date) {
    return dayjs(date).toDate();
}

function md2html(text) {
    if (!text) return '';
    return text
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        .replace(/\n/g, '<br>');
}

const REPOS = [
    { user: 'Microsoft', repo: 'vscode', name: 'VS Code' },
    { user: 'facebook', repo: 'react', name: 'React' },
    { user: 'vuejs', repo: 'core', name: 'Vue 3' },
    { user: 'golang', repo: 'go', name: 'Go' },
    { user: 'rust-lang', repo: 'rust', name: 'Rust' }
];

async function getCategories() {
    return REPOS.map(r => ({
        id: `${r.user}/${r.repo}`,
        name: r.name,
        url: `https://github.com/${r.user}/${r.repo}`,
        children: [
            { id: `${r.user}/${r.repo}/open`, name: 'Open Issues', url: `https://github.com/${r.user}/${r.repo}/issues?q=is%3Aopen` },
            { id: `${r.user}/${r.repo}/closed`, name: 'Closed Issues', url: `https://github.com/${r.user}/${r.repo}/issues?q=is%3Aclosed` }
        ]
    }));
}

async function getFeeds(page, {category, extra, filter}) {
    const [user, repo, state] = category.id.split('/');
    const issueState = state || 'open';
    const limit = 30;
    
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'RSSHub-Local'
    };
    
    const params = {
        state: issueState,
        sort: 'created',
        direction: 'desc',
        per_page: limit,
        page: page
    };
    
    const response = await axios.get(
        `https://api.github.com/repos/${user}/${repo}/issues`,
        { headers, params }
    );
    
    const items = response.data
        .filter(item => !item.pull_request)
        .map(item => ({
            type: 'webpage',
            title: item.title,
            link: `https://github.com/${user}/${repo}/issues/${item.number}`,
            url: `https://github.com/${user}/${repo}/issues/${item.number}`,
            pubDate: parseDate(item.created_at).toISOString(),
            author: item.user.login,
            description: item.body ? md2html(item.body) : 'No description',
            publishTime: parseDate(item.created_at).toISOString()
        }));
    
    return {
        data: items,
        page: page,
        totalPage: 10, // GitHub API pagination is link-header based, but we can assume some pages
        hasMore: items.length === limit,
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
    name: "GitHub Issues",
    description: "GitHub 仓库 Issues",
    author: "GitHub",
    logo: "https://github.githubassets.com/favicons/favicon.svg",
    siteUrl: "https://github.com",
    version: "1.0.0",
    category: "kaifa",
    getCategories,
    getFeeds
};
