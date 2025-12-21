const axios = require('axios');
const cheerio = require('cheerio');
const dayjs = require('dayjs');

function parseDate(date) {
  if (!date) return null;
  return dayjs(date).toDate();
}

const sorts = {
    'updated': 'Updated',
    'today': 'Daily Installs',
    'total_installs': 'Total Installs',
    'ratings': 'Ratings',
    'created': 'Created',
    'name': 'Name'
};

async function getCategories() {
    return Object.entries(sorts).map(([id, name]) => ({
        id: id,
        name: name,
        url: null,
        children: []
    }));
}

async function getFeeds(page, {category, extra, filter}) {
  const sort = category.id;
  const language = 'zh-CN';
  const domain = '';
  
  const langParam = language;
  const filterLocale = 1;
  
  const urlPath = domain ? `/by-site/${domain}` : '';
  const currentUrl = `https://greasyfork.org/${langParam}/scripts${urlPath}`;
  
  const response = await axios.get(currentUrl, {
    params: {
      filter_locale: filterLocale,
      sort: sort
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  const $ = cheerio.load(response.data);
  const list = $('.script-list').find('article').toArray().map((item) => {
    const $item = $(item);
    const h2 = $item.find('h2');
    const title = h2.find('a').text();
    const description = h2.find('.description').text();
    const href = h2.find('a').attr('href');
    const link = href ? new URL(href, 'https://greasyfork.org').href : '';
    
    const createdTime = $item.find('.script-list-created-date relative-time').attr('datetime');
    const updatedTime = $item.find('.script-list-updated-date relative-time').attr('datetime');
    
    const authors = $item.find('.script-list-author a').toArray()
      .map(a => $(a).text())
      .join(', ');
    
    return {
      type: 'webpage',
      title: title,
      description: description,
      url: link,
      coverImage: null,
      author: authors,
      publishTime: parseDate(updatedTime).toISOString()
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
    name: "Greasyfork Scripts",
    description: "Greasyfork 脚本更新。",
    author: "Greasyfork",
    logo: "https://greasyfork.org/vite/assets/blacklogo96-CxYTSM_T.png",
    siteUrl: "https://greasyfork.org/",
    version: "1.0.0",
    category: "kaifa",
    getCategories,
    getFeeds
};
