// js/galaxy-background.js

document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('galaxy-canvas');
    const ctx = canvas.getContext('2d');

    let width, height;
    let center = {};

    // --- 黑洞中心配置 ---
    const blackHole = {
        x: 0, // 会在resizeCanvas中设置
        y: 0, // 会在resizeCanvas中设置
        radius: 40, // 黑洞视界半径
        pullStrength: 0.8, // 引力强度
        eventHorizonColor: 'rgba(0, 0, 0, 0.8)', // 视界颜色
        coronaParticles: [], // 黑洞周围的日冕或吸积盘粒子
        numCoronaParticles: 200,
        coronaParticleSize: { min: 0.5, max: 2 },
        coronaParticleSpeed: { min: 0.005, max: 0.05 },
        coronaLightIntensity: 0.0, // 光晕强度
        coronaLightSpeed: 0.03, // 光晕变化速度
        rainbowHueOffset: 0 // 彩虹色偏移
    };

    // --- 粒子纠缠和星系拓扑轨迹 (Nebula Particles) ---
    // 这将模拟星系气体和尘埃的宏观流动
    const nebulaParticles = [];
    const numNebulaParticles = 400; // 更多粒子形成星云
    const nebulaParticleConfig = {
        radius: { min: 0.1, max: 0.8 },
        alpha: { min: 0.05, max: 0.3 },
        speed: { min: 0.1, max: 0.5 }, // 基础移动速度
        maxLife: 200 // 粒子生命周期，用于模拟流动和重生
    };

    // --- 粒子环 (保持不变，但可能受黑洞引力影响) ---
    const particleRing = {
        majorAxis: 200,
        minorAxis: 100,
        numParticles: 300,
        particles: [],
        speed: 0.005
    };

    // --- 行星配置 (将受到黑洞引力影响) ---
    const planetsData = [
        // ... 之前的行星数据，保持不变 ...
        { name: "水星", radius: 5, distance: 280, color: '#A0A0A0', angle: 0, speed: 0.008 },
        { name: "金星", radius: 7, distance: 330, color: '#FFA500', angle: Math.PI / 4, speed: 0.006 },
        { name: "地球", radius: 8, distance: 380, color: '#00BFFF', angle: Math.PI / 2, speed: 0.004 },
        { name: "火星", radius: 6, distance: 430, color: '#FF4500', angle: 3 * Math.PI / 4, speed: 0.003 },
        { name: "木星", radius: 15, distance: 500, color: '#DAA520', angle: Math.PI, speed: 0.002 },
        { name: "土星", radius: 12, distance: 570, color: '#E6E6FA', angle: 5 * Math.PI / 4, speed: 0.0018, hasRing: true },
        { name: "天王星", radius: 10, distance: 640, color: '#ADD8E6', angle: 3 * Math.PI / 2, speed: 0.0015 },
        { name: "海王星", radius: 9, distance: 700, color: '#4169E1', angle: 7 * Math.PI / 4, speed: 0.0012 }
    ];

    // --- 静态星空 (背景，减少数量) ---
    let staticStars = [];
    const numStaticStars = 100; // 进一步减少数量
    const minStaticStarRadius = 0.5;
    const maxStaticStarRadius = 1;

    // --- Perlin 噪声函数 (用于拓扑轨迹) ---
    // 这是一个简化版本，实际Perlin噪声库会更复杂，这里仅为示意
    // 为了实际项目，建议引入一个成熟的Perlin噪声库，例如 'perlin-js'
    // 这里我们将用一个非常简化的伪随机函数来代替，实现“流动”感
    let noiseSeed = Math.random() * 1000;
    function getNoise(x, y, scale = 0.1) {
        // 伪Perlin噪声，用Math.sin/cos模拟，实际效果会差很多
        // 仅用于概念演示，强烈建议集成真实的Perlin噪声库
        return Math.sin(x * scale + noiseSeed) * Math.cos(y * scale + noiseSeed);
    }


    // --- 工具函数 ---
    function getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }

    // --- 初始化 Canvas 尺寸和元素 ---
    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        center = { x: width / 2, y: height / 2 };

        // 黑洞中心设置在画布中心
        blackHole.x = center.x;
        blackHole.y = center.y;

        // 重新生成动态元素以适应新尺寸
        createCoronaParticles();
        createParticleRing();
        createNebulaParticles(); // 新增星云粒子
        createStaticStars();
    }

    // --- 黑洞吸积盘/日冕粒子创建 ---
    function createCoronaParticles() {
        blackHole.coronaParticles = [];
        for (let i = 0; i < blackHole.numCoronaParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = getRandom(blackHole.radius * 0.8, blackHole.radius * 2.5); // 分布在黑洞周围
            blackHole.coronaParticles.push({
                x: blackHole.x + dist * Math.cos(angle),
                y: blackHole.y + dist * Math.sin(angle),
                radius: getRandom(blackHole.coronaParticleSize.min, blackHole.coronaParticleSize.max),
                alpha: getRandom(0.2, 0.7),
                angle: angle, // 用于旋转
                distance: dist,
                speed: getRandom(blackHole.coronaParticleSpeed.min, blackHole.coronaParticleSpeed.max),
                life: getRandom(50, 150) // 生命周期，用于粒子重生
            });
        }
    }

    // --- 粒子环创建 ---
    function createParticleRing() {
        particleRing.particles = [];
        for (let i = 0; i < particleRing.numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            particleRing.particles.push({
                angle: angle,
                radiusX: particleRing.majorAxis * getRandom(0.9, 1.1),
                radiusY: particleRing.minorAxis * getRandom(0.9, 1.1),
                size: getRandom(1, 2.5),
                alpha: getRandom(0.3, 0.8)
            });
        }
    }

    // --- 星系拓扑轨迹粒子 (星云粒子) 创建 ---
    function createNebulaParticles() {
        nebulaParticles.length = 0; // 清空
        for (let i = 0; i < numNebulaParticles; i++) {
            nebulaParticles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: getRandom(nebulaParticleConfig.radius.min, nebulaParticleConfig.radius.max),
                alpha: getRandom(nebulaParticleConfig.alpha.min, nebulaParticleConfig.alpha.max),
                life: getRandom(0, nebulaParticleConfig.maxLife), // 初始生命值
                maxLife: nebulaParticleConfig.maxLife
            });
        }
    }

    // --- 静态星空创建 ---
    function createStaticStars() {
        staticStars = [];
        for (let i = 0; i < numStaticStars; i++) {
            staticStars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: getRandom(minStaticStarRadius, maxStaticStarRadius),
                alpha: Math.random()
            });
        }
    }

    // --- 计算引力影响 (统一函数) ---
    function applyGravity(p) {
        const dx = blackHole.x - p.x;
        const dy = blackHole.y - p.y;
        const distanceSq = dx * dx + dy * dy;
        const distance = Math.sqrt(distanceSq);

        if (distance < blackHole.radius) {
            // 如果进入事件视界，可以移除或重置粒子
            // 例如：p.x = getRandom(0, width); p.y = getRandom(0, height); return;
            // 对于行星，我们让它减速并被吸入，然后重新出现在远处
            if (p.name) { // 如果是行星
                p.angle = Math.random() * Math.PI * 2;
                p.distance = p.initialDistance || p.distance; // 恢复初始距离
                p.x = blackHole.x + p.distance * Math.cos(p.angle);
                p.y = blackHole.y + p.distance * Math.sin(p.angle);
                return;
            }
            // 对于粒子，直接重置
            p.x = getRandom(0, width);
            p.y = getRandom(0, height);
            p.life = 0; // 重置生命周期
            return;
        }

        // 引力强度与距离平方成反比
        const force = blackHole.pullStrength / distanceSq;

        // 计算引力方向的单位向量
        const angle = Math.atan2(dy, dx);
        const ax = force * Math.cos(angle);
        const ay = force * Math.sin(angle);

        // 假设粒子有vx, vy，这里简化为直接对位置施加影响
        // 更真实的模拟会更新粒子的速度(vx, vy)
        p.x += ax * 50; // 放大效果，使其可见
        p.y += ay * 50;
    }


    // --- 绘制静态背景星星 ---
    function drawStaticStars() {
        staticStars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
            ctx.fill();
        });
    }

    // --- 绘制黑洞核心及吸积盘 ---
    function drawBlackHole() {
        ctx.save();
        ctx.translate(blackHole.x, blackHole.y);

        // 1. 绘制黑洞视界 (模糊和颜色)
        ctx.beginPath();
        ctx.arc(0, 0, blackHole.radius, 0, Math.PI * 2);
        ctx.fillStyle = blackHole.eventHorizonColor;
        ctx.shadowBlur = 30; // 模糊效果
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.fill();
        ctx.shadowBlur = 0; // 重置

        // 2. 绘制星体中心散射彩虹宇宙色（吸积盘内环光晕）
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, blackHole.radius * 1.5); // 稍微超出视界
        blackHole.rainbowHueOffset = (blackHole.rainbowHueOffset + 0.3) % 360;
        for (let i = 0; i <= 10; i++) {
            const hue = (blackHole.rainbowHueOffset + i * 36) % 360;
            // 光晕强度影响透明度
            gradient.addColorStop(i / 10, `hsla(${hue}, 100%, 70%, ${0.1 + 0.6 * (1 - i / 10) * blackHole.coronaLightIntensity})`);
        }
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, blackHole.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 3. 绘制忽明忽暗的吸积盘粒子
        blackHole.coronaParticles.forEach(p => {
            // 粒子围绕黑洞旋转并闪烁
            p.angle += p.speed;
            p.x = p.distance * Math.cos(p.angle);
            p.y = p.distance * Math.sin(p.angle);

            // 模拟闪烁
            p.alpha += p.speed * 10; // 加快闪烁速度
            if (p.alpha <= 0.1 || p.alpha >= 1) {
                p.speed = -p.speed;
            }

            // 绘制粒子
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * blackHole.coronaLightIntensity, 0, Math.PI * 2); // 大小受光晕强度影响
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * blackHole.coronaLightIntensity})`;
            ctx.fill();

            // 简单重生机制
            if (p.life-- <= 0) {
                 p.x = getRandom(-blackHole.radius*2, blackHole.radius*2); // 重生在附近
                 p.y = getRandom(-blackHole.radius*2, blackHole.radius*2);
                 p.life = getRandom(50, 150);
                 p.alpha = getRandom(0.2, 0.7);
            }
        });
        ctx.restore();

        // 更新光晕强度
        blackHole.coronaLightIntensity += blackHole.coronaLightSpeed;
        if (blackHole.coronaLightIntensity <= 0.1 || blackHole.coronaLightIntensity >= 0.8) {
            blackHole.coronaLightSpeed = -blackHole.coronaLightSpeed;
        }
    }

    // --- 绘制粒子环 (现在可能受到引力影响) ---
    function drawParticleRing() {
        ctx.save();
        ctx.translate(center.x, center.y);

        particleRing.particles.forEach(p => {
            // 粒子环本身的旋转
            p.angle += particleRing.speed;
            let x = p.radiusX * Math.cos(p.angle);
            let y = p.radiusY * Math.sin(p.angle);

            // 将粒子的中心坐标传递给引力函数 (这里需要考虑粒子相对中心点的坐标)
            // 为了简化，我们假设粒子的x,y已经是相对于center的
            const tempP = { x: center.x + x, y: center.y + y }; // 转换为绝对坐标
            applyGravity(tempP); // 应用引力，会修改tempP.x, tempP.y

            // 再转换回相对坐标进行绘制
            x = tempP.x - center.x;
            y = tempP.y - center.y;

            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
            ctx.fill();
        });

        ctx.restore();
    }


    // --- 绘制星系拓扑轨迹粒子 (星云效果及纠缠) ---
    function drawNebulaParticles() {
        nebulaParticles.forEach(p => {
            // 粒子生命周期
            p.life++;
            if (p.life > p.maxLife) {
                p.x = Math.random() * width;
                p.y = Math.random() * height;
                p.life = 0;
                p.alpha = getRandom(nebulaParticleConfig.alpha.min, nebulaParticleConfig.alpha.max);
            }

            // 使用伪Perlin噪声模拟流动方向 (更真实的效果需要引入噪声库)
            const noiseFactorX = getNoise(p.x, p.y);
            const noiseFactorY = getNoise(p.y, p.x);

            p.x += noiseFactorX * nebulaParticleConfig.speed.max; // 移动
            p.y += noiseFactorY * nebulaParticleConfig.speed.max;

            // 边界检查和循环
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            // 应用黑洞引力
            applyGravity(p);

            // 绘制粒子
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * (1 - p.life / p.maxLife)})`; // 透明度随生命周期变化
            ctx.fill();

            // 粒子纠缠效应：与附近粒子连线 (简化版：仅与最近的N个粒子连线)
            // 这个部分计算量大，需要优化或限制
            const maxConnectionDist = 80; // 最大连接距离
            const maxConnections = 2; // 最多连接数

            let connections = [];
            for (let i = 0; i < nebulaParticles.length; i++) {
                if (p === nebulaParticles[i]) continue;
                const otherP = nebulaParticles[i];
                const dx = p.x - otherP.x;
                const dy = p.y - otherP.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < maxConnectionDist) {
                    connections.push({ particle: otherP, dist: dist });
                }
            }

            connections.sort((a, b) => a.dist - b.dist);
            for (let i = 0; i < Math.min(connections.length, maxConnections); i++) {
                const connectedP = connections[i].particle;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(connectedP.x, connectedP.y);
                // 连线透明度随距离变化，模拟能量衰减或纠缠强度
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * (1 - connections[i].dist / maxConnectionDist)})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        });
    }

    // --- 绘制八大行星 (现在受到黑洞引力影响) ---
    function drawPlanets() {
        ctx.save();
        ctx.translate(center.x, center.y); // 行星绘制仍然以中心为原点

        planetsData.forEach(planet => {
            planet.angle += planet.speed;

            // 计算行星的当前理想位置
            let currentX = planet.distance * Math.cos(planet.angle);
            let currentY = planet.distance * Math.sin(planet.angle);

            // 将行星的理想位置转换为绝对画布坐标，以应用引力
            const tempPlanetPos = { x: center.x + currentX, y: center.y + currentY, name: planet.name, initialDistance: planet.distance };
            applyGravity(tempPlanetPos); // 会修改 tempPlanetPos.x, tempPlanetPos.y

            // 将受引力影响后的位置转换回相对中心点的坐标
            const finalX = tempPlanetPos.x - center.x;
            const finalY = tempPlanetPos.y - center.y;

            // 绘制行星本身
            ctx.beginPath();
            ctx.arc(finalX, finalY, planet.radius, 0, Math.PI * 2);
            ctx.fillStyle = planet.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = planet.color;
            ctx.fill();

            if (planet.hasRing) {
                ctx.beginPath();
                ctx.ellipse(finalX, finalY, planet.radius * 2, planet.radius * 0.4, planet.angle, 0, Math.PI * 2);
                ctx.strokeStyle = '#BBB';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        });
        ctx.restore();
    }


    // --- 主动画循环 ---
    function animate() {
        ctx.clearRect(0, 0, width, height); // 清空整个画布

        drawStaticStars();      // 绘制背景星星 (最底层)
        drawNebulaParticles();  // 绘制星云粒子和纠缠 (中间层，受引力影响)
        drawParticleRing();     // 绘制粒子环 (中间层，受引力影响)
        drawPlanets();          // 绘制行星 (中间层，受引力影响)
        drawBlackHole();        // 绘制黑洞核心及吸积盘 (最顶层)

        requestAnimationFrame(animate);
    }

    // --- 初始化 ---
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animate();
});
