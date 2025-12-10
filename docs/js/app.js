class App {
    constructor() {
        this.currentDataType = 'single_skill';
        this.currentData = null;
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
    }

    async loadData() {
        try {
            // 使用相对路径，适应 GitHub Pages 的部署结构
            const response = await fetch(`../data/json/${this.currentDataType}.json`);
            this.currentData = await response.json();
            console.log(`加载${this.currentDataType}数据成功`);
        } catch (error) {
            this.showError('数据加载失败，请检查后端数据是否已生成。');
            console.error('数据加载错误:', error);
        }
    }

    setupEventListeners() {
        // 导航切换
        document.querySelectorAll('.nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentDataType = e.target.dataset.type;
                this.loadData();
                // 更新激活状态
                document.querySelectorAll('.nav a').forEach(a => a.classList.remove('nav-active'));
                e.target.classList.add('nav-active');
            });
        });

        // 搜索功能
        document.getElementById('search-btn').addEventListener('click', () => this.performSearch());
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
    }

    performSearch() {
        if (!this.currentData) {
            this.showError('数据尚未加载完成，请稍后重试。');
            return;
        }

        const query = document.getElementById('search-input').value.trim();
        const filterType = document.getElementById('filter-type').value;

        if (!query) {
            this.showError('请输入搜索关键词');
            return;
        }

        const searchResults = new SearchEngine(this.currentData).search(query, filterType);
        this.displayResults(searchResults);
    }

    displayResults(results) {
        this.displayExactResults(results.exact);
        this.displayFuzzySuggestions(results.fuzzy);
    }

    displayExactResults(results) {
        const container = document.getElementById('exact-images');
        
        if (results.length === 0) {
            container.innerHTML = '<p>没有找到精确匹配的结果</p>';
            return;
        }

        container.innerHTML = results.map(item => `
            <div class="image-item">
                <img src="data/images/${this.currentDataType}/${item.filename}" 
                     alt="${item.filename}" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjEwMCIgeT0iNzUiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPua1i+ivleWbvuWDjzwvdGV4dD48L3N2Zz4='">
                <p>${item.filename}</p>
                <div>${item.keywords.map(kw => 
                    `<span class="keyword-tag" onclick="app.searchKeyword('${kw}')">${kw}</span>`
                ).join('')}</div>
            </div>
        `).join('');
    }

    displayFuzzySuggestions(suggestions) {
        const container = document.getElementById('fuzzy-suggestions');
        
        if (suggestions.length === 0) {
            container.innerHTML = '<p>没有找到模糊匹配的建议</p>';
            return;
        }

        container.innerHTML = suggestions.map(item => `
            <div class="suggestion-item" onclick="app.useSuggestion('${item.matchedTerm}')">
                匹配项: ${item.matchedTerm} (文件名: ${item.filename})
            </div>
        `).join('');
    }

    searchKeyword(keyword) {
        document.getElementById('search-input').value = keyword;
        this.performSearch();
    }

    useSuggestion(term) {
        document.getElementById('search-input').value = term;
        this.performSearch();
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => errorDiv.style.display = 'none', 5000);
    }
}

// 初始化应用
const app = new App();