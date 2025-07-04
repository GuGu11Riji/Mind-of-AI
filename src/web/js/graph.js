// graph.js
// 封装D3.js图谱渲染逻辑 (增强版)

export function renderKnowledgeGraph(data, svgElement, tooltipElement, documentsMap) {
    const width = svgElement.clientWidth;
    const height = svgElement.clientHeight;

    const svg = d3.select(svgElement);
    svg.selectAll("*").remove(); // 清除旧的图谱，防止重复渲染

    const g = svg.append("g"); // 创建一个g元素用于缩放和平移

    // 缩放行为
    const zoom = d3.zoom()
        .scaleExtent([0.1, 8]) // 缩放范围
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });
    svg.call(zoom);

    // 力导向布局模拟
    const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links).id(d => d.id).distance(150).strength(0.7)) // 链接力，距离和强度调整
        .force("charge", d3.forceManyBody().strength(-500).distanceMax(300)) // 节点排斥力，强度和最大距离调整
        .force("center", d3.forceCenter(width / 2, height / 2)) // 居中力
        .force("collision", d3.forceCollide().radius(d => { // 碰撞力，防止节点重叠
            // 根据节点类型调整碰撞半径，确保不同大小节点不重叠
            if (d.type === "document") return 25; // 文档节点半径+一些间距
            if (d.type === "concept") return 20; // 概念节点半径+一些间距
            return 20;
        }));

    // 绘制链接
    const link = g.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(data.links)
        .enter().append("line")
        .attr("class", "link");

    // 绘制节点 (将圆形和文本组合在一个g元素中)
    const node = g.append("g")
        .attr("class", "nodes")
        .selectAll(".node")
        .data(data.nodes)
        .enter().append("g")
        .attr("class", d => `node type-${d.type}`) // 根据type添加CSS类
        .call(d3.drag() // 拖拽行为
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("circle")
        .attr("r", d => d.type === "document" ? 18 : 14); // 根据类型设置半径

    // 为节点添加文本标签
    const nodeText = node.append("text")
        .attr("dy", "0.35em") // 垂直居中
        .text(d => d.label); // 显示节点标签

    // 如果想在节点上显示小图标或emoji，可以在这里添加另一个text元素，并调整位置
    // 例如：
    // node.append("text")
    //     .attr("class", "node-icon")
    //     .attr("dy", "-0.8em") // 放在节点上方
    //     .text(d => documentsMap.get(d.id)?.icon || ""); // 从documentsMap获取图标

    // 更新节点和链接位置
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // 节点交互：鼠标悬停显示信息
    node.on("mouseover", function(event, d) {
        const docInfo = documentsMap.get(d.id);
        if (docInfo) { // 确保是存在于documentsMap中的节点才显示tooltip
            tooltipElement.title.textContent = docInfo.title;
            tooltipElement.filename.textContent = docInfo.filename || "N/A"; // 概念节点没有文件名
            tooltipElement.abstract.textContent = docInfo.abstract;
            tooltipElement.keywords.textContent = (docInfo.keywords && docInfo.keywords.length > 0) ? docInfo.keywords.join(", ") : "无";
            
            // 只有文档节点才显示PDF链接
            if (docInfo.path) {
                tooltipElement.link.href = docInfo.path;
                tooltipElement.link.style.display = "block"; // 显示链接
            } else {
                tooltipElement.link.style.display = "none"; // 隐藏链接
            }

            // 设置tooltip位置
            const tooltipWidth = tooltipElement.container.offsetWidth;
            const tooltipHeight = tooltipElement.container.offsetHeight;
            
            // 尝试将tooltip放在鼠标右下方，但要确保不超出屏幕
            let tooltipX = event.pageX + 20;
            let tooltipY = event.pageY + 20;

            if (tooltipX + tooltipWidth > window.innerWidth) {
                tooltipX = event.pageX - tooltipWidth - 20; // 放到左边
            }
            if (tooltipY + tooltipHeight > window.innerHeight) {
                tooltipY = event.pageY - tooltipHeight - 20; // 放到上面
            }
            
            tooltipElement.container.style.left = `${tooltipX}px`;
            tooltipElement.container.style.top = `${tooltipY}px`;
            tooltipElement.container.classList.add("active");
        }
    });

    // 节点交互：鼠标移出隐藏信息
    node.on("mouseout", function() {
        tooltipElement.container.classList.remove("active");
    });

    // 节点交互：点击跳转PDF
    node.on("click", function(event, d) {
        const docInfo = documentsMap.get(d.id);
        if (docInfo && docInfo.path) { // 只有有路径的文档节点才跳转
            window.open(docInfo.path, '_blank');
        }
    });

    // 拖拽函数
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
}
