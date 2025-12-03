// 粒子系统辅助模块

// 粒子管理器
const particleManagers = [];

// 初始化粒子系统
function initParticleSystem() {
    console.log('初始化粒子系统');
    
    // 创建背景粒子
    createBackgroundParticles();
    
    // 创建数据流粒子
    createDataStreamParticles();
    
    console.log('粒子系统初始化完成');
}

// 创建背景粒子
function createBackgroundParticles() {
    // 这个函数将在three-scene.js中实现
    console.log('创建背景粒子效果');
}

// 创建数据流粒子
function createDataStreamParticles() {
    // 这个函数将在three-scene.js中实现
    console.log('创建数据流粒子效果');
}

// 创建GitHub星星粒子
function createGitHubStars(count) {
    console.log(`创建 ${count} 个GitHub星星粒子`);
    
    // 这个函数将在three-scene.js中实现
    return {
        count: count,
        update: function() {
            // 更新粒子位置
        },
        dispose: function() {
            // 清理粒子
        }
    };
}

// 创建点击特效粒子
function createClickEffect(x, y, color = null) {
    console.log(`创建点击特效在 (${x}, ${y})`);
    
    // 获取当前主题颜色
    const currentTheme = window.getCurrentTheme ? window.getCurrentTheme() : themes.matrix;
    const effectColor = color || currentTheme.primaryColor;
    
    // 创建粒子爆炸效果
    const particleCount = 15;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0,
            decay: 0.05 + Math.random() * 0.05,
            size: 3 + Math.random() * 5,
            color: effectColor
        };
        
        particles.push(particle);
    }
    
    const effect = {
        particles: particles,
        active: true,
        
        update: function() {
            let aliveParticles = 0;
            
            for (let particle of this.particles) {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life -= particle.decay;
                particle.vy += 0.2; // 重力
                particle.vx *= 0.95; // 空气阻力
                particle.vy *= 0.95;
                
                if (particle.life > 0) {
                    aliveParticles++;
                }
            }
            
            if (aliveParticles === 0) {
                this.active = false;
            }
            
            return this.active;
        },
        
        draw: function(context) {
            for (let particle of this.particles) {
                if (particle.life <= 0) continue;
                
                context.save();
                context.globalAlpha = particle.life;
                context.fillStyle = particle.color;
                context.beginPath();
                context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                context.fill();
                context.restore();
            }
        },
        
        dispose: function() {
            this.particles = [];
            this.active = false;
        }
    };
    
    particleManagers.push(effect);
    return effect;
}

// 更新所有粒子效果
function updateParticleEffects() {
    for (let i = particleManagers.length - 1; i >= 0; i--) {
        const effect = particleManagers[i];
        const isActive = effect.update();
        
        if (!isActive) {
            effect.dispose();
            particleManagers.splice(i, 1);
        }
    }
}

// 绘制所有粒子效果到2D画布
function drawParticleEffects(context) {
    for (let effect of particleManagers) {
        if (effect.draw) {
            effect.draw(context);
        }
    }
}

// 清理所有粒子效果
function cleanupParticleEffects() {
    for (let effect of particleManagers) {
        if (effect.dispose) {
            effect.dispose();
        }
    }
    
    particleManagers.length = 0;
}

// 导出到全局作用域
window.initParticleSystem = initParticleSystem;
window.createGitHubStars = createGitHubStars;
window.createClickEffect = createClickEffect;
window.updateParticleEffects = updateParticleEffects;
window.drawParticleEffects = drawParticleEffects;
window.cleanupParticleEffects = cleanupParticleEffects;