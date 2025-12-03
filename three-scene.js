// Three.js 3D场景初始化

let scene, camera, renderer;
let planets = [];
let particles = [];
let particleSystem;
let starParticles = [];
let centralStar;
let orbitControls;

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
    
    // 创建粒子系统
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
    // 行星配置
    const planetConfigs = [
        {
            name: "博客",
            radius: 0.8,
            orbitRadius: 4,
            orbitSpeed: 0.002,
            rotationSpeed: 0.01,
            color: 0x00aaff,
            type: "blog"
        },
        {
            name: "项目",
            radius: 1.0,
            orbitRadius: 6,
            orbitSpeed: 0.0015,
            rotationSpeed: 0.008,
            color: 0xffaa00,
            type: "projects"
        },
        {
            name: "简历",
            radius: 0.7,
            orbitRadius: 3,
            orbitSpeed: 0.003,
            rotationSpeed: 0.015,
            color: 0xff00ff,
            type: "resume"
        },
        {
            name: "实验",
            radius: 0.6,
            orbitRadius: 5,
            orbitSpeed: 0.002,
            rotationSpeed: 0.012,
            color: 0x00ffaa,
            type: "lab"
        }
    ];
    
    planetConfigs.forEach((config, index) => {
        // 创建行星几何体
        let geometry;
        if (config.type === "blog") {
            geometry = new THREE.OctahedronGeometry(config.radius, 2);
        } else if (config.type === "projects") {
            geometry = new THREE.DodecahedronGeometry(config.radius, 1);
        } else {
            geometry = new THREE.IcosahedronGeometry(config.radius, 1);
        }
        
        // 创建材质
        const material = new THREE.MeshPhongMaterial({
            color: config.color,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        
        // 创建网格
        const planet = new THREE.Mesh(geometry, material);
        
        // 计算初始位置（分布在圆上）
        const angle = (index / planetConfigs.length) * Math.PI * 2;
        planet.position.x = Math.cos(angle) * config.orbitRadius;
        planet.position.z = Math.sin(angle) * config.orbitRadius;
        planet.position.y = (Math.random() - 0.5) * 0.5;
        
        // 添加到场景
        scene.add(planet);
        
        // 保存行星数据
        planets.push({
            mesh: planet,
            name: config.name,
            type: config.type,
            radius: config.radius,
            orbitRadius: config.orbitRadius,
            orbitSpeed: config.orbitSpeed,
            rotationSpeed: config.rotationSpeed,
            angle: angle,
            color: config.color
        });
        
        // 创建轨道线
        createOrbitLine(config.orbitRadius, config.color);
        
        // 为行星添加点击事件
        addPlanetInteraction(planet, config);
    });
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

function addPlanetInteraction(planet, config) {
    // 创建射线检测器
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // 鼠标移动事件
    window.addEventListener('mousemove', (event) => {
        // 计算标准化设备坐标
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // 更新射线
        raycaster.setFromCamera(mouse, camera);
        
        // 计算与行星的交点
        const intersects = raycaster.intersectObject(planet);
        
        if (intersects.length > 0) {
            // 悬停效果
            planet.material.emissive = new THREE.Color(config.color);
            planet.material.emissiveIntensity = 0.5;
            planet.scale.setScalar(1.1);
            
            // 显示行星名称（在实际应用中，可以显示一个标签）
            document.body.style.cursor = 'pointer';
        } else {
            // 恢复默认
            planet.material.emissive = new THREE.Color(0x000000);
            planet.material.emissiveIntensity = 0;
            planet.scale.setScalar(1.0);
            document.body.style.cursor = 'default';
        }
    });
    
    // 点击事件
    window.addEventListener('click', () => {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(planet);
        
        if (intersects.length > 0) {
            // 添加终端消息
            if (window.addTerminalLine) {
                window.addTerminalLine(`> 正在导航到: ${config.name}`);
            }
            
            // 在实际应用中，这里应该导航到相应的页面
            // 例如：window.open(config.url, '_blank');
            
            // 添加点击效果
            planet.material.emissiveIntensity = 1.0;
            setTimeout(() => {
                planet.material.emissiveIntensity = 0;
            }, 300);
        }
    });
}

function createParticleSystem() {
    // 创建粒子几何体
    const particleCount = 5000;
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
        centralStar.rotation.y += 0.005;
    }
    
    // 更新行星
    planets.forEach(planet => {
        if (planet.mesh) {
            // 轨道运动
            planet.angle += planet.orbitSpeed;
            planet.mesh.position.x = Math.cos(planet.angle) * planet.orbitRadius;
            planet.mesh.position.z = Math.sin(planet.angle) * planet.orbitRadius;
            
            // 自转
            planet.mesh.rotation.y += planet.rotationSpeed;
            planet.mesh.rotation.x += planet.rotationSpeed * 0.5;
            
            // 轻微上下浮动
            planet.mesh.position.y = Math.sin(time + planet.angle) * 0.3;
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
    
    // 更新行星颜色
    planets.forEach(planet => {
        if (planet.mesh && planet.mesh.material) {
            switch (theme) {
                case 'matrix':
                    if (planet.type === 'blog') planet.mesh.material.color.setHex(0x00aaff);
                    else if (planet.type === 'projects') planet.mesh.material.color.setHex(0xffaa00);
                    else if (planet.type === 'resume') planet.mesh.material.color.setHex(0xff00ff);
                    else planet.mesh.material.color.setHex(0x00ffaa);
                    break;
                case 'neon':
                    planet.mesh.material.color.setHex(0xff00ff);
                    break;
                case 'solar':
                    planet.mesh.material.color.setHex(0xffaa00);
                    break;
                case 'arctic':
                    planet.mesh.material.color.setHex(0x00ffff);
                    break;
            }
        }
    });
    
    // 重新创建粒子系统以匹配新主题
    if (particleSystem) {
        scene.remove(particleSystem);
        createParticleSystem();
    }
}

// 导出到全局作用域
window.initThreeScene = initThreeScene;
window.updateThemeColors = updateThemeColors;