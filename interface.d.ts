interface IRemoteChannelInfo {
    indentifier?: string
    name: string,
    type: string,
    description?: string,
    icon?: string,
    tags?: string[]
    url: string
}

interface IRemoteChannelCategory {
    icon?: string,
    name: string,
    channelsUrl: string,
}

interface IExploreInfo {
    
}


interface IRemoteChannelInfo {
    identifier?: string
    name: string,
    type: string, // rss, js
    description?: string,
    icon?: string, // url
    category: string, // 和category name对应
    url: string
}