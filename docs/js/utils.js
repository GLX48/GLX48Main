// docs/js/utils.js
console.log("🛠️ 工具函数库初始化...");

(function() {
    "use strict";
    
    // 工具函数库
    const Utils = {
        // 数据类型检测
        toType: function(obj) {
            if (obj === null || obj === undefined) return String(obj);
            return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
        },
        
        // 防抖函数
        debounce: function(func, wait, immediate) {
            if (typeof func !== 'function') {
                throw new TypeError('debounce: 第一个参数必须是函数');
            }
            
            let timeout = null;
            
            return function executedFunction() {
                const context = this;
                const args = arguments;
                
                const later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                
                const callNow = immediate && !timeout;
                
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                
                if (callNow) func.apply(context, args);
            };
        },
        
        // 节流函数
        throttle: function(func, limit) {
            if (typeof func !== 'function') {
                throw new TypeError('throttle: 第一个参数必须是函数');
            }
            
            let inThrottle = false;
            
            return function() {
                const context = this;
                const args = arguments;
                
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        // 安全获取嵌套对象属性
        get: function(obj, path, defaultValue = null) {
            if (obj == null) return defaultValue;
            
            const keys = Array.isArray(path) ? path : String(path).split('.').filter(key => key !== '');
            let result = obj;
            
            for (const key of keys) {
                if (result == null || result[key] === undefined) {
                    return defaultValue;
                }
                result = result[key];
            }
            
            return result === undefined || result === null ? defaultValue : result;
        },
        
        // 图片加载辅助
        loadImage: function(src, alt = '') {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = (error) => reject(new Error(`图片加载失败: ${src}`));
                img.src = src;
                img.alt = alt;
                img.loading = 'lazy';
            });
        },
        
        // 本地存储管理
        storage: {
            set: function(key, value) {
                try {
                    if (typeof value === 'object') {
                        value = JSON.stringify(value);
                    }
                    localStorage.setItem(key, value);
                    return true;
                } catch (error) {
                    console.warn('localStorage 设置失败:', error);
                    return false;
                }
            },
            
            get: function(key, defaultValue = null) {
                try {
                    let value = localStorage.getItem(key);
                    if (value === null) return defaultValue;
                    
                    try {
                        return JSON.parse(value);
                    } catch {
                        return value;
                    }
                } catch (error) {
                    console.warn('localStorage 获取失败:', error);
                    return defaultValue;
                }
            },
            
            remove: function(key) {
                try {
                    localStorage.removeItem(key);
                    return true;
                } catch (error) {
                    console.warn('localStorage 删除失败:', error);
                    return false;
                }
            },
            
            clear: function() {
                try {
                    localStorage.clear();
                    return true;
                } catch (error) {
                    console.warn('localStorage 清空失败:', error);
                    return false;
                }
            }
        },
        
        // 错误处理
        errorHandler: {
            show: function(message, type = 'error', duration = 5000) {
                // 移除现有错误消息
                this.hideAll();
                
                const errorDiv = document.createElement('div');
                errorDiv.className = `alert alert-${type}`;
                errorDiv.innerHTML = `
                    <span>${this.escapeHtml(message)}</span>
                    <button class="alert-close" onclick="this.parentElement.remove()">×</button>
                `;
                
                errorDiv.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    background: ${type === 'error' ? '#f8d7da' : '#d1ecf1'};
                    color: ${type === 'error' ? '#721c24' : '#0c5460'};
                    border: 1px solid ${type === 'error' ? '#f5c6cb' : '#bee5eb'};
                    border-radius: 8px;
                    z-index: 10000;
                    max-width: 400px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    animation: slideInRight 0.3s ease;
                `;
                
                // 添加关闭按钮样式
                const closeBtn = errorDiv.querySelector('.alert-close');
                closeBtn.style.cssText = `
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    margin-left: 10px;
                    float: right;
                `;
                
                document.body.appendChild(errorDiv);
                
                // 自动隐藏
                if (duration > 0) {
                    setTimeout(() => {
                        if (errorDiv.parentElement) {
                            errorDiv.remove();
                        }
                    }, duration);
                }
                
                return errorDiv;
            },
            
            hideAll: function() {
                document.querySelectorAll('.alert').forEach(alert => alert.remove());
            }
        },
        
        // 移动端检测
        isMobile: function() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   window.innerWidth <= 768;
        },
        
        // URL参数处理
        getUrlParams: function() {
            const params = {};
            const urlParams = new URLSearchParams(window.location.search);
            
            for (const [key, value] of urlParams.entries()) {
                params[key] = value;
            }
            
            return params;
        },
        
        setUrlParam: function(key, value, replace = false) {
            const url = new URL(window.location);
            
            if (value === null || value === undefined || value === '') {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, value);
            }
            
            if (replace) {
                window.history.replaceState({}, '', url);
            } else {
                window.history.pushState({}, '', url);
            }
        },
        
        // 字符串处理
        escapeHtml: function(text) {
            if (text == null) return '';
            
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        truncateText: function(text, length, suffix = '...') {
            if (typeof text !== 'string') return '';
            if (text.length <= length) return text;
            
            return text.substring(0, length) + suffix;
        },
        
        // 格式化文件大小
        formatFileSize: function(bytes) {
            if (bytes === 0) return '0 Bytes';
            
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },
        
        // 日期格式化
        formatDate: function(date, format = 'YYYY-MM-DD') {
            const d = new Date(date);
            if (isNaN(d.getTime())) return 'Invalid Date';
            
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            
            return format
                .replace('YYYY', year)
                .replace('MM', month)
                .replace('DD', day)
                .replace('HH', hours)
                .replace('mm', minutes)
                .replace('ss', seconds);
        },
        
        // 深拷贝
        deepClone: function(obj) {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Date) return new Date(obj.getTime());
            if (obj instanceof Array) return obj.map(item => this.deepClone(item));
            if (obj instanceof Object) {
                const clonedObj = {};
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        clonedObj[key] = this.deepClone(obj[key]);
                    }
                }
                return clonedObj;
            }
        },
        
        // 随机ID生成
        generateId: function(length = 8) {
            return Math.random().toString(36).substring(2, 2 + length);
        },
        
        // 数组去重
        uniqueArray: function(arr, key = null) {
            if (!Array.isArray(arr)) return [];
            
            if (key) {
                const seen = new Set();
                return arr.filter(item => {
                    const value = item[key];
                    if (seen.has(value)) {
                        return false;
                    }
                    seen.add(value);
                    return true;
                });
            } else {
                return [...new Set(arr)];
            }
        }
    };
    
    // 添加CSS动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // 导出到全局
    window.AppUtils = Utils;
    
    console.log("✅ 工具函数库加载完成");
})();