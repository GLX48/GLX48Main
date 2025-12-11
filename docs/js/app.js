// docs/js/app.js
console.log("🎵 GLX48 应援查询系统初始化中...");

class App {
    constructor() {
        this.currentDataType = 'single_skill';
        this.currentData = [];
        this.searchResults = [];
        this.currentSearchQuery = '';
        this.searchEngine = new SearchEngine();
        this.currentContentToCopy = '';
        this.currentImageIndex = 0;
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
            console.log(`📖📖 正在加载 ${this.currentDataType} 数据...`);
            
            const basePath = this.getBasePath();
            const jsonPath = `${basePath}/data/json/${this.currentDataType}.json`;
            console.log(`📍 JSON路径: ${jsonPath}`);
            
            const response = await fetch(jsonPath);
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`✅ 成功加载数据，共 ${data.length} 条记录:`, data);
            
            this.currentData = data;
            this.displayData();
            
        } catch (error) {
            console.error('❌❌ 数据加载失败:', error);
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
        
        // 模态框关闭按钮
        const modalClose = document.getElementById('modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeModal();
            });
        }
        
        // 点击模态框外部关闭
        const modal = document.getElementById('image-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // 模糊搜索建议的事件监听（使用事件委托）
        const fuzzyContainer = document.getElementById('fuzzy-suggestions');
        if (fuzzyContainer) {
            fuzzyContainer.addEventListener('click', (e) => {
                const suggestionItem = e.target.closest('.suggestion-item');
                if (suggestionItem) {
                    const term = suggestionItem.getAttribute('data-term');
                    if (term) {
                        this.useSuggestion(term);
                    }
                }
            });
        }

        
        console.log("✅ 事件监听器设置完成");
    }

    performSearch() {
        console.log("🔍🔍 执行搜索...");
        
        if (!this.currentData || this.currentData.length === 0) {
            this.showError('数据尚未加载完成，请稍后重试。');
            return;
        }
    
        const query = document.getElementById('search-input').value.trim();
        const filterType = document.getElementById('filter-type').value;
        
        this.currentSearchQuery = query;
    
        if (!query) {
            this.clearSearchResults();
            return;
        }
    
        // 使用新的搜索方法
        const results = this.searchEngine.search(this.currentData, query, filterType);
        this.searchResults = results.exact;
        this.displaySearchResults(results);
        
        // 保存搜索历史
        this.searchEngine.saveSearchHistory(query);
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

        container.innerHTML = results.map((item, index) => {
            const imageUrl = this.getImageUrl(item.filename);
            console.log(`🖼️ 生成缩略图: ${imageUrl}`);
            
            return `
                <div class="image-result" data-index="${index}">
                    <div class="image-thumbnail">
                        
                    </div>
                    <div class="image-info">
                        <h4>${this.escapeHtml(item.filename)}</h4>
                        <div class="image-keywords">
                            ${item.keywords ? item.keywords.map(kw => 
                                `<span class="keyword-tag" onclick="event.stopPropagation(); app.searchKeyword('${this.escapeHtml(kw)}')">${this.escapeHtml(kw)}</span>`
                            ).join('') : ''}
                        </div>
                        ${this.currentDataType === 'single_skill' && item.text_content ? `
                            <button class="copy-content-btn" onclick="event.stopPropagation(); app.copyContent('${this.escapeHtml(item.text_content)}')">复制内容</button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // 为每个结果添加点击事件
        container.querySelectorAll('.image-result').forEach((item, index) => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('keyword-tag') && !e.target.classList.contains('copy-content-btn')) {
                    this.openImagePreview(index);
                }
            });
        });

        // 加载缩略图
        this.loadThumbnails();
    }

    // 加载缩略图
    loadThumbnails() {
        const thumbnails = document.querySelectorAll('.image-thumbnail');
        thumbnails.forEach((thumbnail, index) => {
            if (index < this.searchResults.length) {
                const item = this.searchResults[index];
                const imageUrl = this.getImageUrl(item.filename);
                
                const img = new Image();
                img.onload = () => {
                    console.log(`✅ 缩略图加载成功: ${imageUrl}`);
                    thumbnail.innerHTML = '';
                    thumbnail.appendChild(img);
                    img.style.opacity = '0';
                    setTimeout(() => {
                        img.style.opacity = '1';
                    }, 10);
                };
                
                img.onerror = () => {
                    console.error(`❌ 缩略图加载失败: ${imageUrl}`);
                    thumbnail.innerHTML = `
                        <div class="thumbnail-error">
                            <div class="error-icon">❌</div>
                            <div class="error-text">图片加载失败</div>
                        </div>
                    `;
                };
                
                img.src = imageUrl;
                img.alt = item.filename;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                img.style.transition = 'opacity 0.3s ease';
            }
        });
    }

    displayFuzzySuggestions(suggestions) {
        const container = document.getElementById('fuzzy-suggestions');
        if (!container) {
            console.error("❌❌❌❌ 找不到 fuzzy-suggestions 容器");
            return;
        }
    
        if (!suggestions || suggestions.length === 0) {
            container.innerHTML = '<p class="no-results">没有找到模糊匹配的建议</p>';
            return;
        }
    
        // 过滤掉已经在精确匹配中的项目
        const exactFilenames = new Set(this.searchResults.map(item => item.filename));
        const filteredSuggestions = suggestions.filter(item => 
            !exactFilenames.has(item.filename)
        );
    
        if (filteredSuggestions.length === 0) {
            container.innerHTML = '<p class="no-results">没有找到额外的模糊匹配建议</p>';
            return;
        }
    
        // 提取独特的搜索关键词建议
        const keywordSuggestions = this.extractKeywordSuggestions(filteredSuggestions);
        
        let html = '<div class="fuzzy-suggestions-container">';
        
        // 添加关键词搜索建议
        if (keywordSuggestions.length > 0) {
            html += `
                <div class="suggestion-section">
                    <h4>💡 尝试搜索这些关键词：</h4>
                    <div class="keyword-suggestions">
                        ${keywordSuggestions.map(keyword => `
                            <button class="keyword-suggestion-btn" 
                                    onclick="app.searchKeyword('${this.escapeHtml(keyword)}')">
                                ${this.escapeHtml(keyword)}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    
        // 原有的文件匹配建议
        html += `
            <div class="suggestion-section">
                <h4>📄 相关文件：</h4>
                ${filteredSuggestions.map(item => {
                    let suggestionText = '';
                    let matchType = '';
                    
                    switch (item.matchType) {
                        case 'content':
                            suggestionText = `内容包含: "${this.truncateText(item.matchedTerm, 30)}"`;
                            matchType = '内容匹配';
                            break;
                        case 'song_name':
                            suggestionText = `歌曲名: ${item.matchedTerm}`;
                            matchType = '歌曲名';
                            break;
                        case 'keywords':
                            suggestionText = `关键词: ${item.matchedTerm}`;
                            matchType = '关键词';
                            break;
                        default:
                            suggestionText = `匹配: ${item.matchedTerm}`;
                            matchType = '匹配';
                    }
                    
                    return `
                        <div class="suggestion-item" data-filename="${this.escapeHtml(item.filename)}">
                            <div class="suggestion-header">
                                <strong>${this.escapeHtml(item.filename)}</strong>
                                <span class="suggestion-type">${matchType}</span>
                            </div>
                            <div class="suggestion-content">${suggestionText}</div>
                            <div class="suggestion-score">匹配度: ${Math.round(item.matchScore)}%</div>
                            <div class="suggestion-actions">
                                <button class="suggestion-action-btn" 
                                        onclick="app.searchByFilename('${this.escapeHtml(item.filename)}')">
                                    搜索此文件
                                </button>
                                <button class="suggestion-action-btn" 
                                        onclick="app.searchKeyword('${this.escapeHtml(item.matchedTerm)}')">
                                    搜索匹配内容
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        html += '</div>';
        container.innerHTML = html;
    
        // 设置事件监听器
        this.setupSuggestionEventListeners();
    }
    

    // 新增方法：从模糊匹配中提取关键词建议
    extractKeywordSuggestions(suggestions) {
        const keywords = new Set();
        
        suggestions.forEach(item => {
            if (item.matchType === 'keywords' && item.matchedTerm) {
                // 直接使用匹配到的关键词
                keywords.add(item.matchedTerm);
            } else if (item.matchType === 'content' && item.matchedTerm) {
                // 从内容匹配中提取有意义的短语
                const extractedKeywords = this.extractKeywordsFromContent(item.matchedTerm);
                extractedKeywords.forEach(keyword => keywords.add(keyword));
            } else if (item.matchType === 'song_name' && item.matchedTerm) {
                // 歌曲名作为关键词
                keywords.add(item.matchedTerm);
            }
        });
        
        // 限制关键词数量并按长度排序（优先显示短而精确的关键词）
        return Array.from(keywords)
            .filter(keyword => keyword.length >= 2 && keyword.length <= 20)
            .sort((a, b) => a.length - b.length)
            .slice(0, 8); // 最多显示8个关键词建议
    }

    // 新增方法：从内容中提取关键词
    extractKeywordsFromContent(content) {
        if (!content) return [];
        
        const keywords = [];
        const words = content.split(/[\s,，.。!！?？;；]+/); // 中英文标点分割
        
        words.forEach(word => {
            const cleanWord = word.trim();
            if (cleanWord.length >= 2 && cleanWord.length <= 10) {
                // 过滤掉无意义的词和过于常见的词
                const commonWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '知道', '这样', '就是', '但是', '可以', '因为', '如果', '然后', '现在', '已经', '觉得', '真的', '这个', '那个', '什么', '怎么', '为什么', '怎么', '怎么样'];
                
                if (!commonWords.includes(cleanWord) && 
                    !/\d+/.test(cleanWord) && // 排除纯数字
                    !/^[a-zA-Z]{1}$/.test(cleanWord)) { // 排除单个字母
                    keywords.push(cleanWord);
                }
            }
        });
        
        return keywords;
    }

    // 设置建议项事件监听
    setupSuggestionEventListeners() {
        const container = document.getElementById('fuzzy-suggestions');
        if (!container) return;
    
        container.addEventListener('click', (e) => {
            const suggestionItem = e.target.closest('.suggestion-item');
            if (suggestionItem) {
                // 关键修复：使用文件名进行搜索
                const filename = suggestionItem.getAttribute('data-filename');
                if (filename) {
                    this.searchByFilename(filename);
                }
            }
        });
    }

    searchByFilename(filename) {
        console.log(`🔍🔍 通过文件名搜索: ${filename}`);
        
        // 设置搜索框值为文件名
        document.getElementById('search-input').value = filename;
        
        // 执行搜索
        this.performSearch();
        
        // 滚动到精确匹配区域
        setTimeout(() => {
            const exactResults = document.getElementById('exact-results');
            if (exactResults) {
                exactResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }
    
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // 打开图片预览模态框
    openImagePreview(index) {
        if (!this.searchResults || this.searchResults.length === 0) {
            this.showError('没有搜索结果可查看');
            return;
        }
    
        const item = this.searchResults[index];
        const imageUrl = this.getImageUrl(item.filename);
        console.log(`🖼🖼🖼🖼🖼🖼🖼🖼🖼️ 打开图片预览: ${imageUrl}`);
        
        // 设置模态框标题
        document.getElementById('modal-title').textContent = item.filename;
        
        // 清空并设置图片容器
        const imageContainer = document.querySelector('.modal .image-container');
        imageContainer.innerHTML = `
            <div class="image-viewer-container">
                <div class="image-zoom-container">
                    <div class="image-loader">
                        <div class="loader"></div>
                        <p>加载图片中...</p>
                    </div>
                </div>
                <div class="zoom-controls">
                    <button class="zoom-btn zoom-in" onclick="app.zoomIn()">+</button>
                    <button class="zoom-btn zoom-out" onclick="app.zoomOut()">-</button>
                    <div class="zoom-level">100%</div>
                </div>
                <button class="reset-btn" onclick="app.resetZoom()">重置</button>
            </div>
        `;
        
        // 创建图片元素
        const img = new Image();
        const zoomContainer = document.querySelector('.image-zoom-container');
        
        img.onload = () => {
            console.log('✅ 模态框图片加载成功');
            zoomContainer.innerHTML = '';
            zoomContainer.appendChild(img);
            
            // 初始化手势支持
            this.setupGestureSupport(zoomContainer, img);
            
            
            // 更新计数器文本（使用HTML中已有的计数器）
            this.updateImageCounter(index);
        };
        
        img.onerror = () => {
            console.error('❌❌❌❌ 模态框图片加载失败');
            zoomContainer.innerHTML = `
                <div class="image-error">
                    <div class="error-icon">❌❌❌❌</div>
                    <h3>无法加载图片</h3>
                    <p>文件: ${this.escapeHtml(item.filename)}</p>
                    <p>路径: ${imageUrl}</p>
                    <button class="retry-btn" onclick="app.retryModalImage('${this.escapeHtml(imageUrl)}', '${this.escapeHtml(item.filename)}')">重试加载</button>
                </div>
            `;
        };
        
        img.src = imageUrl;
        img.alt = item.filename;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';
        
        // 显示模态框
        document.getElementById('image-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // 存储当前索引用于导航
        this.currentImageIndex = index;
        
        // 初始化缩放和位置状态
        this.imageZoomLevel = 1;
        this.imagePosition = { x: 0, y: 0 };
        this.isDragging = false;
        
        // 更新计数器（使用HTML中已有的计数器）
        this.updateImageCounter(index);
        
    }

    updateImageCounter(index) {
        const counterElement = document.getElementById('image-counter');
        if (counterElement) {
            counterElement.textContent = `${index + 1} / ${this.searchResults.length}`;
        }
    }
    
    
    // 修改：移除 addImageCounter 方法中的动态创建，改为更新现有计数器
    addImageCounter(index) {
        // 直接更新HTML中已有的计数器
        this.updateImageCounter(index);
    }

    // 关闭模态框
    closeModal() {
        document.getElementById('image-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // 清理控制元素
        this.removeImageCounter();
        // this.removeNavigationControls();
        
        // 重置状态
        this.imageZoomLevel = 1;
        this.imagePosition = { x: 0, y: 0 };
        this.isDragging = false;
    }
    
    // 上一张图片
    prevImage() {
        if (this.searchResults.length <= 1) return;
        
        this.currentImageIndex--;
        if (this.currentImageIndex < 0) {
            this.currentImageIndex = this.searchResults.length - 1;
        }
        
        this.openImagePreview(this.currentImageIndex);
        this.updateImageCounter(this.currentImageIndex); // 更新计数器
    }

    // 下一张图片
    nextImage() {
        if (this.searchResults.length <= 1) return;
        
        this.currentImageIndex++;
        if (this.currentImageIndex >= this.searchResults.length) {
            this.currentImageIndex = 0;
        }
        
        this.openImagePreview(this.currentImageIndex);
        this.updateImageCounter(this.currentImageIndex); // 更新计数器
    }
    

    // 复制内容到剪贴板
    copyContent(content) {
        if (!content) {
            this.showError('没有可复制的内容');
            return;
        }
        
        // 解码HTML实体
        const tempElement = document.createElement('textarea');
        tempElement.innerHTML = content;
        const decodedContent = tempElement.value;
        
        navigator.clipboard.writeText(decodedContent).then(() => {
            this.showTemporaryMessage('内容已复制到剪贴板');
            console.log('✅ 内容已复制到剪贴板');
        }).catch(err => {
            console.error('❌ 复制失败:', err);
            this.showError('复制失败，请手动复制内容');
        });
    }

    // 显示临时消息
    showTemporaryMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            z-index: 1001;
            font-size: 16px;
        `;
        
        document.body.appendChild(messageElement);
        
        // 2秒后移除消息
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 2000);
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
        console.log(`💡💡 使用建议: ${term}`);
        
        // 清理建议中的省略号等
        const cleanTerm = term.replace(/^\.\.\.|\.\.\.$/g, '').trim();
        
        // 设置搜索框值
        document.getElementById('search-input').value = cleanTerm;
        
        // 执行搜索
        this.performSearch();
        
        // 滚动到精确匹配区域
        setTimeout(() => {
            const exactResults = document.getElementById('exact-results');
            if (exactResults) {
                exactResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }

    // 获取匹配类型标签
    getMatchTypeLabel(matchType) {
        const labels = {
            'content': '内容匹配',
            'song_name': '歌曲名',
            'keywords': '关键词',
            'filename': '文件名'
        };
        return labels[matchType] || '匹配';
    }

    // 转义HTML
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getImageUrl(filename) {
        const basePath = this.getBasePath();
        return `${basePath}/data/images/${this.currentDataType}/${filename}`;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
        
        console.error('应用错误:', message);
    }

        // 设置手势支持
    setupGestureSupport(container, img) {
        // 鼠标事件
        container.addEventListener('mousedown', this.handleImageMouseDown.bind(this));
        container.addEventListener('wheel', this.handleImageWheel.bind(this), { passive: false });
        
        // 触摸事件
        container.addEventListener('touchstart', this.handleImageTouchStart.bind(this));
        container.addEventListener('touchmove', this.handleImageTouchMove.bind(this));
        container.addEventListener('touchend', this.handleImageTouchEnd.bind(this));
        
        // 双击重置
        container.addEventListener('dblclick', () => {
            this.resetImageTransform(container);
        });
    }

    // 鼠标按下事件
    handleImageMouseDown(e) {
        if (e.button !== 0) return; // 只处理左键
        
        this.isDragging = true;
        this.dragStart = { x: e.clientX - this.imagePosition.x, y: e.clientY - this.imagePosition.y };
        
        // 更改光标样式
        const container = document.querySelector('.image-viewer-container');
        container.classList.add('grabbing');
        
        // 添加全局鼠标事件
        document.addEventListener('mousemove', this.handleImageMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleImageMouseUp.bind(this));
        
        e.preventDefault();
    }

    // 鼠标移动事件
    handleImageMouseMove(e) {
        if (!this.isDragging) return;
        
        this.imagePosition.x = e.clientX - this.dragStart.x;
        this.imagePosition.y = e.clientY - this.dragStart.y;
        
        this.updateImageTransform();
        
        e.preventDefault();
    }

    // 鼠标释放事件
    handleImageMouseUp() {
        this.isDragging = false;
        const container = document.querySelector('.image-viewer-container');
        container.classList.remove('grabbing');
        
        // 移除全局事件
        document.removeEventListener('mousemove', this.handleImageMouseMove);
        document.removeEventListener('mouseup', this.handleImageMouseUp);
    }

    // 鼠标滚轮事件
    handleImageWheel(e) {
        e.preventDefault();
        
        const zoomIntensity = 0.1;
        const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
        
        this.imageZoomLevel = Math.max(0.5, Math.min(3, this.imageZoomLevel + delta)); // 最小50%
        this.updateImageTransform();
    }

    // 触摸开始事件
    handleImageTouchStart(e) {
        if (e.touches.length === 1) {
            // 单指触摸 - 拖动
            this.isDragging = true;
            this.dragStart = { 
                x: e.touches[0].clientX - this.imagePosition.x, 
                y: e.touches[0].clientY - this.imagePosition.y 
            };
        } else if (e.touches.length === 2) {
            // 双指触摸 - 缩放
            this.startDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
            this.startZoom = this.imageZoomLevel;
        }
        
        e.preventDefault();
    }

    // 触摸移动事件
    handleImageTouchMove(e) {
        if (e.touches.length === 1 && this.isDragging) {
            // 单指移动 - 拖动
            this.imagePosition.x = e.touches[0].clientX - this.dragStart.x;
            this.imagePosition.y = e.touches[0].clientY - this.dragStart.y;
            this.updateImageTransform();
        } else if (e.touches.length === 2) {
            // 双指移动 - 缩放
            const currentDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
            const zoomFactor = currentDistance / this.startDistance;
            this.imageZoomLevel = this.startZoom * zoomFactor;
            
            // 限制缩放范围（最小50%，最大300%）
            this.imageZoomLevel = Math.max(0.5, Math.min(3, this.imageZoomLevel));
            this.updateImageTransform();
        }
        
        e.preventDefault();
    }

    // 触摸结束事件
    handleImageTouchEnd(e) {
        this.isDragging = false;
    }

    // 获取触摸点距离
    getTouchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // 更新图片变换
    updateImageTransform() {
        const container = document.querySelector('.image-zoom-container');
        if (!container) return;
        
        // 限制位置
        this.constrainImagePosition();
        
        container.style.transform = `translate(${this.imagePosition.x}px, ${this.imagePosition.y}px) scale(${this.imageZoomLevel})`;
        
        // 更新缩放级别显示
        this.updateZoomLevelDisplay();
    }

    // 限制图片位置
    constrainImagePosition() {
        const container = document.querySelector('.image-zoom-container');
        const img = container.querySelector('img');
        
        if (!img) return;
        
        // 获取容器和图片的实际尺寸
        const containerRect = container.parentElement.getBoundingClientRect();
        const imgRect = img.getBoundingClientRect();
        
        // 计算图片缩放后的实际尺寸
        const imgWidth = imgRect.width;
        const imgHeight = imgRect.height;
        
        // 计算可移动的最大范围
        const maxX = Math.max(0, (imgWidth - containerRect.width) / 2);
        const maxY = Math.max(0, (imgHeight - containerRect.height) / 2);
        
        // 应用限制
        this.imagePosition.x = Math.max(-maxX, Math.min(maxX, this.imagePosition.x));
        this.imagePosition.y = Math.max(-maxY, Math.min(maxY, this.imagePosition.y));
    }

    // 更新缩放级别显示
    updateZoomLevelDisplay() {
        const zoomLevelElement = document.querySelector('.zoom-level');
        if (zoomLevelElement) {
            zoomLevelElement.textContent = Math.round(this.imageZoomLevel * 100) + '%';
        }
    }

    // 放大图片
    zoomIn() {
        this.imageZoomLevel = Math.min(3, this.imageZoomLevel + 0.2);
        this.updateImageTransform();
    }
    
    zoomOut() {
        this.imageZoomLevel = Math.max(0.5, this.imageZoomLevel - 0.2); // 最小50%
        this.updateImageTransform();
    }

    // 重置图片变换
    resetZoom() {
        this.imageZoomLevel = 1;
        this.imagePosition = { x: 0, y: 0 };
        this.updateImageTransform();
    }

    // 添加图片计数器
    addImageCounter(index) {
        // 先移除可能存在的旧计数器
        this.removeImageCounter();
        
        const counter = document.createElement('div');
        counter.className = 'image-counter';
        counter.textContent = `${index + 1} / ${this.searchResults.length}`;
        document.querySelector('.modal-content').appendChild(counter);
    }
    removeImageCounter() {
        const existingCounter = document.querySelector('.image-counter');
        if (existingCounter) {
            existingCounter.remove();
        }
    }
    // 重试加载模态框图片
    retryModalImage(imageUrl, filename) {
        const imageContainer = document.querySelector('.modal .image-container');
        imageContainer.innerHTML = '<div class="image-loader"><div class="loader"></div><p>重新加载中...</p></div>';
        
        const img = new Image();
        img.onload = () => {
            const zoomContainer = document.querySelector('.image-zoom-container');
            zoomContainer.innerHTML = '';
            zoomContainer.appendChild(img);
            
            // 重新设置手势支持
            this.setupGestureSupport(zoomContainer, img);
        };
        
        img.onerror = () => {
            const zoomContainer = document.querySelector('.image-zoom-container');
            zoomContainer.innerHTML = '<div class="image-error">重试加载失败，请检查网络连接</div>';
        };
        
        img.src = imageUrl + '?retry=' + Date.now();
        img.alt = filename;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';
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

window.copyContent = function(content) {
    if (window.app) {
        window.app.copyContent(content);
    }
};

window.prevImage = function() {
    if (window.app) {
        window.app.prevImage();
    }
};

window.nextImage = function() {
    if (window.app) {
        window.app.nextImage();
    }
};

// 确保app在全局可访问
window.app = app;

// ESC键关闭模态框
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (window.app) {
            window.app.closeModal();
        }
    }
});