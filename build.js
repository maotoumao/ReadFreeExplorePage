const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const categoriesPath = path.join(__dirname, 'channels', 'categories.json');
const rssDir = path.join(__dirname, 'channels', 'rss');
const jsChannelsDir = path.join(__dirname, 'channels', 'js');
const buildDir = path.join(__dirname, 'build');
const buildCategoryDir = path.join(buildDir, 'category');
const buildJsDir = path.join(buildDir, 'js');
const topTxtPath = path.join(__dirname, 'top.txt');

// 辅助函数：计算 MD5
function calculateMD5(content) {
    return crypto.createHash('md5').update(content).digest('hex');
}

// 确保构建目录存在
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
}
if (!fs.existsSync(buildCategoryDir)) {
    fs.mkdirSync(buildCategoryDir);
}
if (!fs.existsSync(buildJsDir)) {
    fs.mkdirSync(buildJsDir);
}

try {
    // 1. 读取 categories.json
    console.log('正在读取分类配置...');
    const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
    const categories = JSON.parse(categoriesData);

    // 创建分类映射：name -> id 和 id -> id
    const categoryMap = {};
    const categoryIdToNameMap = {};
    categories.forEach(cat => {
        if (cat.id) {
            categoryMap[cat.id] = cat.id;
            categoryIdToNameMap[cat.id] = cat.name;
        }
        if (cat.name) {
            categoryMap[cat.name] = cat.id;
        }
    });

    // 用于聚合所有条目
    const aggregated = {};
    
    // 用于 top.txt 查找
    const rssLookup = {}; // url -> item
    const jsLookup = {};  // filename -> item

    // 辅助函数：添加到聚合
    function addToAggregated(item, sourceName) {
        const catKey = item.category;
        let catId = categoryMap[catKey];

        if (!catId) {
            console.warn(`警告: 条目 "${item.name}" (${sourceName}) 的分类 "${catKey}" 未在 categories.json 中找到。归类到 "其他"。`);
            catId = 'qita';
        }

        // 统一将 category 字段修改为分类名称 (Name)
        if (categoryIdToNameMap[catId]) {
            item.category = categoryIdToNameMap[catId];
        }

        if (!aggregated[catId]) {
            aggregated[catId] = [];
        }
        aggregated[catId].push(item);
    }

    // 2. 处理 RSS 频道
    console.log('正在处理 RSS 频道...');
    if (fs.existsSync(rssDir)) {
        const rssFiles = fs.readdirSync(rssDir);

        rssFiles.forEach(file => {
            if (path.extname(file) === '.json') {
                const filePath = path.join(rssDir, file);
                let rssData = fs.readFileSync(filePath, 'utf8');
                // 移除 BOM
                if (rssData.charCodeAt(0) === 0xFEFF) {
                    rssData = rssData.slice(1);
                }
                
                try {
                    const rssItems = JSON.parse(rssData);
                    // 确保是数组
                    const items = Array.isArray(rssItems) ? rssItems : [rssItems];

                    items.forEach(item => {
                        // RSS 特有处理
                        item.version = "1.0";
                        if (item.url) {
                            item.hash = calculateMD5(item.url);
                            rssLookup[item.url] = item; // 添加到查找表
                        } else {
                            console.warn(`警告: RSS 条目 "${item.name}" (在 ${file} 中) 缺少 URL，无法计算 hash。`);
                            item.hash = "";
                        }
                        
                        addToAggregated(item, `RSS: ${file}`);
                    });
                } catch (e) {
                    console.error(`错误: 解析 RSS JSON 文件 ${file} 失败:`, e);
                }
            }
        });
    } else {
        console.log('未找到 channels/rss 目录，跳过 RSS 频道处理。');
    }

    // 3. 处理 JS 频道
    console.log('正在处理 JS 频道...');
    if (fs.existsSync(jsChannelsDir)) {
        const jsFiles = fs.readdirSync(jsChannelsDir);

        jsFiles.forEach(file => {
            if (path.extname(file) === '.js') {
                const srcPath = path.join(jsChannelsDir, file);
                const destPath = path.join(buildJsDir, file);

                // 2.1 复制 JS 文件 (读取为字符串并标准化换行符，确保跨平台和 String MD5 一致性)
                let fileContent = fs.readFileSync(srcPath, 'utf8');
                // 统一换行符为 \n (LF)
                fileContent = fileContent.replace(/\r\n/g, '\n');
                
                fs.writeFileSync(destPath, fileContent, 'utf8');
                
                // 2.2 Require 文件并获取元数据
                // 清除缓存以确保获取最新内容
                delete require.cache[require.resolve(srcPath)];
                let channelModule;
                try {
                    channelModule = require(srcPath);
                } catch (e) {
                    console.error(`错误: 无法加载 JS 频道文件 ${file}:`, e);
                    return;
                }

                // 2.3 新增字段 hash 和 version
                // 计算标准化后的字符串的 MD5
                const fileHash = calculateMD5(fileContent);
                const version = channelModule.version || "1.0";

                const jsItem = {
                    ...channelModule,
                    type: 'js',
                    url: `js/${file}`, // 相对路径
                    hash: fileHash,
                    version: version
                };

                if (!jsItem.type) {
                    jsItem.type = 'js';
                }

                jsLookup[file] = jsItem; // 添加到查找表
                addToAggregated(jsItem, `JS: ${file}`);
            }
        });
    } else {
        console.log('未找到 channels/js 目录，跳过 JS 频道处理。');
    }

    // 4. 过滤并写入 categories.json
    console.log('正在过滤并写入 categories.json...');
    const activeCategoryIds = Object.keys(aggregated);
    const filteredCategories = categories.filter(cat => activeCategoryIds.includes(cat.id));
    
    // 如果有 "其他" 分类且有内容，但原始 categories.json 里没有（虽然我们之前加了），确保它存在
    if (aggregated['qita'] && !filteredCategories.find(c => c.id === 'qita')) {
        filteredCategories.push({
            id: "qita",
            avatar: "📦",
            name: "其他",
            description: "未分类的内容和其他精彩资源。"
        });
    }

    // 强制使用 \n 换行符
    const categoriesJson = JSON.stringify(filteredCategories, null, 2).replace(/\r\n/g, '\n');
    fs.writeFileSync(path.join(buildDir, 'categories.json'), categoriesJson, 'utf8');
    console.log(`已写入 build/categories.json，共 ${filteredCategories.length} 个分类。`);


    // 5. 写入聚合文件
    console.log('正在写入聚合文件...');
    Object.keys(aggregated).forEach(catId => {
        const filePath = path.join(buildCategoryDir, `${catId}.json`);
        // 强制使用 \n 换行符
        const catJson = JSON.stringify(aggregated[catId], null, 2).replace(/\r\n/g, '\n');
        fs.writeFileSync(filePath, catJson, 'utf8');
        console.log(`已创建 ${filePath}`);
    });

    // 6. 处理 top.txt
    console.log('正在处理 top.txt...');
    const topItems = [];
    
    if (fs.existsSync(topTxtPath)) {
        const topContent = fs.readFileSync(topTxtPath, 'utf8');
        const lines = topContent.split(/\r?\n/);
        
        lines.forEach(line => {
            const key = line.trim();
            if (!key) return;
            
            // 优先查找 JS 文件名
            if (jsLookup[key]) {
                topItems.push(jsLookup[key]);
            } 
            // 然后查找 RSS URL
            else if (rssLookup[key]) {
                topItems.push(rssLookup[key]);
            } else {
                console.warn(`警告: top.txt 中的条目 "${key}" 未在 RSS 或 JS 频道中找到。`);
            }
        });
        
        const topJsonPath = path.join(buildDir, 'top.json');
        // 强制使用 \n 换行符
        const topJson = JSON.stringify(topItems, null, 2).replace(/\r\n/g, '\n');
        fs.writeFileSync(topJsonPath, topJson, 'utf8');
        console.log(`已创建 ${topJsonPath}`);
    } else {
        console.log('未找到 top.txt，跳过 top.json 生成。');
    }

    console.log('构建成功完成。');

} catch (err) {
    console.error('构建失败:', err);
    process.exit(1);
}
