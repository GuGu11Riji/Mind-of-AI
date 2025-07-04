// graph.js
// 知识图谱渲染逻辑

// d3 库由于在 index.html 中全局引入，因此可以直接访问。
// 如果使用构建工具，这里会是 `import * as d3 from 'd3';`

export function renderKnowledgeGraph(graphData, svgElement, tooltipElements, documentsMap, config) {
    console.log("graph.js: renderKnowledgeGraph called with data:", graphData);
    console.log("graph.js: D3 Config received:", config);

    const svg = d3.select(svgElement);
    const container = d3.select(svgElement.parentNode); // 获取父容器以计算尺寸

    const width = container.node().offsetWidth;
    const height = container.node().offsetHeight;

    svg.attr("width", width).attr("height", height);
    svg.selectAll("*").remove(); // 清除旧的图谱元素，防止重复加载

    const g = svg.append("g"); // 用于承载所有图谱元素的组，便于缩放和平移

    // 实现缩放和平移
    const zoom = d3.zoom()
        .scaleExtent([0.1, 10]) // 允许的缩放范围
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });
    svg.call(zoom);

    // 根据 config.nodeColors 定义颜色方案
    const nodeColorScale = d3.scaleOrdinal()
        .domain(Object.keys(config.nodeColors))
        .range(Object.values(config.nodeColors));
    console.log("graph.js: Node color scale initialized:", nodeColorScale.domain(), nodeColorScale.range());

    // 计算每个节点的度（连接数），用于调整节点大小
    const nodeDegrees = new Map();
    graphData.links.forEach(link => {
        nodeDegrees.set(link.source, (nodeDegrees.get(link.source) || 0) + 1);
        nodeDegrees.set(link.target, (nodeDegrees.get(link.target) || 0) + 1);
    });
    graphData.nodes.forEach(node => {
        node.degree = nodeDegrees.get(node.id) || 0;
    });
    console.log("graph.js: Node degrees calculated.");

    // --- D3 力导向图渲染 ---
    const simulation = d3.forceSimulation(graphData.nodes)
        .force("link", d3.forceLink(graphData.links)
            .id(d => d.id)
            .distance(config.linkDistance) // 链接间距
            .strength(config.linkStrength)) // 链接强度
        .force("charge", d3.forceManyBody().strength(config.chargeStrength)) // 节点斥力
        .force("center", d3.forceCenter(width / 2, height / 2).strength(config.centerStrength)) // 节点向中心聚集
        .force("collide", d3.forceCollide().radius(d => config.nodeBaseRadius + (d.degree / 2) + config.collidePadding)) // 基于度数调整碰撞半径，确保不重叠
        .alphaDecay(config.alphaDecay) // 模拟冷却速度
        .velocityDecay(config.velocityDecay); // 速度衰减

    // 添加发光滤镜定义 (SVG <defs>)
    const defs = svg.append("defs");
    const filter = defs.append("filter")
        .attr("id", "glow");
    filter.append("feGaussianBlur")
        .attr("stdDeviation", "3.0") // 适度发光
        .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode")
        .attr("in", "coloredBlur");
    feMerge.append("feMergeNode")
        .attr("in", "SourceGraphic");

    // 绘制链接
    const link = g.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graphData.links)
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke", `rgba(128, 128, 128, ${config.linkOpacity})`) // 默认细、透明灰色
        .attr("stroke-width", config.linkStrokeWidth);

    // 绘制节点
    const node = g.append("g")
        .attr("class", "nodes")
        .selectAll(".node")
        .data(graphData.nodes)
        .enter().append("g")
        .attr("class", d => `node type-${d.type}`) // 添加类型 class
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("circle")
        .attr("r", d => config.nodeBaseRadius + (d.degree / 4)) // 节点半径根据度数微调，保持相对均匀
        .attr("data-id", d => d.id) // 用于查找节点
        .attr("fill", d => nodeColorScale(d.group || d.type)) // 根据 group 或 type 分配颜色
        .attr("stroke", d => d3.color(nodeColorScale(d.group || d.type)).darker(0.5)) // 边框颜色更深
        .attr("stroke-width", config.nodeStrokeWidth) // 边框粗细
        .style("filter", "url(#glow)"); // 应用发光滤镜

    // 添加节点标签 (如果需要，目前你的要求是无标注，此部分可以注释掉)
    /*
    node.append("text")
        .attr("dy", "0.35em") // 垂直居中
        .text(d => d.label)
        .style("font-size", "10px")
        .style("fill", "#fff")
        .style("pointer-events", "none") // 确保文本不影响鼠标事件
        .style("text-shadow", "0 0 3px #000"); // 添加文本阴影，增加可读性
    */

    // --- 节点鼠标事件 (Tooltip 显示/隐藏 和 点击跳转) ---
    node.on("mouseover", (event, d) => {
        const doc = documentsMap.get(d.id);
        if (doc && tooltipElements.container) {
            tooltipElements.title.textContent = doc.title || 'N/A';
            tooltipElements.filename.textContent = doc.filename ? `文件: ${doc.filename}` : 'N/A';
            tooltipElements.abstract.textContent = doc.abstract || '无摘要';
            tooltipElements.keywords.textContent = `关键词: ${doc.keywords && doc.keywords.length > 0 ? doc.keywords.join(', ') : '无'}`;
            // PDF 链接的路径仍然是相对于 index.html
            tooltipElements.link.href = doc.filename ? `./data/pdfs/${doc.filename}` : '#';
            tooltipElements.link.style.display = doc.filename ? 'inline-block' : 'none'; // 根据是否有文件名显示链接

            // Tooltip 定位逻辑 (考虑边界)
            // 获取当前鼠标在 SVG 内部的相对坐标
            const [mouseX, mouseY] = d3.pointer(event, container.node()); // 相对于容器而非SVG
            
            // Tooltip 初始位置相对于鼠标
            let tooltipX = mouseX + 20;
            let tooltipY = mouseY + 20;

            // 获取 tooltip 容器的父元素的尺寸 (这里应该是 #main-content 或者 body)
            const parentRect = tooltipElements.container.offsetParent.getBoundingClientRect();
            
            // 考虑 tooltip 自身尺寸，防止超出屏幕
            const tooltipWidth = tooltipElements.container.offsetWidth;
            const tooltipHeight = tooltipElements.container.offsetHeight;

            // 调整 X 轴位置，防止超出右边界
            if (tooltipX + tooltipWidth > parentRect.width - 20) {
                tooltipX = mouseX - tooltipWidth - 20;
            }
            // 调整 Y 轴位置，防止超出下边界
            if (tooltipY + tooltipHeight > parentRect.height - 20) {
                tooltipY = mouseY - tooltipHeight - 20;
            }

            // 设置 tooltip 的 position: absolute 的 top 和 left
            tooltipElements.container.style.left = `${tooltipX}px`;
            tooltipElements.container.style.top = `${tooltipY}px`;
            tooltipElements.container.classList.add('active');
        }

        // 高亮当前节点及其直接关联的节点和链接
        d3.select(event.currentTarget).select("circle")
            .transition()
            .duration(100)
            .attr("r", d => config.nodeBaseRadius + (d.degree / 4) + config.nodeHighlightRadiusIncrease)
            .attr("stroke", "#FFFFFF") // 高亮边框颜色为白色
            .attr("stroke-width", config.nodeHighlightStrokeWidth);

        // 突出显示关联链接和节点
        link.attr("stroke", l => {
            const isRelated = (l.source.id === d.id || l.target.id === d.id);
            return isRelated ? `rgba(255, 255, 255, ${config.linkHighlightOpacity})` : `rgba(128, 128, 128, ${config.linkOpacity * 0.3})`; // 关联链接更亮，其他非关联链接更暗
        })
            .attr("stroke-width", l => l.source.id === d.id || l.target.id === d.id ? config.linkHighlightStrokeWidth : config.linkStrokeWidth);

        node.select("circle")
            .attr("opacity", n => {
                const isRelatedToHighlighted = link.data().some(l => 
                    (l.source.id === d.id && l.target.id === n.id) || 
                    (l.target.id === d.id && l.source.id === n.id)
                );
                return isRelatedToHighlighted || n.id === d.id ? 1 : 0.2; // 非关联节点透明度降低更多
            });

    })
    .on("mouseout", (event, d) => {
        if (tooltipElements.container) {
            tooltipElements.container.classList.remove('active');
        }

        // 恢复所有节点和链接的默认样式
        d3.select(event.currentTarget).select("circle")
            .transition()
            .duration(200)
            .attr("r", d => config.nodeBaseRadius + (d.degree / 4))
            .attr("stroke", d => d3.color(nodeColorScale(d.group || d.type)).darker(0.5))
            .attr("stroke-width", config.nodeStrokeWidth);
        
        link.attr("stroke", `rgba(128, 128, 128, ${config.linkOpacity})`)
            .attr("stroke-width", config.linkStrokeWidth);

        node.select("circle").attr("opacity", 1);
    })
    .on("click", (event, d) => {
        const doc = documentsMap.get(d.id);
        if (doc && doc.filename) {
            window.open(`./data/pdfs/${doc.filename}`, '_blank'); // PDF 链接的路径仍然是相对于 index.html
        }
        event.stopPropagation(); // 防止点击节点时触发SVG的zoom事件
    });


    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x) // 直接连接到目标节点中心
            .attr("y2", d => d.target.y);

        node
            .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    console.log("graph.js: D3 rendering logic executed.");
}
