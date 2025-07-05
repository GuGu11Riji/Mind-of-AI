// js/main.js

document.addEventListener('DOMContentLoaded', function() {
    const svg = d3.select("#knowledge-graph");
    const width = document.getElementById("chart-container").clientWidth;
    const height = document.getElementById("chart-container").clientHeight;
    const tooltip = d3.select("#tooltip");

    svg.attr("width", width)
       .attr("height", height);

    // --- Refined Color Palette for Nodes ---
    // A more harmonious and vibrant palette fitting a cosmic/tech theme
    const colorScale = d3.scaleOrdinal()
        .domain([1, 2, 3, 4, 5]) // Corresponds to your category numbers
        .range([
            "#00C4B8", // Category 1: Teal - Machine Learning (Primary, calm but vibrant)
            "#66B3FF", // Category 2: Light Blue - Reinforcement Learning (Complementary, bright)
            "#FF9800", // Category 3: Orange - Deep Learning (Warm, impactful)
            "#E91E63", // Category 4: Pink/Magenta - NLP (Distinct, energetic)
            "#9C27B0"  // Category 5: Purple - Computer Vision (Mysterious, deep)
        ]);

    // D3's symbol generator for various shapes
    const symbolGenerator = d3.symbol();

    // Ensure nodes have 'shape' and 'radius' properties.
    // If not explicitly defined in data.js, assign defaults here.
    const nodesData = graphData.nodes.map(d => {
        let assignedShape = d.shape;
        let assignedRadius = d.radius;

        // Default shape and radius if not provided in data.js
        if (!assignedShape) {
            switch (d.category) {
                case 1: assignedShape = "circle"; break;
                case 2: assignedShape = "square"; break;
                case 3: assignedShape = "triangle"; break;
                case 4: assignedShape = "diamond"; break;
                case 5: assignedShape = "star"; break;
                default: assignedShape = "circle"; break;
            }
        }
        if (!assignedRadius) {
            assignedRadius = 15; // Default radius if none in data
        }

        // Map string shape names to D3 symbol types
        let d3SymbolType;
        switch (assignedShape) {
            case "circle": d3SymbolType = d3.symbolCircle; break;
            case "square": d3SymbolType = d3.symbolSquare; break;
            case "triangle": d3SymbolType = d3.symbolTriangle; break;
            case "diamond": d3SymbolType = d3.symbolDiamond; break;
            case "star": d3SymbolType = d3.symbolStar; break;
            default: d3SymbolType = d3.symbolCircle; break;
        }

        return { ...d, shape: d3SymbolType, radius: assignedRadius };
    });


    // --- D3 Force Simulation Setup ---
    const simulation = d3.forceSimulation(nodesData)
        .force("link", d3.forceLink(graphData.links)
            .id(d => d.id)
            .distance(link => {
                // Link distance based on category relationship
                const sourceCategory = nodesData.find(n => n.id === link.source.id).category;
                const targetCategory = nodesData.find(n => n.id === link.target.id).category;

                // Shorter distance for intra-category links, longer for inter-category
                if (sourceCategory === targetCategory) {
                    return 70 + (nodesData.find(n => n.id === link.source.id).radius + nodesData.find(n => n.id === link.target.id).radius); // Closer for same category
                }
                return 180; // Default distance
            })
            .strength(link => {
                // Stronger link strength for core, weaker for peripheral
                const sourceCategory = nodesData.find(n => n.id === link.source.id).category;
                const targetCategory = nodesData.find(n => n.id === link.target.id).category;

                if ((sourceCategory <= 2 && targetCategory <= 2) || (sourceCategory === targetCategory)) {
                    return 1.0; // Very strong for core concepts or strong intra-category
                } else if (sourceCategory >= 4 || targetCategory >= 4) {
                    return 0.4; // Weaker for more peripheral/diverse connections
                }
                return 0.7; // Default strength
            }))
        .force("charge", d3.forceManyBody()
            .strength(-1500) // Even stronger repulsion for distinct clusters
            .distanceMin(80) // Minimum distance increased for better separation
            .distanceMax(800) // Max repulsion distance increased
        )
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX().strength(0.06).x(width / 2))
        .force("y", d3.forceY().strength(0.06).y(height / 2))
        .force("collide", d3.forceCollide().radius(d => d.radius + 10)); // Increased collision radius for better spacing

    // --- Quantum Entanglement Link Effect (SVG Gradients & Animation) ---
    const defs = svg.append("defs");

    // Glow filter for nodes and links
    const glowFilter = defs.append("filter")
        .attr("id", "glow")
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");
    glowFilter.append("feGaussianBlur")
        .attr("stdDeviation", "5") // More pronounced glow
        .attr("result", "coloredBlur");
    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // --- Dynamic Link Gradients ---
    // Create a unique gradient for each link based on connected node colors
    graphData.links.forEach((l, i) => {
        // Ensure source and target nodes are found before accessing category
        const sourceNode = nodesData.find(n => n.id === l.source.id);
        const targetNode = nodesData.find(n => n.id === l.target.id);

        if (!sourceNode || !targetNode) {
            console.warn(`Link (source: ${l.source.id}, target: ${l.target.id}) has missing node data.`);
            return; // Skip this link if node data is incomplete
        }

        const sourceColor = colorScale(sourceNode.category);
        const targetColor = colorScale(targetNode.category);

        const gradient = defs.append("linearGradient")
            .attr("id", `link-gradient-${i}`)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", "0%").attr("y1", "0%")
            .attr("x2", "100%").attr("y2", "0%"); // Will be updated dynamically on tick

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", sourceColor);
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", targetColor);
    });

    // --- Drawing Links (Edges) ---
    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graphData.links)
        .enter().append("line")
        .attr("stroke-width", 3) // Base width
        .attr("stroke", (d, i) => `url(#link-gradient-${i})`) // Use dynamic gradient for each link
        .attr("filter", "url(#glow)"); // Apply glow filter

    // Quantum Entanglement Link Animation (more subtle and refined)
    function animateLinkDash() {
         link
            .style("stroke-dasharray", "15 10") // Longer dash for smoother flow
            .style("stroke-dashoffset", 0)
            .transition()
            .duration(4000) // Slower animation duration
            .ease(d3.easeLinear)
            .tween("dash", function() {
                const l = this;
                return function(t) {
                    l.style.strokeDashoffset = (45 * t); // Adjust speed of flow
                };
            })
            .on("end", animateLinkDash); // Loop indefinitely
    }
    animateLinkDash(); // Start the animation


    // --- Drawing Nodes (with multiple shapes and advanced styling) ---
    const nodeGroup = svg.append("g")
        .attr("class", "nodes");

    const node = nodeGroup.selectAll(".node-group")
        .data(nodesData)
        .enter().append("g")
        .attr("class", d => `node-group category-${d.category}`)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("path")
        .attr("d", d => {
            // Adjust symbol size based on radius. Multiplier (e.g., 2.0) can be fine-tuned.
            // Using area calculation for more consistent visual size across shapes.
            symbolGenerator.type(d.shape)
                           .size(Math.PI * d.radius * d.radius * 2.0); // Larger multiplier for prominent shapes
            return symbolGenerator();
        })
        .attr("fill", d => colorScale(d.category))
        .attr("stroke", d => d3.color(colorScale(d.category)).darker(1.2)) // Even darker stroke for definition
        .attr("stroke-width", 3) // Thicker stroke
        .attr("filter", "url(#glow)") // Apply glow filter
        .style("cursor", "pointer");

    // Add text labels to nodes
    node.append("text")
        .attr("dy", "0.35em")
        .attr("y", d => d.radius + 10) // Position text further below the shape
        .attr("text-anchor", "middle")
        .attr("fill", "#F0F0F0") // Brighter white for labels
        .style("font-size", "12px") // Slightly larger font for readability
        .style("font-weight", "bold")
        .style("pointer-events", "none")
        .style("user-select", "none")
        .style("text-shadow", "0 0 10px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.9)") // More intense text shadow
        .text(d => d.name);

    // --- Node Interaction (Hover Effects) ---
    node.on("mouseover", function(event, d) {
        // Check if a pdfPath exists and add a hint to the tooltip
        let tooltipHtml = `<strong>${d.name}</strong><br>${d.info}`;
        if (d.pdfPath) {
            tooltipHtml += '<br><span style="color:#66B3FF;">点击查看相关文档</span>';
        }
        tooltip.html(tooltipHtml)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px")
            .classed("hidden", false);

        // Highlight current node path
        d3.select(this).select("path")
            .transition().duration(150)
            .attr("stroke-width", 5) // Even thicker stroke
            .attr("stroke", d3.color(colorScale(d.category)).brighter(2.5)) // Very bright stroke
            .attr("filter", "url(#glow-more)"); // Optional: a stronger glow filter on hover if defined

        // Highlight connected links and nodes, dimming others
        link.style("opacity", l => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.05) // Dim non-connected links significantly
            .style("stroke-width", l => (l.source.id === d.id || l.target.id === d.id) ? 5 : 3)
            .attr("filter", l => (l.source.id === d.id || l.target.id === d.id) ? "url(#glow)" : "none"); // Ensure glow for connected

        nodeGroup.selectAll(".node-group")
            .style("opacity", nodeD => (isConnected(d, nodeD) || nodeD.id === d.id) ? 1 : 0.2); // Dim non-connected nodes significantly
    })
    .on("mouseout", function() {
        tooltip.classed("hidden", true);

        // Reset styles for hovered node
        d3.select(this).select("path")
            .transition().duration(150)
            .attr("stroke-width", 3)
            .attr("stroke", d => d3.color(colorScale(d.category)).darker(1.2))
            .attr("filter", "url(#glow)");

        // Reset all links and nodes
        link.style("opacity", 1)
            .style("stroke-width", 3)
            .attr("filter", "url(#glow)");
        nodeGroup.selectAll(".node-group").style("opacity", 1);
    })
    // --- 新增的节点点击事件 ---
    .on("click", function(event, d) {
        // 阻止事件冒泡，以免影响其他元素的点击（如果将来有父级点击事件）
        event.stopPropagation();

        // 检查节点数据中是否存在 pdfPath
        if (d.pdfPath) {
            // 如果存在，则在新标签页中打开PDF
            window.open(d.pdfPath, '_blank');
        } else {
            // 如果没有pdfPath，可以在控制台打印一条消息
            console.log(`节点 "${d.name}" 没有关联的PDF文件。`);
        }
    });

    // Helper function to check if two nodes are connected
    function isConnected(a, b) {
        return graphData.links.some(l => (l.source.id === a.id && l.target.id === b.id) || (l.source.id === b.id && l.target.id === a.id));
    }


    // --- Simulation Tick Function ---
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        // Update gradient positions for links
        link.each(function(d, i) {
            // Find the correct gradient ID based on the link's index (which is consistent)
            const gradient = defs.select(`#link-gradient-${i}`);
            if (gradient.node()) { // Check if gradient exists
                gradient.attr("x1", d.source.x)
                        .attr("y1", d.source.y)
                        .attr("x2", d.target.x)
                        .attr("y2", d.target.y);
            }
        });

        node
            .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // --- Drag Handlers ---
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

    // --- Resize handler ---
    window.addEventListener('resize', function() {
        const newWidth = document.getElementById("chart-container").clientWidth;
        const newHeight = document.getElementById("chart-container").clientHeight;

        svg.attr("width", newWidth)
           .attr("height", newHeight);

        simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
        simulation.force("x", d3.forceX().strength(0.06).x(newWidth / 2));
        simulation.force("y", d3.forceY().strength(0.06).y(newHeight / 2));
        simulation.alpha(0.3).restart();
    });
});
