const axios = require('axios');
const dayjs = require('dayjs');

function sec2str(sec) {
    const seconds = parseInt(sec, 10);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [];
    if (h > 0) parts.push(`${h} hours`);
    if (m > 0) parts.push(`${m} minutes`);
    if (s > 0) parts.push(`${s} seconds`);
    return parts.join(' ');
}

async function getCategories() {
    return [{
        id: 'default',
        name: 'Upcoming Contests',
        url: null,
        children: []
    }];
}

async function getFeeds(page, {category, extra, filter}) {
  const contestAPI = 'https://codeforces.com/api/contest.list';
  
  const response = await axios.get(contestAPI);
  const contests = response.data.result || [];
  
  const list = contests
    .filter(contest => contest.phase === 'BEFORE')
    .map(contest => {
      const title = String(contest.name);
      const date = dayjs.unix(parseInt(contest.startTimeSeconds, 10));
      
      const description = `比赛名称：${title}\n开始时间：${date.format('LL LT')}\n比赛时长：${sec2str(contest.durationSeconds)}\n比赛类型：${contest.type}`;
      
      return {
        type: 'webpage',
        title: title,
        description: description,
        url: `https://codeforces.com/contests/${contest.id}`,
        publishTime: date.toISOString(),
        author: 'Codeforces',
        coverImage: null
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
    name: "Codeforces Contests",
    description: "Codeforces 即将开始的比赛。",
    author: "Codeforces",
    logo: "https://codeforces.com/favicon.ico",
    siteUrl: "https://codeforces.com/contests",
    version: "1.0.0",
    category: "kaifa",
    getCategories,
    getFeeds
};
