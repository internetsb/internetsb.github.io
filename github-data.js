// GitHub数据获取与展示模块

// GitHub API配置
const GITHUB_USERNAME = 'internetsb'; // 请替换为你的GitHub用户名
// 如果用户名无效，请使用模拟数据
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}`;
const GITHUB_REPOS_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos`;

// 缓存配置
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟
let githubCache = {
    data: null,
    timestamp: 0,
    repos: null,
    reposTimestamp: 0
};

// 从GitHub获取用户数据
async function fetchGitHubUserData() {
    try {
        // 检查缓存
        if (githubCache.data && Date.now() - githubCache.timestamp < CACHE_DURATION) {
            console.log('使用缓存的GitHub用户数据');
            return githubCache.data;
        }

        console.log('从GitHub API获取用户数据');
        
        // 添加超时机制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
        
        const response = await fetch(GITHUB_API_URL, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`GitHub API错误: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 更新缓存
        githubCache.data = data;
        githubCache.timestamp = Date.now();
        
        return data;
    } catch (error) {
        console.error('获取GitHub用户数据失败:', error);
        
        // 如果缓存中有数据，返回缓存数据
        if (githubCache.data) {
            console.log('使用缓存的GitHub用户数据作为后备');
            return githubCache.data;
        }
        
        // 返回模拟数据作为后备
        return getMockGitHubData();
    }
}

// 从GitHub获取仓库数据
async function fetchGitHubReposData() {
    try {
        // 检查缓存
        if (githubCache.repos && Date.now() - githubCache.reposTimestamp < CACHE_DURATION) {
            console.log('使用缓存的GitHub仓库数据');
            return githubCache.repos;
        }

        console.log('从GitHub API获取仓库数据');
        
        let allRepos = [];
        let page = 1;
        let hasMore = true;
        
        // GitHub API分页获取所有仓库
        while (hasMore) {
            // 添加超时机制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
            
            const response = await fetch(`${GITHUB_REPOS_URL}?per_page=100&page=${page}&sort=updated`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`GitHub API错误: ${response.status}`);
            }
            
            const repos = await response.json();
            
            if (repos.length === 0) {
                hasMore = false;
            } else {
                allRepos = allRepos.concat(repos);
                page++;
                
                // 限制最多获取200个仓库
                if (allRepos.length >= 200) {
                    hasMore = false;
                }
            }
        }
        
        // 更新缓存
        githubCache.repos = allRepos;
        githubCache.reposTimestamp = Date.now();
        
        return allRepos;
    } catch (error) {
        console.error('获取GitHub仓库数据失败:', error);
        
        // 如果缓存中有数据，返回缓存数据
        if (githubCache.repos) {
            console.log('使用缓存的GitHub仓库数据作为后备');
            return githubCache.repos;
        }
        
        // 返回模拟数据作为后备
        return getMockReposData();
    }
}

// 获取模拟GitHub数据
function getMockGitHubData() {
    return {
        public_repos: 24,
        followers: 42,
        following: 36,
        created_at: "2018-05-20T12:00:00Z",
        updated_at: new Date().toISOString()
    };
}

// 获取模拟仓库数据
function getMockReposData() {
    return [
        {
            name: "holographic-console",
            description: "全息控制台个人主页",
            stargazers_count: 156,
            forks_count: 23,
            language: "JavaScript",
            updated_at: new Date().toISOString(),
            html_url: "https://github.com/your-username/holographic-console"
        },
        {
            name: "neural-network-visualizer",
            description: "神经网络训练过程可视化工具",
            stargazers_count: 89,
            forks_count: 12,
            language: "Python",
            updated_at: new Date(Date.now() - 86400000).toISOString(),
            html_url: "https://github.com/your-username/neural-network-visualizer"
        },
        {
            name: "quantum-simulator",
            description: "量子计算模拟器",
            stargazers_count: 45,
            forks_count: 8,
            language: "C++",
            updated_at: new Date(Date.now() - 172800000).toISOString(),
            html_url: "https://github.com/your-username/quantum-simulator"
        },
        {
            name: "blockchain-explorer",
            description: "区块链数据浏览器",
            stargazers_count: 67,
            forks_count: 15,
            language: "TypeScript",
            updated_at: new Date(Date.now() - 259200000).toISOString(),
            html_url: "https://github.com/your-username/blockchain-explorer"
        },
        {
            name: "ar-vr-framework",
            description: "AR/VR开发框架",
            stargazers_count: 32,
            forks_count: 5,
            language: "C#",
            updated_at: new Date(Date.now() - 345600000).toISOString(),
            html_url: "https://github.com/your-username/ar-vr-framework"
        }
    ];
}

// 处理GitHub数据
async function processGitHubData() {
    try {
        const [userData, reposData] = await Promise.all([
            fetchGitHubUserData(),
            fetchGitHubReposData()
        ]);
        
        updateGitHubStats(userData, reposData);
        updateTopRepositories(reposData);
        updateLanguageStats(reposData);
        
        // 更新终端消息
        if (window.addTerminalLine) {
            window.addTerminalLine(`> GitHub数据加载完成: ${reposData.length}个仓库`);
        }
        
        return { userData, reposData };
    } catch (error) {
        console.error('处理GitHub数据失败:', error);
        
        // 使用模拟数据
        const userData = getMockGitHubData();
        const reposData = getMockReposData();
        
        updateGitHubStats(userData, reposData);
        updateTopRepositories(reposData);
        updateLanguageStats(reposData);
        
        if (window.addTerminalLine) {
            window.addTerminalLine('> 使用模拟GitHub数据');
        }
        
        return { userData, reposData };
    }
}

// 更新GitHub统计信息
function updateGitHubStats(userData, reposData) {
    // 更新仓库数量
    const repoCount = reposData.length || userData.public_repos || 0;
    if (document.getElementById('repo-count')) {
        document.getElementById('repo-count').textContent = repoCount;
    }
    
    // 计算总stars数
    const totalStars = reposData.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
    if (document.getElementById('total-stars')) {
        document.getElementById('total-stars').textContent = totalStars;
    }
    
    // 更新关注者数
    if (document.getElementById('followers')) {
        document.getElementById('followers').textContent = userData.followers || 0;
    }
    
    // 计算贡献数（模拟）
    const contributions = repoCount * 15 + Math.floor(Math.random() * 100);
    if (document.getElementById('contributions')) {
        document.getElementById('contributions').textContent = contributions.toLocaleString();
    }
    
    // 更新Three.js粒子系统（如果有）
    updateStarParticles(totalStars);
}

// 更新星星粒子
function updateStarParticles(starCount) {
    // 在实际应用中，这里可以更新Three.js中的粒子数量
    // 基于stars数调整粒子效果
    console.log(`更新星星粒子，总数: ${starCount}`);
    
    // 模拟粒子更新效果
    const particleCount = Math.min(Math.floor(starCount / 5), 200);
    if (window.updateStarParticlesCount) {
        window.updateStarParticlesCount(particleCount);
    }
}

// 更新热门仓库显示
function updateTopRepositories(reposData) {
    // 按stars数排序，取前5个
    const topRepos = [...reposData]
        .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
        .slice(0, 5);
    
    // 更新文章容器为仓库展示
    const articlesContainer = document.getElementById('articles-container');
    if (!articlesContainer) return;
    
    // 清除现有文章
    articlesContainer.innerHTML = '';
    
    // 添加仓库卡片
    topRepos.forEach(repo => {
        const repoCard = document.createElement('div');
        repoCard.className = 'article-card';
        repoCard.style.cursor = 'pointer';
        
        // 获取语言颜色
        const languageColor = getLanguageColor(repo.language);
        
        // 格式化更新日期
        const updatedDate = new Date(repo.updated_at);
        const now = new Date();
        const diffDays = Math.floor((now - updatedDate) / (1000 * 60 * 60 * 24));
        let updatedText = '';
        
        if (diffDays === 0) {
            updatedText = '今天';
        } else if (diffDays === 1) {
            updatedText = '昨天';
        } else if (diffDays < 7) {
            updatedText = `${diffDays}天前`;
        } else if (diffDays < 30) {
            updatedText = `${Math.floor(diffDays / 7)}周前`;
        } else {
            updatedText = `${Math.floor(diffDays / 30)}月前`;
        }
        
        repoCard.innerHTML = `
            <h5><i class="fab fa-github"></i> ${repo.name}</h5>
            <p>${repo.description || '暂无描述'}</p>
            <div class="article-meta">
                <div class="article-tags">
                    <span class="article-tag" style="background-color: ${languageColor}20; color: ${languageColor}">
                        ${repo.language || 'Unknown'}
                    </span>
                    <span class="article-tag">
                        <i class="fas fa-star"></i> ${repo.stargazers_count || 0}
                    </span>
                    <span class="article-tag">
                        <i class="fas fa-code-branch"></i> ${repo.forks_count || 0}
                    </span>
                </div>
                <div class="article-read-time">${updatedText}</div>
            </div>
        `;
        
        // 添加点击事件
        repoCard.addEventListener('click', () => {
            window.open(repo.html_url, '_blank');
            if (window.addTerminalLine) {
                window.addTerminalLine(`> 正在打开仓库: ${repo.name}`);
            }
        });
        
        articlesContainer.appendChild(repoCard);
    });
}

// 更新语言统计
function updateLanguageStats(reposData) {
    // 计算语言分布
    const languageStats = {};
    reposData.forEach(repo => {
        const lang = repo.language || 'Other';
        languageStats[lang] = (languageStats[lang] || 0) + 1;
    });
    
    // 转换为数组并排序
    const languageArray = Object.entries(languageStats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8); // 取前8种语言
    
    // 更新焦点标签
    const focusTags = document.getElementById('focus-tags');
    if (!focusTags) return;
    
    // 清除现有标签
    focusTags.innerHTML = '';
    
    // 添加语言标签
    languageArray.forEach(lang => {
        const tag = document.createElement('div');
        tag.className = 'focus-tag';
        
        // 设置语言颜色
        const languageColor = getLanguageColor(lang.name);
        tag.style.borderColor = languageColor;
        tag.style.color = languageColor;
        
        tag.textContent = lang.name;
        
        // 添加悬停效果
        tag.addEventListener('mouseenter', () => {
            if (window.addTerminalLine) {
                window.addTerminalLine(`> ${lang.name}: ${lang.count}个仓库`);
            }
        });
        
        focusTags.appendChild(tag);
    });
}

// 获取编程语言颜色
function getLanguageColor(language) {
    const languageColors = {
        'JavaScript': '#f1e05a',
        'Python': '#3572A5',
        'Java': '#b07219',
        'TypeScript': '#2b7489',
        'C++': '#f34b7d',
        'C#': '#178600',
        'PHP': '#4F5D95',
        'Ruby': '#701516',
        'Go': '#00ADD8',
        'Rust': '#dea584',
        'Swift': '#ffac45',
        'Kotlin': '#F18E33',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'Vue': '#2c3e50',
        'React': '#61dafb',
        'Angular': '#dd0031',
        'Node.js': '#339933',
        'Dart': '#00B4AB',
        'Elixir': '#6e4a7e',
        'Clojure': '#db5855',
        'Haskell': '#5e5086',
        'Scala': '#c22d40',
        'Perl': '#0298c3',
        'Lua': '#000080',
        'R': '#198CE7',
        'Matlab': '#e16737',
        'Shell': '#89e051',
        'PowerShell': '#012456',
        'Objective-C': '#438eff',
        'Other': '#cccccc'
    };
    
    return languageColors[language] || languageColors['Other'];
}

// 获取贡献活动数据（模拟）
function getContributionData() {
    const data = [];
    
    // 生成28天的数据（4周）
    for (let i = 0; i < 28; i++) {
        // 模拟活动强度：0-3
        let intensity = 0;
        
        // 模拟一些活动模式
        const dayOfWeek = i % 7;
        const week = Math.floor(i / 7);
        
        // 周末活动较少
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            intensity = Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 1 : 0;
        } else {
            // 工作日活动较多
            intensity = Math.random() > 0.3 ? Math.floor(Math.random() * 3) + 1 : 0;
        }
        
        // 第三周活动特别多（模拟项目冲刺）
        if (week === 2) {
            intensity = Math.min(3, intensity + 1);
        }
        
        data.push(intensity);
    }
    
    return data;
}

// 初始化GitHub数据
async function loadGitHubData() {
    console.log('正在加载GitHub数据...');
    
    if (window.addTerminalLine) {
        window.addTerminalLine('> 正在从GitHub获取数据...');
    }
    
    try {
        // 处理GitHub数据
        const githubData = await processGitHubData();
        
        // 生成贡献活动图
        const contributionData = getContributionData();
        updateContributionGraph(contributionData);
        
        return githubData;
    } catch (error) {
        console.error('加载GitHub数据失败:', error);
        if (window.addTerminalLine) {
            window.addTerminalLine('> GitHub数据加载失败，使用模拟数据');
        }
        
        // 使用模拟数据更新UI
        const userData = getMockGitHubData();
        const reposData = getMockReposData();
        updateGitHubStats(userData, reposData);
        updateTopRepositories(reposData);
        updateLanguageStats(reposData);
        
        // 生成贡献活动图
        const contributionData = getContributionData();
        updateContributionGraph(contributionData);
        
        return { userData, reposData };
    }
}

// 更新贡献活动图
function updateContributionGraph(data) {
    const activityGraph = document.getElementById('activity-graph');
    if (!activityGraph) return;
    
    // 清除现有内容
    activityGraph.innerHTML = '';
    
    // 生成活动单元格
    data.forEach((intensity, index) => {
        const cell = document.createElement('div');
        cell.className = 'activity-cell';
        
        // 根据活动强度设置样式
        if (intensity > 0) {
            cell.classList.add('active');
            cell.style.opacity = 0.3 + (intensity * 0.2);
            
            // 添加悬停效果
            cell.addEventListener('mouseenter', () => {
                const day = index % 7;
                const week = Math.floor(index / 7);
                const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
                
                if (window.addTerminalLine) {
                    window.addTerminalLine(`> ${week + 1}周${dayNames[day]}: ${intensity}次贡献`);
                }
            });
        }
        
        activityGraph.appendChild(cell);
    });
}

// 导出函数
window.loadGitHubData = loadGitHubData;
window.processGitHubData = processGitHubData;
window.updateStarParticlesCount = (count) => {
    console.log(`设置星星粒子数量: ${count}`);
    // 这个函数需要在three-scene.js中实现
};