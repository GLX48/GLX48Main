// docs/js/search.js
console.log("🔍 搜索引擎初始化...");

class SearchEngine {
    constructor() {
        console.log("✅ 搜索引擎就绪");
    }

    search(data, query, filterType = 'all') {
        console.log(`🔍 搜索: "${query}", 过滤类型: ${filterType}`);
        
        if (!data || !Array.isArray(data)) {
            console.warn("⚠️ 搜索数据无效");
            return { exact: [], fuzzy: [] };
        }

        const exactMatches = [];
        const fuzzyMatches = [];

        data.forEach(item => {
            const matchResult = this.calculateMatch(item, query, filterType);
            
            if (matchResult.exact) {
                exactMatches.push({
                    ...item,
                    matchScore: matchResult.score
                });
            } else if (matchResult.fuzzy) {
                fuzzyMatches.push({
                    ...item,
                    matchedTerm: matchResult.matchedTerm,
                    matchScore: matchResult.score
                });
            }
        });

        // 按匹配度排序
        exactMatches.sort((a, b) => b.matchScore - a.matchScore);
        fuzzyMatches.sort((a, b) => b.matchScore - a.matchScore);

        console.log(`📊 搜索结果: 精确匹配 ${exactMatches.length} 条, 模糊匹配 ${fuzzyMatches.length} 条`);
        
        return {
            exact: exactMatches,
            fuzzy: fuzzyMatches.slice(0, 10) // 限制模糊建议数量
        };
    }

    calculateMatch(item, query, filterType) {
        const searchTerm = query.toLowerCase().trim();
        let bestScore = 0;
        let bestMatchTerm = '';

        // 根据过滤类型进行匹配
        if (filterType === 'all' || filterType === 'filename') {
            const filenameScore = this.calculateFilenameMatch(item.filename, searchTerm);
            if (filenameScore > bestScore) {
                bestScore = filenameScore;
                bestMatchTerm = item.filename;
            }
        }

        if (filterType === 'all' || filterType === 'keywords') {
            const keywordScore = this.calculateKeywordsMatch(item.keywords, searchTerm);
            if (keywordScore > bestScore) {
                bestScore = keywordScore;
                bestMatchTerm = searchTerm;
            }
        }

        if (filterType === 'all' || filterType === 'content') {
            const contentScore = this.calculateContentMatch(item.text_content, searchTerm);
            if (contentScore > bestScore) {
                bestScore = contentScore;
                bestMatchTerm = searchTerm;
            }
        }

        // 判断匹配类型
        if (bestScore >= 80) {
            return { exact: true, fuzzy: false, score: bestScore, matchedTerm: bestMatchTerm };
        } else if (bestScore >= 30) {
            return { exact: false, fuzzy: true, score: bestScore, matchedTerm: bestMatchTerm };
        } else {
            return { exact: false, fuzzy: false, score: 0 };
        }
    }

    calculateFilenameMatch(filename, searchTerm) {
        if (!filename) return 0;
        
        const filenameLower = filename.toLowerCase();
        
        if (filenameLower === searchTerm) return 100;
        if (filenameLower.startsWith(searchTerm)) return 85;
        if (filenameLower.includes(searchTerm)) return 70;
        
        return 0;
    }

    calculateKeywordsMatch(keywords, searchTerm) {
        if (!keywords || !Array.isArray(keywords)) return 0;
        
        for (const keyword of keywords) {
            const keywordLower = keyword.toLowerCase();
            
            if (keywordLower === searchTerm) return 90;
            if (keywordLower.includes(searchTerm)) return 60;
        }
        
        return 0;
    }

    calculateContentMatch(content, searchTerm) {
        if (!content) return 0;
        
        const contentLower = content.toLowerCase();
        
        if (contentLower.includes(searchTerm)) {
            // 根据出现位置和频率计算分数
            const position = contentLower.indexOf(searchTerm);
            const frequency = (contentLower.match(new RegExp(searchTerm, 'g')) || []).length;
            
            let score = 40; // 基础分
            
            // 位置越靠前分数越高
            if (position < 50) score += 20;
            else if (position < 200) score += 10;
            
            // 频率越高分数越高
            score += Math.min(frequency * 5, 20);
            
            return Math.min(score, 80);
        }
        
        return 0;
    }

    // 高级搜索功能
    advancedSearch(data, criteria) {
        console.log("🔍 执行高级搜索:", criteria);
        
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
            (item.text_content && item.text_content.toLowerCase().includes(currentLower))
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
        });
        
        return Array.from(related).slice(0, 5);
    }
}

// 创建全局搜索实例
console.log("🌐 创建全局搜索引擎实例...");
const searchEngine = new SearchEngine();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchEngine;
} else {
    window.SearchEngine = SearchEngine;
}

console.log("✅ 搜索引擎加载完成");