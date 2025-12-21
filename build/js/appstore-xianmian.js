const axios = require('axios');
const dayjs = require('dayjs');

function parseDate(date) {
  return dayjs(date).toDate();
}

async function getCategories() {
    return [{
        id: 'default',
        name: '每日精品限免',
        url: null,
        children: []
    }];
}

async function getFeeds(page, {category, extra, filter}) {
  const limit = 10;
  
  const response = await axios.get('https://app.so/api/v5/appso/discount/', {
    params: {
      platform: 'web',
      limit: limit
    }
  });
  
  const data = response.data.objects || [];
  
  const list = data.map(item => {
    const discountInfo = item.discount_info && item.discount_info[0];
    const discountedPrice = discountInfo ? discountInfo.discounted_price : '0.00';
    const originalPrice = discountInfo ? discountInfo.original_price : '0.00';
    const isFree = discountedPrice === '0.00';
    
    const app = item.app || {};
    const iconUrl = app.icon ? app.icon.image : '';
    const downloadLink = app.download_link && app.download_link[0];
    const device = downloadLink ? downloadLink.device : '';
    const link = downloadLink ? downloadLink.link : '';
    
    const description = `原价：¥${originalPrice} -> 现价：¥${discountedPrice}\n平台：${device}\n${item.content || ''}`.replace(/<[^>]+>/g, '');

    return {
      type: 'app',
      title: `「${isFree ? '免费' : '降价'}」${app.name || '未知应用'}`,
      description: description,
      url: link,
      coverImage: iconUrl,
      author: 'AppSo',
      publishTime: parseDate(item.updated_at * 1000).toISOString()
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
    name: "AppStore 限免应用",
    description: "AppSo 每日精品限免/促销应用。",
    author: "AppSo",
    logo: "https://app.so/favicon.ico",
    siteUrl: "http://app.so/xianmian/",
    version: "1.0.0",
    category: "ruanjian",
    getCategories,
    getFeeds
};
