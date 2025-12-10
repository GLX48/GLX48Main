// docs/js/search.js
class SearchEngine {
    constructor(data) {
        this.data = data || [];
        this.index = this.buildIndex();
    }

    // 构建搜索索引
    buildIndex() {
        const index = [];
        this.data.forEach(item => {
            // 索引文件名
            index.push({
                type: 'filename',
                value: item.filename,
                item: item
            });

            // 索引每个关键词
            if (item.keywords && Array.isArray(item.keywords)) {
                item.keywords.forEach(keyword => {
                    index.push({
                        type: 'keyword',
                        value: keyword,
                        item: item
                    });
                });
            }

            // 索引文本内容（用于模糊搜索）
            if (item.text_content) {
                index.push({
                    type: 'content',
                    value: item.text_content,
                    item: item
                });
            }
        });
        return index;
    }

    // 执行搜索
    search(query, filterType = 'all') {
        if (!query) {
            return { exact: [], fuzzy: [] };
        }

        const exactResults = [];
        const fuzzySuggestions = [];
        const usedFiles = new Set();

        // 处理搜索词（支持空格分隔的多关键词）
        const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);

        this.index.forEach(entry => {
            // 根据过滤器类型筛选
            if (filterType !== 'all' && entry.type !== filterType) {
                return;
            }

            const matchResult = this.calculateMatch(entry.value, searchTerms, entry.type);
            
            if (matchResult.exact) {
                // 精确匹配：直接加入结果
                if (!usedFiles.has(entry.item.filename)) {
                    exactResults.push(entry.item);
                    usedFiles.add(entry.item.filename);
                }
            } else if (matchResult.fuzzy) {
                // 模糊匹配：作为建议
                fuzzySuggestions.push({
                    matchedTerm: matchResult.matchedTerm,
                    filename: entry.item.filename,
                    type: entry.type,
                    score: matchResult.score
                });
            }
        });

        // 去重并排序
        return {
            exact: this.removeDuplicates(exactResults),
            fuzzy: this.sortSuggestions(this.removeDuplicateSuggestions(fuzzySuggestions))
        };
    }

    // 计算匹配度
    calculateMatch(value, searchTerms, type) {
        const valueStr = String(value).toLowerCase();
        let score = 0;
        let matchedTerm = '';

        // 检查是否完全匹配
        for (const term of searchTerms) {
            if (type === 'filename') {
                // 文件名匹配：支持前缀匹配和包含匹配
                if (valueStr === term) {
                    return { exact: true, score: 100 };
                } else if (valueStr.startsWith(term)) {
                    score = 80;
                    matchedTerm = term;
                } else if (valueStr.includes(term)) {
                    score = 60;
                    matchedTerm = term;
                }
            } else if (type === 'keyword') {
                // 关键词匹配：必须完全匹配
                if (valueStr === term) {
                    return { exact: true, score: 100 };
                } else if (valueStr.includes(term)) {
                    score = 50;
                    matchedTerm = term;
                }
            } else if (type === 'content') {
                // 内容匹配：支持包含匹配
                if (valueStr.includes(term)) {
                    if (valueStr === term) {
                        return { exact: true, score: 100 };
                    } else {
                        score = Math.max(score, 40);
                        matchedTerm = term;
                    }
                }
            }
        }

        if (score > 0) {
            return { exact: false, fuzzy: true, score, matchedTerm };
        }

        return { exact: false, fuzzy: false, score: 0 };
    }

    // 去除重复结果
    removeDuplicates(results) {
        const seen = new Set();
        return results.filter(item => {
            if (seen.has(item.filename)) {
                return false;
            }
            seen.add(item.filename);
            return true;
        });
    }

    // 去除重复建议
    removeDuplicateSuggestions(suggestions) {
        const seen = new Set();
        return suggestions.filter(suggestion => {
            const key = `${suggestion.matchedTerm}-${suggestion.filename}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    // 排序建议（按相关度）
    sortSuggestions(suggestions) {
        return suggestions.sort((a, b) => b.score - a.score).slice(0, 10); // 取前10个建议
    }

    // 高级搜索：按分类筛选
    searchByCategory(category) {
        return this.data.filter(item => item.category === category);
    }

    // 获取所有唯一关键词（用于标签云等）
    getAllUniqueKeywords() {
        const keywords = new Set();
        this.data.forEach(item => {
            if (item.keywords && Array.isArray(item.keywords)) {
                item.keywords.forEach(keyword => keywords.add(keyword));
            }
        });
        return Array.from(keywords).sort();
    }
}