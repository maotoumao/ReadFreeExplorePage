const axios = require('axios');

const HOST = 'https://leetcode.com';

const DIFFICULTY_EMOJI = {
  Medium: '🟡',
  Easy: '🟢',
  Hard: '🔴'
};

async function getCategories() {
    return [
        { id: 'daily', name: 'Daily Question', url: 'https://leetcode.com/problemset/all/' }
    ];
}

async function getFeeds(page, {category, extra, filter}) {
    const graphqlUrl = `${HOST}/graphql`;
    
    // 获取每日一题
    const dailyQuestionPayload = {
        query: `query questionOfToday {
            activeDailyCodingChallengeQuestion {
                date
                link
                question {
                    frontendQuestionId: questionFrontendId
                    titleSlug
                }
            }
        }`,
        variables: {}
    };
    
    const dailyResponse = await axios.post(graphqlUrl, dailyQuestionPayload, {
        headers: { 'content-type': 'application/json' }
    });
    
    const dailyData = dailyResponse.data.data.activeDailyCodingChallengeQuestion;
    const questionDate = dailyData.date;
    const questionLink = HOST + dailyData.link;
    const titleSlug = dailyData.question.titleSlug;
    
    // 获取题目详情
    const detailsPayload = {
        operationName: 'questionData',
        query: `query questionData($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
                questionId
                questionFrontendId
                title
                titleSlug
                content
                translatedTitle
                translatedContent
                difficulty
                topicTags {
                    name
                    slug
                    translatedName
                }
            }
        }`,
        variables: { titleSlug }
    };
    
    const detailsResponse = await axios.post(graphqlUrl, detailsPayload, {
        headers: { 'content-type': 'application/json' }
    });
    
    const details = detailsResponse.data.data.question;
    const frontendId = details.questionFrontendId;
    const difficulty = DIFFICULTY_EMOJI[details.difficulty] || details.difficulty;
    const content = details.content || '';
    
    // 格式化标签
    const topicTags = (details.topicTags || []).map(tag => {
        return '#' + tag.slug.replace(/-/g, '_');
    }).join(' ');
    
    // 构建描述
    const descriptionHeader = `<div>${difficulty} ${questionDate}<br><br>${topicTags}<br><br></div>`;
    
    const item = {
        type: 'webpage',
        title: `${frontendId}.${titleSlug}`,
        description: descriptionHeader + content,
        url: questionLink,
        pubDate: new Date().toISOString(),
        publishTime: new Date().toISOString(),
        author: 'LeetCode'
    };
    
    return {
        data: [item],
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
    name: "LeetCode Daily",
    description: "LeetCode Daily Question (English)",
    author: "LeetCode",
    logo: "https://leetcode.com/favicon.ico",
    siteUrl: "https://leetcode.com",
    version: "1.0.0",
    category: "kaifa",
    getCategories,
    getFeeds
};
