const axios = require('axios');
const dayjs = require('dayjs');

const TYPE_MAPPINGS = {
  1: '最近24小时地震信息',
  2: '最近48小时地震信息',
  5: '最近一年3.0级以上地震信息',
  7: '最近一年3.0级以下地震',
  8: '最近一年4.0级以上地震信息',
  9: '最近一年5.0级以上地震信息',
  0: '最近一年6.0级以上地震信息'
};

async function getCategories() {
    return Object.entries(TYPE_MAPPINGS).map(([id, name]) => ({
        id: id,
        name: name,
        url: null,
        children: []
    }));
}

async function getFeeds(page, {category, extra, filter}) {
  const type = category.id;
  const baseUrl = 'http://www.ceic.ac.cn';
  const apiUrl = `${baseUrl}/ajax/speedsearch?num=${type}`;
  
  const response = await axios.get(apiUrl);
  
  const dataStr = response.data.replace(/,"page":"(.*?)","num":/, ',"num":');
  const jsonData = JSON.parse(dataStr.substring(1, dataStr.length - 1));
  let earthquakeList = jsonData.shuju || [];
  
  if (earthquakeList.length > 20) {
    earthquakeList = earthquakeList.slice(0, 20);
  }
  
  const list = earthquakeList.map(entity => {
    const { NEW_DID, LOCATION_C, M, O_TIME } = entity;
    
    const description = `发震时刻(UTC+8): ${entity.O_TIME}\n参考位置: ${entity.LOCATION_C}\n震级(M): ${entity.M}\n纬度(°): ${entity.EPI_LAT}\n经度(°): ${entity.EPI_LON}\n深度(千米): ${entity.EPI_DEPTH}`;
    
    return {
      type: 'webpage',
      title: `${LOCATION_C}发生${M}级地震`,
      description: description,
      url: `http://news.ceic.ac.cn/${NEW_DID}.html`,
      publishTime: dayjs(O_TIME).toISOString(),
      author: 'CEIC',
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
    name: "中国地震台网",
    description: "中国地震台网地震信息。",
    author: "CEIC",
    logo: "http://www.ceic.ac.cn/favicon.ico",
    siteUrl: "http://www.ceic.ac.cn/",
    version: "1.0.0",
    category: "shenghuo",
    getCategories,
    getFeeds
};
