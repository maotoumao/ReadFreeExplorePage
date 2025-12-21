const axios = require('axios');

const PRODUCTS = [
    { id: 'dotnet/framework/runtime', name: '.NET Framework Runtime' },
    { id: 'dotnet/sdk', name: '.NET SDK' },
    { id: 'powershell', name: 'PowerShell' },
    { id: 'azure-cli', name: 'Azure CLI' }
];

async function getCategories() {
    return PRODUCTS.map(p => ({
        id: p.id,
        name: p.name,
        url: `https://mcr.microsoft.com/en-us/product/${p.id}`,
        children: []
    }));
}

async function getFeeds(page, {category, extra, filter}) {
    const product = category.id;

    // 获取产品详情
    const detailsResponse = await axios.get(`https://mcr.microsoft.com/api/v1/catalog/${product}/details?reg=mar`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    const details = detailsResponse.data;

    // 获取标签列表
    const tagsResponse = await axios.get(`https://mcr.microsoft.com/api/v1/catalog/${product}/tags?reg=mar`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    const tags = tagsResponse.data;

    const items = tags.map(tag => {
        const descriptionItems = [
            `Digest: \`${tag.digest}\``,
            `Last modified date: ${new Date(tag.lastModifiedDate).toDateString()}`
        ];

        if (tag.architecture) {
            descriptionItems.push(`Architecture: ${tag.architecture}`);
        }
        if (tag.operatingSystem) {
            descriptionItems.push(`Operating system: ${tag.operatingSystem}`);
        }

        return {
            type: 'webpage',
            title: `${details.name} - ${tag.name}`,
            author: details.publisher,
            description: descriptionItems.join('<br />'),
            pubDate: new Date(tag.lastModifiedDate).toISOString(),
            publishTime: new Date(tag.lastModifiedDate).toISOString(),
            guid: `mcr::${product}::${tag.name}::${tag.digest}`,
            url: `https://mcr.microsoft.com/en-us/product/${product}/tags?name=${tag.name}&digest=${tag.digest}`
        };
    });

    return {
        data: items,
        page: 1,
        totalPage: 1,
        hasMore: false,
        extra: null
    };
}

module.exports = {
    name: "Microsoft MCR",
    description: "Microsoft Container Registry (MCR) 镜像标签更新",
    author: "Microsoft",
    logo: "https://mcr.microsoft.com/favicon.ico",
    siteUrl: "https://mcr.microsoft.com",
    version: "1.0.0",
    category: "kaifa",
    getCategories,
    getFeeds
};
