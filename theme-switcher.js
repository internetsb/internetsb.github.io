// 主题切换模块

// 主题配置
const themes = {
    matrix: {
        name: '矩阵主题',
        class: 'matrix-theme',
        primaryColor: '#00ff41',
        secondaryColor: '#008f11',
        accentColor: '#00d4ff',
        bgColor: '#0a0a0a',
        panelBg: 'rgba(10, 20, 10, 0.7)',
        textColor: '#e0e0e0'
    },
    neon: {
        name: '霓虹之夜',
        class: 'neon-theme',
        primaryColor: '#ff00ff',
        secondaryColor: '#00ffff',
        accentColor: '#ff5500',
        bgColor: '#0a0a1a',
        panelBg: 'rgba(20, 10, 30, 0.7)',
        textColor: '#f0f0ff'
    },
    solar: {
        name: '太阳能',
        class: 'solar-theme',
        primaryColor: '#ffaa00',
        secondaryColor: '#ff5500',
        accentColor: '#ffff00',
        bgColor: '#0a0a0a',
        panelBg: 'rgba(30, 20, 10, 0.7)',
        textColor: '#ffeedd'
    },
    arctic: {
        name: '极地冰川',
        class: 'arctic-theme',
        primaryColor: '#00ffff',
        secondaryColor: '#88ffff',
        accentColor: '#ffffff',
        bgColor: '#000a1a',
        panelBg: 'rgba(10, 20, 40, 0.7)',
        textColor: '#e0f0ff'
    }
};

// 当前主题
let currentTheme = 'matrix';

// 初始化主题切换
function initThemeSwitching() {
    console.log('初始化主题切换系统');
    
    // 从本地存储获取保存的主题
    const savedTheme = localStorage.getItem('holographicTheme');
    if (savedTheme && themes[savedTheme]) {
        setTheme(savedTheme, false); // 不显示消息
    }
    
    // 为所有主题选项添加点击事件
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            setTheme(theme, true);
            
            // 添加终端消息
            if (window.addTerminalLine) {
                window.addTerminalLine(`> 切换主题: ${themes[theme].name}`);
            }
        });
    });
    
    // 添加键盘快捷键
    document.addEventListener('keydown', handleThemeShortcuts);
    
    console.log('主题切换系统初始化完成');
}

// 处理主题快捷键
function handleThemeShortcuts(e) {
    // 检查是否按下了Ctrl键
    if (e.ctrlKey) {
        switch(e.key) {
            case '1':
                e.preventDefault();
                setTheme('matrix', true);
                if (window.addTerminalLine) {
                    window.addTerminalLine('> 快捷键切换: 矩阵主题 (Ctrl+1)');
                }
                break;
            case '2':
                e.preventDefault();
                setTheme('neon', true);
                if (window.addTerminalLine) {
                    window.addTerminalLine('> 快捷键切换: 霓虹之夜 (Ctrl+2)');
                }
                break;
            case '3':
                e.preventDefault();
                setTheme('solar', true);
                if (window.addTerminalLine) {
                    window.addTerminalLine('> 快捷键切换: 太阳能 (Ctrl+3)');
                }
                break;
            case '4':
                e.preventDefault();
                setTheme('arctic', true);
                if (window.addTerminalLine) {
                    window.addTerminalLine('> 快捷键切换: 极地冰川 (Ctrl+4)');
                }
                break;
        }
    }
}

// 设置主题
function setTheme(themeName, showTransition = true) {
    if (!themes[themeName]) {
        console.error(`未知主题: ${themeName}`);
        return;
    }
    
    const theme = themes[themeName];
    
    // 如果已经是当前主题，不做任何操作
    if (themeName === currentTheme && showTransition) return;
    
    // 更新当前主题
    currentTheme = themeName;
    
    // 添加过渡效果
    if (showTransition) {
        document.body.style.transition = 'background-color 0.5s ease, color 0.5s ease';
    }
    
    // 更新body的class
    document.body.className = '';
    document.body.classList.add(theme.class);
    
    // 更新主题选项的激活状态
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('active');
        if (option.getAttribute('data-theme') === themeName) {
            option.classList.add('active');
        }
    });
    
    // 保存到本地存储
    localStorage.setItem('holographicTheme', themeName);
    
    // 更新CSS变量
    updateCssVariables(theme);
    
    // 更新Three.js场景颜色
    if (typeof updateThemeColors === 'function') {
        updateThemeColors(themeName);
    }
    
    // 播放主题切换音效
    playThemeSound(themeName);
    
    // 移除过渡效果
    if (showTransition) {
        setTimeout(() => {
            document.body.style.transition = '';
        }, 500);
    }
    
    console.log(`主题切换为: ${theme.name}`);
}

// 更新CSS变量
function updateCssVariables(theme) {
    const root = document.documentElement;
    
    // 设置主要CSS变量
    root.style.setProperty('--primary', theme.primaryColor);
    root.style.setProperty('--secondary', theme.secondaryColor);
    root.style.setProperty('--accent', theme.accentColor);
    root.style.setProperty('--bg', theme.bgColor);
    root.style.setProperty('--panel-bg', theme.panelBg);
    root.style.setProperty('--text', theme.textColor);
    
    // 计算并设置RGB变量
    const primaryRgb = hexToRgb(theme.primaryColor);
    const accentRgb = hexToRgb(theme.accentColor);
    
    root.style.setProperty('--primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
    root.style.setProperty('--accent-rgb', `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`);
    
    // 更新发光效果
    const glowColor = theme.primaryColor.replace('#', '');
    const r = parseInt(glowColor.substring(0, 2), 16);
    const g = parseInt(glowColor.substring(2, 4), 16);
    const b = parseInt(glowColor.substring(4, 6), 16);
    root.style.setProperty('--glow', `rgba(${r}, ${g}, ${b}, 0.5)`);
}

// 十六进制颜色转RGB
function hexToRgb(hex) {
    // 移除#号
    hex = hex.replace('#', '');
    
    // 处理3位简写
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
}

// 播放主题切换音效
function playThemeSound(themeName) {
    try {
        // 创建音频上下文
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 不同主题使用不同频率的音效
        let frequency;
        let duration = 0.3;
        
        switch(themeName) {
            case 'matrix':
                frequency = 261.63; // C4
                break;
            case 'neon':
                frequency = 329.63; // E4
                break;
            case 'solar':
                frequency = 392.00; // G4
                break;
            case 'arctic':
                frequency = 523.25; // C5
                break;
            default:
                frequency = 261.63;
        }
        
        // 创建振荡器
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        // 创建增益节点控制音量
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        // 连接节点
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // 播放音效
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
        
    } catch (error) {
        console.log('音频上下文不支持，跳过音效播放');
    }
}

// 获取当前主题
function getCurrentTheme() {
    return themes[currentTheme];
}

// 主题轮换功能
function rotateTheme() {
    const themeNames = Object.keys(themes);
    const currentIndex = themeNames.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeNames.length;
    
    setTheme(themeNames[nextIndex], true);
    
    if (window.addTerminalLine) {
        window.addTerminalLine(`> 主题轮换: ${themes[themeNames[nextIndex]].name}`);
    }
}

// 随机主题
function randomTheme() {
    const themeNames = Object.keys(themes);
    const randomIndex = Math.floor(Math.random() * themeNames.length);
    
    // 确保不会重复当前主题
    let newTheme;
    do {
        newTheme = themeNames[randomIndex];
    } while (newTheme === currentTheme && themeNames.length > 1);
    
    setTheme(newTheme, true);
    
    if (window.addTerminalLine) {
        window.addTerminalLine(`> 随机主题: ${themes[newTheme].name}`);
    }
}

// 导出到全局作用域
window.initThemeSwitching = initThemeSwitching;
window.setTheme = setTheme;
window.getCurrentTheme = getCurrentTheme;
window.rotateTheme = rotateTheme;
window.randomTheme = randomTheme;

// 注意：在script.js中手动调用initThemeSwitching，避免DOMContentLoaded事件冲突
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', initThemeSwitching);
// } else {
//     initThemeSwitching();
// }