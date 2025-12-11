// docs/js/search.js
console.log("🔍🔍 搜索引擎初始化...");

class SearchEngine {
    constructor() {
        console.log("✅ 搜索引擎就绪");
    }

    // 修改 search 方法，增强文件名匹配
    search(data, query, filterType = 'all') {
        console.log(`🔍 搜索: "${query}", 过滤类型: ${filterType}`);
        
        if (!data || !Array.isArray(data)) {
            console.warn("⚠️ 搜索数据无效");
            return { exact: [], fuzzy: [] };
        }

        const exactMatches = [];
        const fuzzyMatches = [];

        data.forEach(item => {
            // 优先进行文件名匹配（特别处理 B.Rise/brise 这种情况）
            const filenameMatch = this.calculateFilenameMatch(item.filename, query);
            
            if (filenameMatch.score >= 80) {
                exactMatches.push({
                    ...item,
                    matchScore: filenameMatch.score,
                    matchedTerm: filenameMatch.matchedTerm,
                    matchType: 'filename'
                });
                return; // 如果文件名匹配度高，跳过其他匹配
            }

            // 其他类型的匹配（原有逻辑）
            const otherMatchResult = this.calculateOtherMatches(item, query, filterType);
            
            if (otherMatchResult.exact) {
                exactMatches.push({
                    ...item,
                    matchScore: otherMatchResult.score,
                    matchedTerm: otherMatchResult.matchedTerm,
                    matchType: otherMatchResult.matchType
                });
            } else if (otherMatchResult.fuzzy) {
                fuzzyMatches.push({
                    ...item,
                    matchedTerm: otherMatchResult.matchedTerm,
                    matchScore: otherMatchResult.score,
                    matchType: otherMatchResult.matchType
                });
            }
        });

        // 排序和去重
        exactMatches.sort((a, b) => b.matchScore - a.matchScore);
        fuzzyMatches.sort((a, b) => b.matchScore - a.matchScore);

        console.log(`📊 搜索结果: 精确匹配 ${exactMatches.length} 条, 模糊匹配 ${fuzzyMatches.length} 条`);
        
        return {
            exact: exactMatches,
            fuzzy: this.removeDuplicates(fuzzyMatches).slice(0, 10)
        };
    }

    // 新增：其他匹配类型的计算
    calculateOtherMatches(item, query, filterType) {
        const searchTerm = this.normalizeSearchTerm(query);
        let bestScore = 0;
        let bestMatchTerm = '';
        let bestMatchType = '';

        // 关键词匹配
        if ((filterType === 'all' || filterType === 'keywords') && item.keywords) {
            const keywordResult = this.calculateKeywordsMatch(item.keywords, searchTerm);
            if (keywordResult.score > bestScore) {
                bestScore = keywordResult.score;
                bestMatchTerm = keywordResult.matchedTerm;
                bestMatchType = 'keywords';
            }
        }

        // 内容匹配
        if ((filterType === 'all' || filterType === 'content') && item.text_content) {
            const contentResult = this.calculateContentMatch(item.text_content, searchTerm);
            if (contentResult.score > bestScore) {
                bestScore = contentResult.score;
                bestMatchTerm = contentResult.matchedTerm;
                bestMatchType = 'content';
            }
        }

        // 判断匹配类型
        if (bestScore >= 80) {
            return { exact: true, fuzzy: false, score: bestScore, matchedTerm: bestMatchTerm, matchType: bestMatchType };
        } else if (bestScore >= 30) {
            return { exact: false, fuzzy: true, score: bestScore, matchedTerm: bestMatchTerm, matchType: bestMatchType };
        } else {
            return { exact: false, fuzzy: false, score: 0 };
        }
    }

    normalizeSearchTerm(term) {
        if (!term) return '';
        
        // 替换常见特殊字符为空格，支持多种分隔符
        return term.toLowerCase()
            .replace(/[._\-]/g, ' ')  // 将点号、下划线、连字符转为空格
            .replace(/\s+/g, ' ')     // 合并多个空格
            .trim();
    }

    calculateMatch(item, query, filterType) {
        const searchTerm = this.normalizeSearchTerm(query);
        const originalSearchTerm = query.toLowerCase().trim();
        
        if (!searchTerm && !originalSearchTerm) return { exact: false, fuzzy: false, score: 0 };
        
        let bestScore = 0;
        let bestMatchTerm = '';
        let bestMatchType = '';

        // 1. 首先使用原始搜索词进行精确匹配（保持原有逻辑）
        if (filterType === 'all' || filterType === 'filename') {
            const filenameResult = this.calculateFilenameMatch(item.filename, originalSearchTerm);
            if (filenameResult.score > bestScore) {
                bestScore = filenameResult.score;
                bestMatchTerm = filenameResult.matchedTerm;
                bestMatchType = 'filename';
            }
        }

        // 2. 如果原始搜索词匹配度不高，使用归一化后的搜索词
        if (bestScore < 70) {
            const normalizedResults = this.calculateNormalizedMatch(item, searchTerm, filterType);
            if (normalizedResults.score > bestScore) {
                bestScore = normalizedResults.score;
                bestMatchTerm = normalizedResults.matchedTerm;
                bestMatchType = normalizedResults.matchType;
            }
        }
    
        // 2. 只有在没有文件名匹配时，才检查其他匹配类型
        if (bestScore < 70) {
            if ((filterType === 'all' || filterType === 'keywords') && item.keywords) {
                const keywordResult = this.calculateKeywordsMatch(item.keywords, searchTerm);
                if (keywordResult.score > bestScore) {
                    bestScore = keywordResult.score;
                    bestMatchTerm = keywordResult.matchedTerm;
                    bestMatchType = 'keywords';
                }
            }
    
            if ((filterType === 'all' || filterType === 'content') && item.text_content) {
                const contentResult = this.calculateContentMatch(item.text_content, searchTerm);
                if (contentResult.score > bestScore) {
                    bestScore = contentResult.score;
                    bestMatchTerm = contentResult.matchedTerm;
                    bestMatchType = 'content';
                }
            }
    
            if ((filterType === 'all' || filterType === 'content') && item.song_name) {
                const songResult = this.calculateSongNameMatch(item.song_name, searchTerm);
                if (songResult.score > bestScore) {
                    bestScore = songResult.score;
                    bestMatchTerm = songResult.matchedTerm;
                    bestMatchType = 'song_name';
                }
            }
        }
    
        // 判断匹配类型
        if (bestScore >= 80) {
            return { 
                exact: true, 
                fuzzy: false, 
                score: bestScore, 
                matchedTerm: bestMatchTerm,
                matchType: bestMatchType
            };
        } else if (bestScore >= 30) {
            return { 
                exact: false, 
                fuzzy: true, 
                score: bestScore, 
                matchedTerm: bestMatchTerm,
                matchType: bestMatchType
            };
        } else {
            return { exact: false, fuzzy: false, score: 0 };
        }
    }
    

    calculateNormalizedMatch(item, normalizedTerm, filterType) {
        let bestScore = 0;
        let bestMatchTerm = '';
        let bestMatchType = '';
    
        // 文件名归一化匹配
        if (filterType === 'all' || filterType === 'filename') {
            const normalizedFilename = this.normalizeSearchTerm(item.filename);
            if (normalizedFilename.includes(normalizedTerm)) {
                const score = this.calculateSimilarity(normalizedFilename, normalizedTerm);
                if (score > bestScore) {
                    bestScore = score;
                    bestMatchTerm = item.filename;
                    bestMatchType = 'filename';
                }
            }
        }

        // 关键词归一化匹配
        if ((filterType === 'all' || filterType === 'keywords') && item.keywords) {
            for (const keyword of item.keywords) {
                const normalizedKeyword = this.normalizeSearchTerm(keyword);
                if (normalizedKeyword.includes(normalizedTerm)) {
                    const score = this.calculateSimilarity(normalizedKeyword, normalizedTerm);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatchTerm = keyword;
                        bestMatchType = 'keywords';
                    }
                }
            }
        }
    
        return { score: bestScore, matchedTerm: bestMatchTerm, matchType: bestMatchType };
    }

    // 新增相似度计算函数
    calculateSimilarity(text, searchTerm) {
        if (text === searchTerm) return 100;
        if (text.startsWith(searchTerm)) return 85;
        if (text.includes(searchTerm)) return 70;
        
        // 计算编辑距离相似度
        const distance = this.levenshteinDistance(text, searchTerm);
        const maxLength = Math.max(text.length, searchTerm.length);
        return Math.max(0, 100 - (distance / maxLength) * 100);
    }

    // 莱文斯坦距离算法
    levenshteinDistance(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }

    // 在 SearchEngine 类中添加新的匹配方法
    calculateFilenameMatch(filename, searchTerm) {
        if (!filename) return { score: 0, matchedTerm: '' };
        
        const filenameLower = filename.toLowerCase();
        const searchTermLower = searchTerm.toLowerCase();
        
        // 1. 精确匹配（完全相同的文件名）
        if (filenameLower === searchTermLower) {
            return { score: 100, matchedTerm: filename };
        }
        
        // 2. 移除特殊字符后的匹配（处理 B.Rise -> brise）
        const normalizedFilename = this.normalizeFilename(filenameLower);
        const normalizedSearchTerm = this.normalizeFilename(searchTermLower);
        
        if (normalizedFilename === normalizedSearchTerm) {
            return { score: 95, matchedTerm: filename };
        }
        
        // 3. 包含匹配（处理部分匹配）
        if (normalizedFilename.includes(normalizedSearchTerm)) {
            return { score: 85, matchedTerm: filename };
        }
        
        // 4. 相似度匹配（处理 brise 和 B.Rise 的相似性）
        const similarityScore = this.calculateFilenameSimilarity(filenameLower, searchTermLower);
        if (similarityScore >= 70) {
            return { score: similarityScore, matchedTerm: filename };
        }
        
        return { score: 0, matchedTerm: '' };
    }


    // 新增：文件名规范化方法
    normalizeFilename(filename) {
        if (!filename) return '';
        
        return filename
            .toLowerCase()
            .replace(/[._\-]/g, '')  // 移除点号、下划线、连字符
            .replace(/\s+/g, '')     // 移除所有空格
            .trim();
    }

    // 新增：文件名相似度计算
    calculateFilenameSimilarity(filename, searchTerm) {
        // 规范化处理
        const normalizedFile = this.normalizeFilename(filename);
        const normalizedSearch = this.normalizeFilename(searchTerm);
        
        // 直接匹配
        if (normalizedFile === normalizedSearch) return 100;
        
        // 包含关系
        if (normalizedFile.includes(normalizedSearch) || normalizedSearch.includes(normalizedFile)) {
            return 80;
        }
        
        // 编辑距离相似度
        const distance = this.levenshteinDistance(normalizedFile, normalizedSearch);
        const maxLength = Math.max(normalizedFile.length, normalizedSearch.length);
        const similarity = Math.max(0, 100 - (distance / maxLength) * 100);
        
        // 针对特定模式进行加分
        let bonus = 0;
        
        // 如果一个是另一个的缩写变体（如 B.Rise -> brise）
        if (this.isAbbreviationVariant(normalizedFile, normalizedSearch)) {
            bonus += 15;
        }
        
        // 如果共享主要字符（如都包含"rise"）
        if (this.shareMainCharacters(normalizedFile, normalizedSearch)) {
            bonus += 10;
        }
        
        return Math.min(100, similarity + bonus);
    }

    // 新增：检查是否是缩写变体
    isAbbreviationVariant(str1, str2) {
        if (str1.length < 2 || str2.length < 2) return false;
        
        // 检查点号分隔的缩写模式（如 B.Rise）
        const dotPattern = /^([a-z])\.([a-z]+)$/;
        const match1 = str1.match(dotPattern);
        const match2 = str2.match(dotPattern);
        
        if (match1 && !match2) {
            // str1 是 B.Rise 格式，str2 是普通格式
            const combined = match1[1] + match1[2]; // 变成 brise
            return combined === str2;
        }
        
        if (match2 && !match1) {
            // str2 是 B.Rise 格式，str1 是普通格式
            const combined = match2[1] + match2[2];
            return combined === str1;
        }
        
        return false;
    }

    // 新增：检查是否共享主要字符
    shareMainCharacters(str1, str2) {
        // 移除元音字母，比较辅音骨架
        const skeleton1 = str1.replace(/[aeiou]/g, '');
        const skeleton2 = str2.replace(/[aeiou]/g, '');
        
        return skeleton1 === skeleton2 && skeleton1.length >= 2;
    }

    calculateKeywordsMatch(keywords, searchTerm) {
        if (!keywords || !Array.isArray(keywords)) {
            return { score: 0, matchedTerm: '' };
        }
        
        for (const keyword of keywords) {
            const keywordLower = keyword.toLowerCase();
            
            if (keywordLower === searchTerm) {
                return { score: 90, matchedTerm: keyword };
            }
            if (keywordLower.includes(searchTerm)) {
                return { score: 60, matchedTerm: keyword };
            }
        }
        
        return { score: 0, matchedTerm: '' };
    }

    calculateContentMatch(content, searchTerm) {
        if (!content) return { score: 0, matchedTerm: '' };
        
        const contentLower = content.toLowerCase();
        
        if (contentLower.includes(searchTerm)) {
            // 根据出现位置和频率计算分数
            const position = contentLower.indexOf(searchTerm);
            const frequency = (contentLower.match(new RegExp(this.escapeRegExp(searchTerm), 'g')) || []).length;
            
            let score = 40; // 基础分
            
            // 位置越靠前分数越高
            if (position < 50) score += 20;
            else if (position < 200) score += 10;
            
            // 频率越高分数越高
            score += Math.min(frequency * 5, 20);
            
            // 提取匹配的上下文
            const matchedTerm = this.extractMatchContext(content, searchTerm, position);
            
            return {
                score: Math.min(score, 80),
                matchedTerm: matchedTerm
            };
        }
        
        // 中文分词匹配 - 新增功能
        const chineseMatch = this.chineseTextMatch(content, searchTerm);
        if (chineseMatch.found) {
            return {
                score: Math.min(chineseMatch.score, 70), // 中文匹配分数上限70
                matchedTerm: chineseMatch.matchedTerm
            };
        }
        
        return { score: 0, matchedTerm: '' };
    }

    calculateSongNameMatch(songName, searchTerm) {
        if (!songName) return { score: 0, matchedTerm: '' };
        
        const songNameLower = songName.toLowerCase();
        
        if (songNameLower === searchTerm) {
            return { score: 95, matchedTerm: songName };
        }
        if (songNameLower.includes(searchTerm)) {
            return { score: 75, matchedTerm: songName };
        }
        
        return { score: 0, matchedTerm: '' };
    }

    // 新增：中文文本匹配（处理中文分词）
    chineseTextMatch(content, searchTerm) {
        if (!content || searchTerm.length < 1) {
            return { found: false, score: 0, matchedTerm: '' };
        }
        
        const contentLower = content.toLowerCase();
        
        // 如果是单个中文字符，直接搜索
        if (searchTerm.length === 1 && this.isChineseChar(searchTerm)) {
            if (contentLower.includes(searchTerm)) {
                const frequency = (contentLower.match(new RegExp(this.escapeRegExp(searchTerm), 'g')) || []).length;
                const position = contentLower.indexOf(searchTerm);
                
                let score = 35; // 单字匹配基础分稍低
                if (position < 100) score += 15;
                score += Math.min(frequency * 3, 15);
                
                const matchedTerm = this.extractMatchContext(content, searchTerm, position);
                return {
                    found: true,
                    score: Math.min(score, 65),
                    matchedTerm: matchedTerm
                };
            }
        }
        
        // 多字符中文匹配
        if (searchTerm.length >= 2) {
            // 尝试直接匹配
            if (contentLower.includes(searchTerm)) {
                const frequency = (contentLower.match(new RegExp(this.escapeRegExp(searchTerm), 'g')) || []).length;
                const position = contentLower.indexOf(searchTerm);
                
                let score = 45;
                if (position < 100) score += 20;
                score += Math.min(frequency * 4, 20);
                
                const matchedTerm = this.extractMatchContext(content, searchTerm, position);
                return {
                    found: true,
                    score: Math.min(score, 75),
                    matchedTerm: matchedTerm
                };
            }
            
            // 尝试分词匹配（查找包含搜索词中每个字符的短语）
            if (this.isChineseText(searchTerm)) {
                const matchResult = this.chinesePhraseMatch(content, searchTerm);
                if (matchResult.found) {
                    return matchResult;
                }
            }
        }
        
        return { found: false, score: 0, matchedTerm: '' };
    }

    // 中文短语匹配
    chinesePhraseMatch(content, searchTerm) {
        const contentLower = content.toLowerCase();
        const chars = searchTerm.split('');
        
        // 查找包含所有字符的短语
        let bestPhrase = '';
        let bestScore = 0;
        
        // 滑动窗口搜索
        const windowSize = Math.min(10, contentLower.length);
        for (let i = 0; i <= contentLower.length - windowSize; i++) {
            const phrase = contentLower.substring(i, i + windowSize);
            let containsAll = true;
            
            for (const char of chars) {
                if (!phrase.includes(char)) {
                    containsAll = false;
                    break;
                }
            }
            
            if (containsAll) {
                // 计算匹配度
                let score = 30;
                // 字符顺序匹配度
                const charOrder = chars.join('');
                if (phrase.includes(charOrder)) score += 20;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestPhrase = content.substring(i, i + windowSize);
                }
            }
        }
        
        if (bestScore > 0) {
            return {
                found: true,
                score: Math.min(bestScore, 60),
                matchedTerm: bestPhrase + '...'
            };
        }
        
        return { found: false, score: 0, matchedTerm: '' };
    }

    // 提取匹配上下文
    extractMatchContext(content, searchTerm, position) {
        const start = Math.max(0, position - 15);
        const end = Math.min(content.length, position + searchTerm.length + 15);
        
        let excerpt = content.substring(start, end);
        if (start > 0) excerpt = '...' + excerpt;
        if (end < content.length) excerpt = excerpt + '...';
        
        return excerpt;
    }

    // 辅助方法
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    isChineseChar(char) {
        return /[\u4e00-\u9fa5]/.test(char);
    }

    isChineseText(text) {
        return /^[\u4e00-\u9fa5]+$/.test(text);
    }

    removeDuplicates(items) {
        const seen = new Set();
        return items.filter(item => {
            const key = item.filename;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    // 高级搜索功能
    advancedSearch(data, criteria) {
        console.log("🔍🔍 执行高级搜索:", criteria);
        
        return data.filter(item => {
            let matches = true;
            
            if (criteria.keywords && criteria.keywords.length > 0) {
                matches = matches && this.matchesKeywords(item.keywords, criteria.keywords);
            }
            
            if (criteria.category) {
                matches = matches && item.category === criteria.category;
            }
            
            if (criteria.minDifficulty) {
                matches = matches && this.compareDifficulty(item.difficulty, criteria.minDifficulty) >= 0;
            }
            
            return matches;
        });
    }

    matchesKeywords(itemKeywords, searchKeywords) {
        if (!itemKeywords || !Array.isArray(itemKeywords)) return false;
        
        return searchKeywords.some(searchKeyword => 
            itemKeywords.some(itemKeyword => 
                itemKeyword.toLowerCase().includes(searchKeyword.toLowerCase())
            )
        );
    }

    compareDifficulty(itemDifficulty, minDifficulty) {
        const difficultyLevels = {
            '初級': 1,
            '中級': 2, 
            '上級': 3,
            '专家': 4
        };
        
        const itemLevel = difficultyLevels[itemDifficulty] || 0;
        const minLevel = difficultyLevels[minDifficulty] || 0;
        
        return itemLevel - minLevel;
    }

    // 获取搜索建议
    getSearchSuggestions(data, partialQuery) {
        if (!partialQuery || partialQuery.length < 2) return [];
        
        const suggestions = new Set();
        const partialLower = partialQuery.toLowerCase();
        
        data.forEach(item => {
            // 从文件名获取建议
            if (item.filename && item.filename.toLowerCase().includes(partialLower)) {
                suggestions.add(item.filename);
            }
            
            // 从关键词获取建议
            if (item.keywords) {
                item.keywords.forEach(keyword => {
                    if (keyword.toLowerCase().includes(partialLower)) {
                        suggestions.add(keyword);
                    }
                });
            }
            
            // 从内容获取建议（提取包含搜索词的部分短语）
            if (item.text_content && item.text_content.toLowerCase().includes(partialLower)) {
                const content = item.text_content.toLowerCase();
                const index = content.indexOf(partialLower);
                const start = Math.max(0, index - 20);
                const end = Math.min(content.length, index + partialLower.length + 30);
                const snippet = item.text_content.substring(start, end).trim();
                suggestions.add(snippet);
            }
            
            // 从歌曲名获取建议
            if (item.song_name && item.song_name.toLowerCase().includes(partialLower)) {
                suggestions.add(item.song_name);
            }
        });
        
        return Array.from(suggestions).slice(0, 8); // 限制建议数量
    }

    // 搜索历史管理
    saveSearchHistory(query) {
        if (!query || query.trim().length === 0) return;
        
        try {
            let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
            
            // 移除重复项
            history = history.filter(item => item !== query);
            
            // 添加到开头
            history.unshift(query);
            
            // 限制历史记录数量
            if (history.length > 10) {
                history = history.slice(0, 10);
            }
            
            localStorage.setItem('searchHistory', JSON.stringify(history));
        } catch (error) {
            console.warn('无法保存搜索历史:', error);
        }
    }

    getSearchHistory() {
        try {
            return JSON.parse(localStorage.getItem('searchHistory') || '[]');
        } catch (error) {
            console.warn('无法读取搜索历史:', error);
            return [];
        }
    }

    clearSearchHistory() {
        try {
            localStorage.removeItem('searchHistory');
            return true;
        } catch (error) {
            console.warn('无法清除搜索历史:', error);
            return false;
        }
    }

    // 相关搜索建议
    getRelatedSearches(data, currentQuery) {
        if (!currentQuery) return [];
        
        const related = new Set();
        const currentLower = currentQuery.toLowerCase();
        
        // 查找包含当前搜索词的记录
        const matchingItems = data.filter(item => 
            (item.keywords && item.keywords.some(kw => kw.toLowerCase().includes(currentLower))) ||
            (item.text_content && item.text_content.toLowerCase().includes(currentLower)) ||
            (item.song_name && item.song_name.toLowerCase().includes(currentLower))
        );
        
        // 从匹配记录中提取其他关键词作为相关搜索
        matchingItems.forEach(item => {
            if (item.keywords) {
                item.keywords.forEach(keyword => {
                    if (keyword.toLowerCase() !== currentLower && 
                        !keyword.toLowerCase().includes(currentLower)) {
                        related.add(keyword);
                    }
                });
            }
            
            // 从歌曲名提取相关搜索
            if (item.song_name && item.song_name.toLowerCase() !== currentLower) {
                related.add(item.song_name);
            }
        });
        
        return Array.from(related).slice(0, 5);
    }
}

// 创建全局搜索实例
console.log("🌐🌐 创建全局搜索引擎实例...");
const searchEngine = new SearchEngine();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchEngine;
} else {
    window.SearchEngine = SearchEngine;
}

console.log("✅ 搜索引擎加载完成");