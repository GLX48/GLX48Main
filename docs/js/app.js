// docs/js/app.js
console.log("🎵 GLX48 应援查询系统初始化中...");

class App {
    constructor() {
        this.currentDataType = 'single_skill';
        this.currentData = [];
        this.searchResults = []; // 存储当前搜索结果
        this.currentSearchQuery = ''; // 存储当前搜索词
        this.searchEngine = new SearchEngine();
        this.init();
    }

    async init() {
        console.log("🚀 应用初始化开始");
        this.setupEventListeners();
        await this.loadData();
        console.log("✅ 应用初始化完成");
    }

    async loadData() {
        try {
            console.log(`📖 正在加载 ${this.currentDataType} 数据...`);
            
            // 获取基础路径
            const basePath = this.getBasePath();
            const jsonPath = `${basePath}/data/json/${this.currentDataType}.json`;
            console.log(`📍 JSON路径: ${jsonPath}`);
            
            const response = await fetch(jsonPath);
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`✅ 成功加载数据:`, data);
            
            this.currentData = data;
            this.displayData();
            
        } catch (error) {
            console.error('❌ 数据加载失败:', error);
            this.showError(`数据加载失败: ${error.message}`);
        }
    }

    displayData() {
        console.log("🖼️ displayData 方法被调用");
        const container = document.getElementById('data-container');
        
        if (!container) {
            console.error("❌ 找不到 data-container 元素");
            return;
        }
        
        if (!this.currentData || this.currentData.length === 0) {
            container.innerHTML = `
                <div class="data-info">
                    <h3>${this.getDataTypeName()}</h3>
                    <p>暂无数据或数据加载中...</p>
                </div>
            `;
            return;
        }
        
        // 显示数据统计信息
        container.innerHTML = `
            <div class="data-info">
                <h3>${this.getDataTypeName()}</h3>
                <p>共 ${this.currentData.length} 条记录</p>
                <p>最后更新: ${new Date().toLocaleString()}</p>
            </div>
        `;
        
        console.log("✅ 数据展示完成");
    }

    getDataTypeName() {
        return this.currentDataType === 'single_skill' ? '单技数据' : 'Call本数据';
    }

    getBasePath() {
        const path = window.location.pathname;
        if (path.includes('/GLX48Main')) {
            return '/GLX48Main';
        }
        return '';
    }

    setupEventListeners() {
        console.log("🔧 设置事件监听器...");
        
        // 导航切换
        const navLinks = document.querySelectorAll('.nav a[data-type]');
        if (navLinks.length > 0) {
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const dataType = e.target.getAttribute('data-type');
                    if (dataType && dataType !== this.currentDataType) {
                        this.currentDataType = dataType;
                        this.loadData();
                        
                        // 更新激活状态
                        navLinks.forEach(a => a.classList.remove('nav-active'));
                        e.target.classList.add('nav-active');
                        
                        console.log(`🔄 切换到: ${this.getDataTypeName()}`);
                    }
                });
            });
        } else {
            console.warn("⚠️ 未找到导航链接");
        }

        // 搜索功能
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('search-input');
        
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => this.performSearch());
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performSearch();
            });
            
            // 添加输入防抖
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    if (e.target.value.length >= 2) {
                        this.performSearch();
                    }
                }, 500);
            });
        } else {
            console.warn("⚠️ 搜索元素未找到");
        }
        
        console.log("✅ 事件监听器设置完成");
    }

    performSearch() {
        console.log("🔍 执行搜索...");
        
        if (!this.currentData || this.currentData.length === 0) {
            this.showError('数据尚未加载完成，请稍后重试。');
            return;
        }

        const query = document.getElementById('search-input').value.trim();
        const filterType = document.getElementById('filter-type').value;
        
        this.currentSearchQuery = query; // 保存搜索词

        if (!query) {
            this.clearSearchResults();
            return;
        }

        const results = this.searchEngine.search(this.currentData, query, filterType);
        this.searchResults = results.exact; // 保存搜索结果
        this.displaySearchResults(results);
    }

    displaySearchResults(results) {
        console.log("📊 显示搜索结果:", results);
        
        this.displayExactResults(results.exact);
        this.displayFuzzySuggestions(results.fuzzy);
    }

    displayExactResults(results) {
        const container = document.getElementById('exact-images');
        if (!container) {
            console.error("❌ 找不到 exact-images 容器");
            return;
        }

        if (!results || results.length === 0) {
            container.innerHTML = '<p class="no-results">没有找到精确匹配的结果</p>';
            return;
        }

        container.innerHTML = results.map((item, index) => `
            <div class="image-result" data-index="${index}" data-filename="${this.escapeHtml(item.filename)}">
                <div class="image-thumbnail">
                    
                </div>
                <div class="image-info">
                    <h4>${this.escapeHtml(item.filename)}</h4>
                    <div class="image-keywords">
                        ${item.keywords ? item.keywords.map(kw => 
                            `<span class="keyword-tag" onclick="event.stopPropagation(); app.searchKeyword('${this.escapeHtml(kw)}')">${this.escapeHtml(kw)}</span>`
                        ).join('') : ''}
                    </div>
                </div>
            </div>
        `).join('');

        // 为每个结果添加点击事件
        container.querySelectorAll('.image-result').forEach((item, index) => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('keyword-tag')) {
                    this.openImageViewer(index);
                }
            });
        });
    }

    displayFuzzySuggestions(suggestions) {
        const container = document.getElementById('fuzzy-suggestions');
        if (!container) {
            console.error("❌ 找不到 fuzzy-suggestions 容器");
            return;
        }

        if (!suggestions || suggestions.length === 0) {
            container.innerHTML = '<p class="no-results">没有找到模糊匹配的建议</p>';
            return;
        }

        container.innerHTML = suggestions.map(item => `
            <div class="suggestion-item" onclick="app.useSuggestion('${this.escapeHtml(item.matchedTerm)}')">
                <strong>${this.escapeHtml(item.matchedTerm)}</strong>
                <span class="suggestion-file">(${this.escapeHtml(item.filename)})</span>
            </div>
        `).join('');
    }

    clearSearchResults() {
        const exactContainer = document.getElementById('exact-images');
        const fuzzyContainer = document.getElementById('fuzzy-suggestions');
        
        if (exactContainer) exactContainer.innerHTML = '';
        if (fuzzyContainer) fuzzyContainer.innerHTML = '';
    }

    searchKeyword(keyword) {
        console.log(`🔍 搜索关键词: ${keyword}`);
        document.getElementById('search-input').value = keyword;
        this.performSearch();
    }

    useSuggestion(term) {
        console.log(`💡 使用建议: ${term}`);
        document.getElementById('search-input').value = term;
        this.performSearch();
    }

    getImageUrl(filename) {
        const basePath = this.getBasePath();
        return `${basePath}/data/images/${this.currentDataType}/${filename}`;
    }

    // 修复后的 openImageViewer 方法 - 完全移除 btoa
    openImageViewer(index) {
        if (!this.searchResults || this.searchResults.length === 0) {
            this.showError('没有搜索结果可查看');
            return;
        }

        console.log(`🖼️ 打开图片查看器，索引: ${index}, 总数: ${this.searchResults.length}`);
        
        try {
            // 将完整数据存储到 sessionStorage
            const viewerData = {
                results: this.searchResults,
                dataType: this.currentDataType,
                currentIndex: index,
                searchQuery: this.currentSearchQuery || ''
            };
            
            // 使用 sessionStorage 存储数据，避免 URL 编码问题
            sessionStorage.setItem('glx48ViewerData', JSON.stringify(viewerData));
            console.log('💾 数据已存储到 sessionStorage');
            
            // 跳转到图片查看器页面（不传递数据参数）
            const basePath = this.getBasePath();
            const viewerUrl = `${basePath}/image-viewer.html`;
            
            console.log(`🔗 跳转到: ${viewerUrl}`);
            window.location.href = viewerUrl;
            
        } catch (error) {
            console.error('❌ 数据存储失败:', error);
            this.showError('无法打开图片查看器，请检查浏览器设置');
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateText(text, length) {
        if (!text) return '';
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }

    showError(message) {
        console.error("❌ 显示错误:", message);
        
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
        
        // 同时在控制台显示错误
        console.error('应用错误:', message);
    }
}

// 初始化应用
console.log("🎯 创建App实例...");
const app = new App();
console.log("✅ App实例创建完成");

// 全局函数供HTML调用
window.searchKeyword = function(keyword) {
    if (window.app) {
        window.app.searchKeyword(keyword);
    }
};

window.useSuggestion = function(term) {
    if (window.app) {
        window.app.useSuggestion(term);
    }
};

// 确保app在全局可访问
window.app = app;