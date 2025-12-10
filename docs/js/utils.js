// docs/js/utils.js
(function () {
    "use strict";
    
    // 数据类型检测
    const toType = function (obj) {
        if (obj == null) return obj + "";
        return typeof obj === "object" || typeof obj === "function" ?
            Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() :
            typeof obj;
    };

    // 防抖函数（用于搜索框输入优化）
    const debounce = function (func, wait, immediate) {
        if (typeof func !== "function") throw new TypeError('func must be a function!');
        
        wait = parseInt(wait) || 300;
        immediate = !!immediate;
        
        let timeout = null;
        
        return function executedFunction() {
            const context = this;
            const args = arguments;
            
            const later = function () {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            
            const callNow = immediate && !timeout;
            
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            
            if (callNow) func.apply(context, args);
        };
    };

    // 节流函数（用于滚动事件优化）
    const throttle = function (func, limit) {
        if (typeof func !== "function") throw new TypeError('func must be a function!');
        
        limit = parseInt(limit) || 300;
        let inThrottle = false;
        
        return function () {
            const context = this;
            const args = arguments;
            
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    // 安全获取嵌套对象属性
    const get = function (obj, path, defaultValue = null) {
        if (obj == null) return defaultValue;
        
        const keys = Array.isArray(path) ? path : path.split('.');
        let result = obj;
        
        for (const key of keys) {
            result = result ? result[key] : undefined;
            if (result === undefined || result === null) return defaultValue;
        }
        
        return result === undefined || result === null ? defaultValue : result;
    };

    // 图片加载辅助函数
    const loadImage = function (src, alt = '') {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
            img.alt = alt;
            img.loading = 'lazy'; // 原生懒加载
        });
    };

    // 本地存储辅助函数
    const storage = {
        set: function (key, value) {
            try {
                if (typeof value === 'object') {
                    value = JSON.stringify(value);
                }
                localStorage.setItem(key, value);
                return true;
            } catch (error) {
                console.warn('localStorage set failed:', error);
                return false;
            }
        },
        
        get: function (key, defaultValue = null) {
            try {
                let value = localStorage.getItem(key);
                if (value === null) return defaultValue;
                
                try {
                    return JSON.parse(value);
                } catch {
                    return value;
                }
            } catch (error) {
                console.warn('localStorage get failed:', error);
                return defaultValue;
            }
        },
        
        remove: function (key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.warn('localStorage remove failed:', error);
                return false;
            }
        }
    };

    // 错误处理函数
    const errorHandler = {
        show: function (message, type = 'error') {
            const errorDiv = document.createElement('div');
            errorDiv.className = `alert alert-${type}`;
            errorDiv.innerHTML = `
                <span>${message}</span>
                <button onclick="this.parentElement.remove()" style="margin-left:10px;">×</button>
            `;
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                background: ${type === 'error' ? '#f8d7da' : '#d1ecf1'};
                color: ${type === 'error' ? '#721c24' : '#0c5460'};
                border: 1px solid ${type === 'error' ? '#f5c6cb' : '#bee5eb'};
                border-radius: 5px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(errorDiv);
            
            setTimeout(() => {
                if (errorDiv.parentElement) {
                    errorDiv.remove();
                }
            }, 5000);
        },
        
        hideAll: function () {
            document.querySelectorAll('.alert').forEach(alert => alert.remove());
        }
    };

    // 移动端检测和适配
    const isMobile = function () {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    // URL参数解析
    const getUrlParams = function () {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);
        
        for (const [key, value] of urlParams.entries()) {
            params[key] = value;
        }
        
        return params;
    };

    // 设置URL参数（不刷新页面）
    const setUrlParam = function (key, value) {
        const url = new URL(window.location);
        if (value === null || value === undefined || value === '') {
            url.searchParams.delete(key);
        } else {
            url.searchParams.set(key, value);
        }
        window.history.pushState({}, '', url);
    };

    // 导出到全局作用域
    window.AppUtils = {
        toType,
        debounce,
        throttle,
        get,
        loadImage,
        storage,
        errorHandler,
        isMobile,
        getUrlParams,
        setUrlParam
    };

})();