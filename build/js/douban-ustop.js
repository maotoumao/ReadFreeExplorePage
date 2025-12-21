const axios = require('axios');

async function getCategories() {
    return [{
        id: 'default',
        name: '北美票房榜',
        url: null,
        children: []
    }];
}

async function getFeeds(page, {category, extra, filter}) {
  const response = await axios.get(
    'https://api.douban.com/v2/movie/us_box?apikey=0df993c66c0c636e29ecbb5344252a4a',
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }
  );
  
  const movieList = response.data.subjects;
  
  const list = movieList.map((item) => {
      const movie = item.subject;
      const rating = movie.rating && movie.rating.stars !== '00' 
        ? movie.rating.average 
        : '无';
      
      const description = `标题：${movie.title}\n影片类型：${movie.genres.join(' | ')}\n评分：${rating}`;

      return {
        type: 'webpage',
        title: movie.title,
        description: description,
        url: movie.alt,
        coverImage: movie.images.large,
        author: 'Douban',
        publishTime: null
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
    name: "豆瓣电影北美票房榜",
    description: "豆瓣电影北美票房榜。",
    author: "Douban",
    logo: "https://img3.doubanio.com/favicon.ico",
    siteUrl: "https://movie.douban.com/chart",
    version: "1.0.0",
    category: "yule",
    getCategories,
    getFeeds
};
