// 主脚本文件 - 初始化应用程序

// 全局变量
let currentTheme = 'matrix';
let visitorCount = 0;
let githubData = null;

// DOM元素
const loadingScreen = document.getElementById('loading-screen');
const terminalOutput = document.getElementById('terminal-output');
const visitorCountElement = document.getElementById('visitor-count');
const currentTimeElement = document.getElementById('current-time');
const repoCountElement = document.getElementById('repo-count');
const totalStarsElement = document.getElementById('total-stars');
const followersElement = document.getElementById('followers');
const contributionsElement = document.getElementById('contributions');
const activityGraph = document.getElementById('activity-graph');
const focusTags = document.getElementById('focus-tags');
const articlesContainer = document.getElementById('articles-container');

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
    
    // 初始化主题切换
    initThemeSwitcher();
    
    // 隐藏加载屏幕
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            addTerminalLine("> 全息控制台已就绪");
            addTerminalLine("> 输入 'help' 查看可用命令");
        }, 1000);
    }, 2000);
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
        loadGitHubData();
    } else {
        // 使用模拟数据作为后备
        setTimeout(() => {
            repoCountElement.textContent = '24';
            totalStarsElement.textContent = '156';
            followersElement.textContent = '42';
            contributionsElement.textContent = '1,248';
            addTerminalLine('> GitHub数据加载完成 (模拟数据)');
        }, 1500);
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

// 导出到全局作用域
window.addTerminalLine = addTerminalLine;