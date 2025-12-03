// Three.js 3D场景初始化

let scene, camera, renderer;
let planets = [];
let particles = [];
let particleSystem;
let baseBackgroundParticleCount = 0;
let currentBackgroundParticleCount = 0;
let starParticles = [];
let centralStar;
let orbitControls;
let hoveredPlanet = null;
let planetMeshes = [];
let planetLabelContainer = null;
let planetTooltip;
let aboutOverlay = null;
let centralStarHovered = false;
let interactionInitialized = false;
const mouseVector = new THREE.Vector2();
const globalRaycaster = new THREE.Raycaster();

function initThreeScene() {
    // 获取容器
    const container = document.getElementById('scene-container');
    
    // 创建场景
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 10, 50);
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 15);
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    // 添加轨道控制（如果可用）
    if (typeof THREE.OrbitControls !== 'undefined') {
        orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
        orbitControls.enableDamping = true;
        orbitControls.dampingFactor = 0.05;
        orbitControls.enableZoom = false;
        orbitControls.enablePan = false;
        orbitControls.maxPolarAngle = Math.PI / 2;
        orbitControls.minPolarAngle = Math.PI / 4;
    }
    
    // 添加光源
    addLights();
    
    // 创建中央恒星
    createCentralStar();
    
    // 创建行星
    createPlanets();
    
    // 创建粒子系统（初始为0，等待GitHub star数驱动）
    createParticleSystem();
    
    // 创建星点粒子
    createStarParticles();
    
    // 创建数据流
    createDataStreams();
    
    // 处理窗口大小变化
    window.addEventListener('resize', onWindowResize);
    
    // 开始动画循环
    animate();
    
    console.log('Three.js场景初始化完成');
}

function addLights() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    
    // 点光源（中央）
    const pointLight = new THREE.PointLight(0x00ff00, 1, 50);
    pointLight.position.set(0, 0, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);
    
    // 方向光
    const directionalLight = new THREE.DirectionalLight(0x00aaff, 0.5);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
}

function createCentralStar() {
    // 创建中央恒星的几何体
    const geometry = new THREE.IcosahedronGeometry(1.5, 3);
    
    // 创建自定义着色器材质
    const vertexShader = `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float time;
        
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            
            // 添加脉动效果
            float pulse = sin(time * 2.0) * 0.1;
            vec3 newPosition = position * (1.0 + pulse);
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
    `;
    
    const fragmentShader = `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float time;
        uniform vec3 primaryColor;
        
        void main() {
            // 基础颜色
            vec3 color = primaryColor;
            
            // 添加边缘光效果
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            
            // 添加内部光效
            float innerGlow = sin(vPosition.x * 3.0 + time) * 0.5 + 0.5;
            innerGlow += sin(vPosition.y * 3.0 + time * 1.5) * 0.5 + 0.5;
            innerGlow += sin(vPosition.z * 3.0 + time * 2.0) * 0.5 + 0.5;
            innerGlow /= 3.0;
            
            // 组合效果
            color = mix(color, vec3(1.0, 1.0, 1.0), intensity * 0.5);
            color += primaryColor * innerGlow * 0.3;
            
            // 透明度
            float alpha = 0.8 + intensity * 0.2;
            
            gl_FragColor = vec4(color, alpha);
        }
    `;
    
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            primaryColor: { value: new THREE.Color(0x00ff41) }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    });
    
    centralStar = new THREE.Mesh(geometry, material);
    scene.add(centralStar);
    
    // 添加光环
    createStarRing();
}

function createStarRing() {
    const ringGeometry = new THREE.RingGeometry(2, 2.5, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff41,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.2
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
    
    planets.push({
        mesh: ring,
        rotationSpeed: 0.005,
        orbitRadius: 0,
        orbitSpeed: 0,
        angle: 0
    });
}

function createPlanets() {
    // 行星配置（包含联系方式与导航内容）
    const planetConfigs = [
        {
            name: "邮箱",
            label: "MAIL",
            description: "与我联系",
            urlHint: "mailto:1473994304@qq.com",
            radius: 0.85,
            orbitRadius: 3.5,
            orbitSpeed: 0.0025,
            rotationSpeed: 0.012,
            color: 0x66ccff,
            type: "email",
            category: "与我联系",
            action: "mailto:1473994304@qq.com"
        },
        {
            name: "GitHub",
            label: "GITHUB",
            description: "我的代码仓库",
            urlHint: "https://github.com/internetsb",
            radius: 0.95,
            orbitRadius: 5,
            orbitSpeed: 0.002,
            rotationSpeed: 0.01,
            color: 0xffaa33,
            type: "github",
            category: "GitHub",
            url: "https://github.com/internetsb"
        },
        {
            name: "QQ",
            label: "QQ",
            description: "与我联系",
            urlHint: "点击复制 QQ 号",
            radius: 1.05,
            orbitRadius: 6.2,
            orbitSpeed: 0.0018,
            rotationSpeed: 0.009,
            color: 0x88ffaa,
            type: "qq",
            category: "与我联系",
            qqList: ["1523640161", "3874540285"]
        },
        {
            name: "神人语句",
            label: "SR",
            description: "神人语句网站",
            urlHint: "http://8.148.85.152:80",
            radius: 0.9,
            orbitRadius: 7.5,
            orbitSpeed: 0.0016,
            rotationSpeed: 0.009,
            color: 0x66ffcc,
            type: "quotes",
            category: "神人语句",
            url: "http://8.148.85.152:80"
        },
        {
            name: "我与…",
            label: "MY",
            description: "浮生碎笔",
            urlHint: "http://8.148.85.152:9998",
            radius: 1.1,
            orbitRadius: 8.8,
            orbitSpeed: 0.0012,
            rotationSpeed: 0.007,
            color: 0xff77ff,
            type: "mood",
            category: "我与...",
            url: "http://8.148.85.152:9998"
        },
        {
            name: "色图",
            label: "PIC",
            description: "色图分享网站",
            urlHint: "http://8.148.85.152:9997",
            radius: 0.85,
            orbitRadius: 10,
            orbitSpeed: 0.001,
            rotationSpeed: 0.01,
            color: 0x77aaff,
            type: "gallery",
            category: "色图分享",
            url: "http://8.148.85.152:9997"
        }
    ];
    
    planetConfigs.forEach((config, index) => {
        // 创建行星几何体
        let geometry;
        geometry = new THREE.IcosahedronGeometry(config.radius, 2);
        
        // 创建材质
        const material = new THREE.MeshPhongMaterial({
            color: config.color,
            shininess: 100,
            transparent: true,
            opacity: 0.95
        });
        // 根据类型生成不同纹理：联系星球使用图标，其它星球用自定义纹理
        material.map = createPlanetTexture(config, config.color);
        material.needsUpdate = true;
        
        // 创建网格
        const planet = new THREE.Mesh(geometry, material);
        
        // 计算初始位置（分布在圆上）
        const angle = (index / planetConfigs.length) * Math.PI * 2;
        planet.position.x = Math.cos(angle) * config.orbitRadius;
        planet.position.z = Math.sin(angle) * config.orbitRadius;
        planet.position.y = (Math.random() - 0.5) * 0.5;
        
        // 添加到场景
        scene.add(planet);
        planetMeshes.push(planet);
        
        // 保存行星数据
        const planetData = {
            mesh: planet,
            name: config.name,
            label: config.label || config.name,
            description: config.description,
            type: config.type,
            url: config.url,
            action: config.action,
            qqList: config.qqList,
            category: config.category,
            urlHint: config.urlHint,
            radius: config.radius,
            orbitRadius: config.orbitRadius,
            orbitSpeed: config.orbitSpeed,
            rotationSpeed: config.rotationSpeed,
            angle: angle,
            color: config.color,
            isHovered: false,
            labelElement: null
        };
        planets.push(planetData);
        planet.userData.planetIndex = planets.length - 1;
        
        // 创建对应的 2D 标签
        createPlanetLabel(planetData);
        
        // 创建轨道线
        createOrbitLine(config.orbitRadius, config.color);
    });
    
    initPlanetTooltip();
    setupPlanetInteraction();
}

function createOrbitLine(radius, color) {
    const points = [];
    const segments = 64;
    
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
            Math.cos(theta) * radius,
            0,
            Math.sin(theta) * radius
        ));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.1
    });
    
    const orbitLine = new THREE.Line(geometry, material);
    scene.add(orbitLine);
}

function ensurePlanetLabelContainer() {
    if (planetLabelContainer) return;
    
    planetLabelContainer = document.createElement('div');
    planetLabelContainer.className = 'planet-label-container';
    planetLabelContainer.style.position = 'fixed';
    planetLabelContainer.style.left = '0';
    planetLabelContainer.style.top = '0';
    planetLabelContainer.style.width = '100%';
    planetLabelContainer.style.height = '100%';
    planetLabelContainer.style.pointerEvents = 'none';
    planetLabelContainer.style.zIndex = '4';
    
    document.body.appendChild(planetLabelContainer);
}

function createPlanetLabel(planetData) {
    ensurePlanetLabelContainer();
    if (!planetLabelContainer) return;
    
    const label = document.createElement('div');
    label.className = `planet-label planet-label-${planetData.type || 'default'}`;
    label.innerHTML = `
        <div class="planet-label-main">
            <span class="planet-label-name">${planetData.label}</span>
            ${planetData.category ? `<span class="planet-label-category">${planetData.category}</span>` : ''}
        </div>
        ${planetData.urlHint ? `<div class="planet-label-url">${planetData.urlHint}</div>` : ''}
    `;
    
    planetLabelContainer.appendChild(label);
    planetData.labelElement = label;
}

function setupPlanetInteraction() {
    if (interactionInitialized) return;
    interactionInitialized = true;
    
    window.addEventListener('mousemove', (event) => {
        mouseVector.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouseVector.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        if (!camera || planetMeshes.length === 0) return;
        
        globalRaycaster.setFromCamera(mouseVector, camera);
        const intersects = globalRaycaster.intersectObjects(planetMeshes);
        
        if (intersects.length > 0) {
            const intersected = intersects[0].object;
            const planetIndex = intersected.userData.planetIndex;
            const planetData = planets[planetIndex];
            if (planetData) {
                setHoveredPlanet(planetData, event);
            }
        } else {
            clearHoveredPlanet();
            
            // 若未命中行星，检测中央恒星以提供点击提示
            if (centralStar) {
                const centerHits = globalRaycaster.intersectObject(centralStar);
                if (centerHits.length > 0) {
                    centralStarHovered = true;
                    document.body.style.cursor = 'pointer';
                } else {
                    centralStarHovered = false;
                    document.body.style.cursor = 'default';
                }
            }
        }
    });
    
    window.addEventListener('click', (event) => {
        if (!camera) return;
        
        // 如果 ABOUT 面板当前可见，则不触发行星/恒星点击（避免误跳转）
        if (aboutOverlay && aboutOverlay.classList.contains('visible')) {
            return;
        }
        
        // 优先检测中央恒星点击（ABOUT ME）
        if (centralStar) {
            globalRaycaster.setFromCamera(mouseVector, camera);
            const centerHits = globalRaycaster.intersectObject(centralStar);
            if (centerHits.length > 0) {
                showAboutOverlay();
                return;
            }
        }
        
        // 其次处理行星点击
        if (!hoveredPlanet) return;
        handlePlanetClick(hoveredPlanet);
    });
}

function setHoveredPlanet(planetData, event) {
    if (hoveredPlanet && hoveredPlanet.mesh === planetData.mesh) {
        updateTooltipPosition(event);
        return;
    }
    
    clearHoveredPlanet();
    
    hoveredPlanet = planetData;
    hoveredPlanet.isHovered = true;
    
    hoveredPlanet.mesh.material.emissive = new THREE.Color(planetData.color);
    hoveredPlanet.mesh.material.emissiveIntensity = 0.6;
    hoveredPlanet.mesh.scale.setScalar(1.3);
    document.body.style.cursor = 'pointer';
    
    showPlanetTooltip(planetData, event);
}

function clearHoveredPlanet() {
    if (!hoveredPlanet) return;
    
    hoveredPlanet.mesh.material.emissive = new THREE.Color(0x000000);
    hoveredPlanet.mesh.material.emissiveIntensity = 0;
    hoveredPlanet.mesh.scale.setScalar(1.0);
    hoveredPlanet.isHovered = false;
    hoveredPlanet = null;
    
    // 不直接重置鼠标指针，让中央恒星 hover 逻辑来控制
    if (!centralStarHovered) {
        document.body.style.cursor = 'default';
    }
    hidePlanetTooltip();
}

function handlePlanetClick(planetData) {
    if (window.addTerminalLine) {
        window.addTerminalLine(`> 正在导航到: ${planetData.name}`);
    }
    
    if (planetData.type === 'email' && planetData.action) {
        window.location.href = planetData.action;
        return;
    }
    
    if (planetData.type === 'github' && planetData.url) {
        window.open(planetData.url, '_blank');
        return;
    }
    
    if (planetData.type === 'qq' && planetData.qqList) {
        const qqString = planetData.qqList.join(' / ');
        if (navigator.clipboard) {
            navigator.clipboard.writeText(qqString).then(() => {
                if (window.addTerminalLine) {
                    window.addTerminalLine(`> QQ号已复制: ${qqString}`);
                }
            }).catch(() => {
                alert(`QQ: ${qqString}`);
            });
        } else {
            alert(`QQ: ${qqString}`);
        }
        return;
    }
    
    if (planetData.url) {
        window.open(planetData.url, '_blank');
    }
}

function initPlanetTooltip() {
    if (planetTooltip) return;
    
    planetTooltip = document.createElement('div');
    planetTooltip.className = 'planet-tooltip';
    planetTooltip.style.position = 'fixed';
    planetTooltip.style.minWidth = '180px';
    planetTooltip.style.padding = '10px 14px';
    planetTooltip.style.borderRadius = '10px';
    planetTooltip.style.border = '1px solid rgba(255,255,255,0.15)';
    planetTooltip.style.background = 'rgba(10, 20, 20, 0.8)';
    planetTooltip.style.backdropFilter = 'blur(8px)';
    planetTooltip.style.boxShadow = '0 10px 25px rgba(0,0,0,0.35)';
    planetTooltip.style.pointerEvents = 'none';
    planetTooltip.style.opacity = '0';
    planetTooltip.style.transition = 'opacity 0.2s ease';
    planetTooltip.style.fontFamily = "'Orbitron', sans-serif";
    planetTooltip.style.fontSize = '13px';
    planetTooltip.innerHTML = `
        <div class="tooltip-title"></div>
        <div class="tooltip-meta">
            <span class="tooltip-type"></span>
            <span class="tooltip-url"></span>
        </div>
        <div class="tooltip-desc"></div>
        <div class="tooltip-hint">点击星球以导航 / 复制</div>
    `;
    
    document.body.appendChild(planetTooltip);
}

function showPlanetTooltip(planetData, event) {
    if (!planetTooltip) return;
    
    const titleEl = planetTooltip.querySelector('.tooltip-title');
    const descEl = planetTooltip.querySelector('.tooltip-desc');
    const typeEl = planetTooltip.querySelector('.tooltip-type');
    const urlEl = planetTooltip.querySelector('.tooltip-url');
    
    titleEl.textContent = planetData.name;
    titleEl.style.color = '#00ffcc';
    titleEl.style.fontSize = '14px';
    titleEl.style.marginBottom = '4px';
    
    descEl.textContent = planetData.description || '';
    descEl.style.color = '#e0f5ff';
    descEl.style.fontFamily = "'Roboto Mono', monospace";
    descEl.style.fontSize = '12px';
    
    if (typeEl) {
        const typeText = planetData.category || ({
            email: '邮箱',
            github: 'GitHub',
            qq: 'QQ',
            quotes: '文案语录',
            mood: '心情随笔',
            gallery: '图片图库'
        }[planetData.type] || '链接');
        typeEl.textContent = typeText;
    }
    
    if (urlEl) {
        urlEl.textContent = planetData.urlHint || planetData.url || (planetData.type === 'qq' ? 'QQ 号复制' : '');
    }
    
    updateTooltipPosition(event);
    planetTooltip.style.opacity = '1';
}

function hidePlanetTooltip() {
    if (!planetTooltip) return;
    planetTooltip.style.opacity = '0';
}

function updateTooltipPosition(event) {
    if (!planetTooltip || !event) return;
    const offset = 20;
    let left = event.clientX + offset;
    let top = event.clientY + offset;
    
    const tooltipRect = planetTooltip.getBoundingClientRect();
    if (left + tooltipRect.width > window.innerWidth) {
        left = event.clientX - tooltipRect.width - offset;
    }
    if (top + tooltipRect.height > window.innerHeight) {
        top = event.clientY - tooltipRect.height - offset;
    }
    
    planetTooltip.style.left = `${left}px`;
    planetTooltip.style.top = `${top}px`;
}

function createPlanetTexture(config, baseColor) {
    const label = config.label || config.name || '';
    const type = config.type || 'default';
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // 通用底色渐变
    const gradient = ctx.createRadialGradient(
        size * 0.35, size * 0.35, size * 0.2,
        size * 0.5, size * 0.5, size * 0.5
    );
    
    const color = new THREE.Color(baseColor);
    const lighter = color.clone().offsetHSL(0, 0, 0.2);
    const darker = color.clone().offsetHSL(0, 0, -0.2);
    
    gradient.addColorStop(0, `rgba(${lighter.r * 255}, ${lighter.g * 255}, ${lighter.b * 255}, 0.95)`);
    gradient.addColorStop(0.7, `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.85)`);
    gradient.addColorStop(1, `rgba(${darker.r * 255}, ${darker.g * 255}, ${darker.b * 255}, 0.8)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 外圈描边
    ctx.strokeStyle = `rgba(255, 255, 255, 0.18)`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
    ctx.stroke();
    
    // 不同类型的“纹理 + 图标”区分
    ctx.save();
    ctx.translate(size / 2, size / 2);
    
    if (type === 'email') {
        // 信封图标
        const w = 120, h = 80;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 6;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.rect(-w / 2, -h / 2, w, h);
        ctx.moveTo(-w / 2, -h / 2);
        ctx.lineTo(0, 0);
        ctx.lineTo(w / 2, -h / 2);
        ctx.stroke();
    } else if (type === 'github') {
        // 简化的 GitHub 章鱼猫轮廓
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.arc(0, -20, 55, Math.PI, 0);
        ctx.lineTo(55, 20);
        ctx.bezierCurveTo(25, 45, -25, 45, -55, 20);
        ctx.closePath();
        ctx.fill();
        
        // 眼睛
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.arc(-18, -5, 7, 0, Math.PI * 2);
        ctx.arc(18, -5, 7, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.beginPath();
        ctx.arc(-18, -5, 3, 0, Math.PI * 2);
        ctx.arc(18, -5, 3, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'qq') {
        // 企鹅轮廓
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.beginPath();
        ctx.ellipse(0, 10, 45, 60, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 脸
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(0, -10, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // 嘴
        ctx.fillStyle = 'rgba(255,165,0,0.95)';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(0, 10);
        ctx.lineTo(10, 0);
        ctx.closePath();
        ctx.fill();
    } else {
        // 其它星球：自定义抽象纹理
        ctx.rotate(-Math.PI / 6);
        ctx.strokeStyle = `rgba(255, 255, 255, 0.15)`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, size / 2 - 30, Math.PI * 0.1, Math.PI * 0.9);
        ctx.stroke();
        
        // 叠加几条弧线和网格，形成差异化质感
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(255, 255, 255, 0.09)`;
        for (let i = 0; i < 3; i++) {
            const r = size / 2 - 50 - i * 18;
            ctx.beginPath();
            ctx.arc(0, 0, r, Math.PI * 0.2 * i, Math.PI * (1.2 + 0.2 * i));
            ctx.stroke();
        }
        
        ctx.rotate(Math.PI / 6);
        ctx.strokeStyle = `rgba(255, 255, 255, 0.08)`;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(-size / 2, i * 18);
            ctx.lineTo(size / 2, i * 18);
            ctx.stroke();
        }
    }
    ctx.restore();
    
    // 中心文字（作为补充标签）
    ctx.font = 'bold 60px "Orbitron", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label.substring(0, 4), size / 2, size / 2 + 4);
    
    return new THREE.CanvasTexture(canvas);
}

function createParticleSystem(particleCountOverride) {
    // 创建粒子几何体
    const particleCount = particleCountOverride || currentBackgroundParticleCount || baseBackgroundParticleCount;
    currentBackgroundParticleCount = particleCount;
    
    // 如果粒子数量为0，直接返回（等待GitHub star数驱动）
    if (particleCount <= 0) {
        return;
    }
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        // 随机位置（球状分布）
        const radius = 5 + Math.random() * 20;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.cos(phi);
        positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
        
        // 随机颜色（基于主题）
        const theme = document.body.classList.contains('matrix-theme') ? 'matrix' :
                     document.body.classList.contains('neon-theme') ? 'neon' :
                     document.body.classList.contains('solar-theme') ? 'solar' : 'arctic';
        
        let r, g, b;
        switch (theme) {
            case 'matrix':
                r = 0; g = 1; b = 0.2;
                break;
            case 'neon':
                r = 1; g = 0; b = 1;
                break;
            case 'solar':
                r = 1; g = 0.6; b = 0;
                break;
            case 'arctic':
                r = 0; g = 1; b = 1;
                break;
        }
        
        // 添加随机性
        r += (Math.random() - 0.5) * 0.3;
        g += (Math.random() - 0.5) * 0.3;
        b += (Math.random() - 0.5) * 0.3;
        
        colors[i * 3] = Math.max(0, Math.min(1, r));
        colors[i * 3 + 1] = Math.max(0, Math.min(1, g));
        colors[i * 3 + 2] = Math.max(0, Math.min(1, b));
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // 创建粒子材质
    const material = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    
    // 创建粒子系统
    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
}

function createStarParticles() {
    // 创建GitHub星星粒子
    const starCount = 100;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    
    // 初始化星星位置（围绕中央恒星）
    for (let i = 0; i < starCount; i++) {
        const radius = 2 + Math.random() * 8;
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 2;
        
        starPositions[i * 3] = Math.cos(angle) * radius;
        starPositions[i * 3 + 1] = height;
        starPositions[i * 3 + 2] = Math.sin(angle) * radius;
        
        starSizes[i] = 0.05 + Math.random() * 0.1;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    
    // 星星材质
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffff00,
        size: 0.1,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    starParticles.push(stars);
}

function createDataStreams() {
    // 创建数据流线条
    const lineCount = 20;
    
    for (let i = 0; i < lineCount; i++) {
        // 创建随机路径
        const points = [];
        const segments = 10;
        
        for (let j = 0; j <= segments; j++) {
            const progress = j / segments;
            const angle = progress * Math.PI * 2 + i * 0.3;
            const radius = 3 + Math.sin(progress * Math.PI * 4) * 2;
            
            points.push(new THREE.Vector3(
                Math.cos(angle) * radius,
                (progress - 0.5) * 4,
                Math.sin(angle) * radius
            ));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x00ff41,
            transparent: true,
            opacity: 0.3,
            linewidth: 1
        });
        
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        
        // 保存引用用于动画
        particles.push({
            mesh: line,
            speed: 0.01 + Math.random() * 0.02,
            offset: Math.random() * Math.PI * 2
        });
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    // 更新时间
    const time = Date.now() * 0.001;
    
    // 更新中央恒星
    if (centralStar && centralStar.material.uniforms) {
        centralStar.material.uniforms.time.value = time;
        
        // 悬停时停止自转并略微放大
        if (centralStarHovered) {
            centralStar.rotation.y += 0;
            centralStar.scale.set(1.15, 1.15, 1.15);
        } else {
            centralStar.rotation.y += 0.005;
            centralStar.scale.set(1, 1, 1);
        }
    }
    
    // 更新行星
    planets.forEach(planet => {
        if (planet.mesh) {
            // 轨道运动（悬停时暂停）
            if (!planet.isHovered) {
                planet.angle += planet.orbitSpeed;
            }
            planet.mesh.position.x = Math.cos(planet.angle) * planet.orbitRadius;
            planet.mesh.position.z = Math.sin(planet.angle) * planet.orbitRadius;
            
            // 自转
            planet.mesh.rotation.y += planet.rotationSpeed;
            planet.mesh.rotation.x += planet.rotationSpeed * 0.5;
            
            // 轻微上下浮动
            planet.mesh.position.y = Math.sin(time + planet.angle) * 0.3;
        }
        
        // 更新 2D 标签位置（提高可辨识度）
        if (planet.mesh && planet.labelElement) {
            const vector = planet.mesh.position.clone();
            vector.project(camera);
            
            if (vector.z < 1) {
                const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
                
                planet.labelElement.style.transform = `translate3d(${x}px, ${y - 18}px, 0)`;
                planet.labelElement.style.opacity = planet.isHovered ? '1' : '0.6';
            } else {
                planet.labelElement.style.opacity = '0';
            }
        }
    });
    
    // 更新粒子系统
    if (particleSystem) {
        particleSystem.rotation.y += 0.0005;
    }
    
    // 更新星星粒子
    starParticles.forEach(stars => {
        stars.rotation.y += 0.001;
    });
    
    // 更新数据流
    particles.forEach(particle => {
        if (particle.mesh) {
            particle.mesh.material.opacity = 0.2 + Math.sin(time + particle.offset) * 0.1;
        }
    });
    
    // 更新控制器
    if (orbitControls) {
        orbitControls.update();
    }
    
    // 渲染场景
    renderer.render(scene, camera);
}

// 更新主题颜色
function updateThemeColors(theme) {
    // 更新中央恒星颜色
    if (centralStar && centralStar.material.uniforms) {
        let color;
        switch (theme) {
            case 'matrix': color = new THREE.Color(0x00ff41); break;
            case 'neon': color = new THREE.Color(0xff00ff); break;
            case 'solar': color = new THREE.Color(0xffaa00); break;
            case 'arctic': color = new THREE.Color(0x00ffff); break;
            default: color = new THREE.Color(0x00ff41);
        }
        centralStar.material.uniforms.primaryColor.value = color;
    }
    
    // 保持行星自身颜色 / 纹理不变，仅通过 CSS 主题与中央恒星颜色体现主题变化

    // 重新创建粒子系统以匹配新主题（保持当前粒子数量）
    if (particleSystem) {
        scene.remove(particleSystem);
        createParticleSystem(currentBackgroundParticleCount);
    }
}

// 根据 GitHub star 数更新背景粒子数量
function updateBackgroundParticlesFromStars(totalStars) {
    // 根据 star 数映射到粒子数量，控制在一个合理范围内
    // 从 0 开始，根据已有 star 基数逐步增加
    const minParticles = 0;
    const maxParticles = 10000;
    
    let target = minParticles;
    if (totalStars && totalStars > 0) {
        // 非线性放大，少量 star 也有明显变化
        target = minParticles + Math.floor(Math.pow(totalStars, 0.85) * 40);
    }
    target = Math.max(minParticles, Math.min(maxParticles, target));
    
    console.log(`根据 GitHub stars(${totalStars}) 设置背景粒子数: ${target}`);
    if (window.addTerminalLine) {
        window.addTerminalLine(`> 根据 GitHub stars 调整背景粒子: ${target}`);
    }
    
    if (particleSystem && scene) {
        scene.remove(particleSystem);
        particleSystem = null;
    }
    createParticleSystem(target);
}

function createAboutOverlay() {
    if (aboutOverlay) return;
    
    aboutOverlay = document.createElement('div');
    aboutOverlay.className = 'about-overlay';
    aboutOverlay.innerHTML = `
        <div class="about-panel">
            <button class="about-close" type="button">×</button>
            <div class="about-title">ABOUT ME</div>
            <div class="about-body">
                <p>Hi, 我是<span class="about-highlight">internetsb</span>。</p>
                <p>不正经的CSer,AI编程重度依赖者</p>
                <p>这个星系里的不同星球，都是我的小网站和联系方式。背景的星空代表我的star数</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(aboutOverlay);
    
    const closeBtn = aboutOverlay.querySelector('.about-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hideAboutOverlay();
        });
    }
    
    // 点击遮罩空白处关闭
    aboutOverlay.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.target === aboutOverlay) {
            hideAboutOverlay();
        }
    });
}

function showAboutOverlay() {
    createAboutOverlay();
    if (aboutOverlay) {
        aboutOverlay.classList.add('visible');
    }
}

function hideAboutOverlay() {
    if (aboutOverlay) {
        aboutOverlay.classList.remove('visible');
    }
}

// 导出到全局作用域
window.initThreeScene = initThreeScene;
window.updateThemeColors = updateThemeColors;
window.updateStarParticlesCount = updateBackgroundParticlesFromStars;