// 主脚本文件 - 初始化应用程序

// 全局变量
// 主题状态由 theme-switcher.js 统一管理，这里不再重复声明 currentTheme 以避免全局冲突
let visitorCount = 0;
let githubData = null;

// DOM元素
let loadingScreen, terminalOutput, visitorCountElement, currentTimeElement;
let repoCountElement, totalStarsElement, followersElement, contributionsElement;
let activityGraph, focusTags, articlesContainer;

// 在初始化时获取DOM元素
function getDOMElements() {
    loadingScreen = document.getElementById('loading-screen');
    terminalOutput = document.getElementById('terminal-output');
    visitorCountElement = document.getElementById('visitor-count');
    currentTimeElement = document.getElementById('current-time');
    repoCountElement = document.getElementById('repo-count');
    totalStarsElement = document.getElementById('total-stars');
    followersElement = document.getElementById('followers');
    contributionsElement = document.getElementById('contributions');
    activityGraph = document.getElementById('activity-graph');
    focusTags = document.getElementById('focus-tags');
    articlesContainer = document.getElementById('articles-container');
    
    // 检查关键元素是否存在
    if (!loadingScreen) {
        console.error('关键元素 #loading-screen 未找到');
    }
    if (!terminalOutput) {
        console.error('关键元素 #terminal-output 未找到');
    }
}

// 模拟数据 - 在实际应用中应该从API获取
const mockArticles = [
    {
        title: "Three.js 与 WebGL：创建交互式3D可视化",
        description: "探索使用Three.js构建沉浸式数据可视化的最佳实践和性能优化技巧。",
        readTime: "8分钟",
        tags: ["Three.js", "WebGL", "可视化"],
        icon: "fas fa-cube"
    },
    {
        title: "GitHub API 高级应用：自动化开发工作流",
        description: "如何利用GitHub API构建自动化工具，提升项目管理和代码部署效率。",
        readTime: "10分钟",
        tags: ["GitHub API", "自动化", "工作流"],
        icon: "fab fa-github"
    },
    {
        title: "粒子系统性能优化：从CPU到GPU",
        description: "大规模粒子系统的优化策略，实现流畅的视觉特效而不影响性能。",
        readTime: "12分钟",
        tags: ["性能优化", "粒子系统", "WebGL"],
        icon: "fas fa-atom"
    },
    {
        title: "全息UI设计：未来界面的实现原理",
        description: "结合科幻美学与现代Web技术，创建具有未来感的用户界面。",
        readTime: "15分钟",
        tags: ["UI设计", "全息", "未来感"],
        icon: "fas fa-eye"
    },
    {
        title: "Web Audio API：打造沉浸式音效体验",
        description: "利用Web Audio API为交互式网站添加动态音效和音乐生成功能。",
        readTime: "9分钟",
        tags: ["Web Audio", "音效", "交互"],
        icon: "fas fa-volume-up"
    }
];

const mockFocusTags = [
    "Three.js", "WebGL", "React", "Node.js", "Python", 
    "数据可视化", "UI/UX", "性能优化", "API设计"
];

// 初始化函数
function init() {
    try {
        // 获取DOM元素
        getDOMElements();
        
        // 设置RGB颜色变量
        setThemeRGBValues();
        
        // 初始化时钟
        updateClock();
        setInterval(updateClock, 1000);
        
        // 初始化访客计数
        initVisitorCount();
        
        // 加载模拟数据
        loadMockData();
        
        // 初始化3D场景
        init3DScene();
        
        // 初始化GitHub数据（模拟）
        initGitHubData();
    } catch (error) {
        console.error('初始化过程中发生错误:', error);
        // 确保即使出错也更新终端
        setTimeout(() => {
            addTerminalLine('> 初始化过程中发生错误，使用模拟数据');
            // 更新显示数据
            if (repoCountElement) repoCountElement.textContent = '24';
            if (totalStarsElement) totalStarsElement.textContent = '156';
            if (followersElement) followersElement.textContent = '42';
            if (contributionsElement) contributionsElement.textContent = '1,248';
            // 隐藏加载屏幕
            hideLoadingScreen();
        }, 1500);
    }
    
    // 初始化主题切换
    initThemeSwitcher();
}

// 设置RGB颜色值
function setThemeRGBValues() {
    const style = document.documentElement.style;
    
    // 解析颜色为RGB
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : {r: 0, g: 255, b: 65};
    }
    
    // 设置CSS变量
    const primaryHex = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    const primaryRgb = hexToRgb(primaryHex);
    style.setProperty('--primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
    
    const accentHex = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    const accentRgb = hexToRgb(accentHex);
    style.setProperty('--accent-rgb', `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`);
}

// 更新时钟
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('zh-CN', {hour12: false});
    currentTimeElement.textContent = timeString;
}

// 初始化访客计数
function initVisitorCount() {
    // 从本地存储获取或初始化
    const storedCount = localStorage.getItem('visitorCount');
    const lastVisitDate = localStorage.getItem('lastVisitDate');
    const today = new Date().toDateString();
    
    if (lastVisitDate !== today) {
        // 新的一天，重置计数
        visitorCount = 1;
        localStorage.setItem('lastVisitDate', today);
    } else {
        // 同一天，增加计数
        visitorCount = storedCount ? parseInt(storedCount) + 1 : 1;
    }
    
    // 保存到本地存储
    localStorage.setItem('visitorCount', visitorCount.toString());
    
    // 更新显示
    visitorCountElement.textContent = visitorCount;
    
    // 模拟实时访客
    setInterval(() => {
        if (Math.random() > 0.7) {
            visitorCount++;
            visitorCountElement.textContent = visitorCount;
            localStorage.setItem('visitorCount', visitorCount.toString());
        }
    }, 30000); // 每30秒可能增加一个访客
}

// 加载模拟数据
function loadMockData() {
    // 加载文章
    renderArticles();
    
    // 加载焦点标签
    renderFocusTags();
    
    // 生成模拟活动图
    generateActivityGraph();
}

// 渲染文章
function renderArticles() {
    articlesContainer.innerHTML = '';
    
    mockArticles.forEach(article => {
        const articleCard = document.createElement('div');
        articleCard.className = 'article-card';
        
        const tagsHtml = article.tags.map(tag => 
            `<span class="article-tag">${tag}</span>`
        ).join('');
        
        articleCard.innerHTML = `
            <h5><i class="${article.icon}"></i> ${article.title}</h5>
            <p>${article.description}</p>
            <div class="article-meta">
                <div class="article-tags">${tagsHtml}</div>
                <div class="article-read-time">${article.readTime}</div>
            </div>
        `;
        
        // 添加点击事件
        articleCard.addEventListener('click', () => {
            addTerminalLine(`> 正在打开文章: "${article.title}"`);
            // 在实际应用中，这里应该导航到文章页面
            window.open('#', '_blank');
        });
        
        articlesContainer.appendChild(articleCard);
    });
}

// 渲染焦点标签
function renderFocusTags() {
    focusTags.innerHTML = '';
    
    mockFocusTags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'focus-tag';
        tagElement.textContent = tag;
        
        tagElement.addEventListener('click', () => {
            addTerminalLine(`> 筛选标签: ${tag}`);
            // 在实际应用中，这里应该根据标签筛选内容
        });
        
        focusTags.appendChild(tagElement);
    });
}

// 生成模拟活动图
function generateActivityGraph() {
    activityGraph.innerHTML = '';
    
    // 生成28个格子（4周）
    for (let i = 0; i < 28; i++) {
        const cell = document.createElement('div');
        cell.className = 'activity-cell';
        
        // 随机决定是否活跃
        const isActive = Math.random() > 0.4;
        if (isActive) {
            cell.classList.add('active');
            
            // 随机设置强度
            const intensity = Math.random();
            cell.style.opacity = 0.3 + intensity * 0.7;
            
            // 添加悬停效果
            cell.addEventListener('mouseenter', () => {
                const day = i % 7;
                const week = Math.floor(i / 7);
                const contributions = Math.floor(Math.random() * 10) + 1;
                addTerminalLine(`> 第${week+1}周，星期${day+1}: ${contributions}次提交`);
            });
        }
        
        activityGraph.appendChild(cell);
    }
}

// 添加终端行
function addTerminalLine(text) {
    // 确保terminalOutput存在
    if (!terminalOutput) {
        terminalOutput = document.getElementById('terminal-output');
        if (!terminalOutput) {
            console.warn('终端输出元素未找到');
            return;
        }
    }
    
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = text;
    
    terminalOutput.appendChild(line);
    
    // 限制行数
    while (terminalOutput.children.length > 5) {
        terminalOutput.removeChild(terminalOutput.firstChild);
    }
    
    // 滚动到底部
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

// 初始化3D场景
function init3DScene() {
    // 这个函数在three-scene.js中定义
    if (typeof initThreeScene === 'function') {
        initThreeScene();
    } else {
        console.warn('Three.js场景初始化函数未找到');
    }
}

// 初始化GitHub数据
function initGitHubData() {
    // 这个函数在github-data.js中定义
    if (typeof loadGitHubData === 'function') {
        // 添加超时处理，确保加载界面总会消失
        const githubTimeout = setTimeout(() => {
            console.warn('GitHub数据加载超时，使用模拟数据');
            if (window.addTerminalLine) {
                window.addTerminalLine('> GitHub数据加载超时，使用模拟数据');
            }
            // 更新UI显示模拟数据
            repoCountElement.textContent = '24';
            totalStarsElement.textContent = '156';
            followersElement.textContent = '42';
            contributionsElement.textContent = '1,248';
            
            // 隐藏加载屏幕
            hideLoadingScreen();
        }, 5000); // 5秒后超时
        
        loadGitHubData().then(() => {
            clearTimeout(githubTimeout);
            hideLoadingScreen();
        }).catch(error => {
            console.error('加载GitHub数据时发生错误:', error);
            clearTimeout(githubTimeout);
            hideLoadingScreen();
        });
    } else {
        // 使用模拟数据作为后备
        setTimeout(() => {
            repoCountElement.textContent = '24';
            totalStarsElement.textContent = '156';
            followersElement.textContent = '42';
            contributionsElement.textContent = '1,248';
            addTerminalLine('> GitHub数据加载完成 (模拟数据)');
            hideLoadingScreen();
        }, 1500);
    }
}

// 隐藏加载屏幕
function hideLoadingScreen() {
    // 确保loadingScreen存在
    if (!loadingScreen) {
        loadingScreen = document.getElementById('loading-screen');
    }
    
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            addTerminalLine("> 全息控制台已就绪");
            addTerminalLine("> 输入 'help' 查看可用命令");
        }, 1000);
    } else {
        console.warn('加载屏幕元素未找到');
    }
}

// 初始化主题切换
function initThemeSwitcher() {
    // 这个函数在theme-switcher.js中定义
    if (typeof initThemeSwitching === 'function') {
        initThemeSwitching();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 最终安全保障：确保加载屏幕在10秒后一定被隐藏
setTimeout(() => {
    console.log('触发最终安全保障机制');
    if (typeof hideLoadingScreen === 'function') {
        hideLoadingScreen();
    } else {
        // 直接通过DOM操作隐藏加载屏幕
        const loadingScreenEl = document.getElementById('loading-screen');
        if (loadingScreenEl) {
            loadingScreenEl.style.opacity = '0';
            setTimeout(() => {
                loadingScreenEl.style.display = 'none';
            }, 1000);
        }
        
        // 添加终端消息
        const terminalOutputEl = document.getElementById('terminal-output');
        if (terminalOutputEl) {
            const line = document.createElement('div');
            line.className = 'terminal-line';
            line.textContent = '> 紧急模式：全息控制台已就绪';
            terminalOutputEl.appendChild(line);
        }
    }
}, 10000);

// 导出到全局作用域
window.addTerminalLine = addTerminalLine;