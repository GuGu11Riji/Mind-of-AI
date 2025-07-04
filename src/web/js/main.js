// main.js
// 应用程序的主逻辑

console.log("main.js: Script started.");

// 导入图谱渲染函数 (保持不变)
import { renderKnowledgeGraph } from './graph.js'; 

document.addEventListener('DOMContentLoaded', () => {
    console.log("main.js: DOMContentLoaded event fired.");

    const svgElement = document.getElementById('knowledge-graph');
    if (!svgElement) {
        console.error("main.js: Error: SVG element 'knowledge-graph' not found!");
        return;
    }
    console.log("main.js: SVG element found.", svgElement);

    const tooltipContainer = document.getElementById('tooltip');
    if (!tooltipContainer) {
        console.error("main.js: Error: Tooltip container 'tooltip' not found!");
    }
    console.log("main.js: Tooltip container found (or not).", tooltipContainer);

    const tooltipTitle = document.getElementById('tooltip-title');
    const tooltipFilename = document.getElementById('tooltip-filename');
    const tooltipAbstract = document.getElementById('tooltip-abstract');
    const tooltipKeywords = document.getElementById('tooltip-keywords');
    const tooltipLink = document.getElementById('tooltip-link');

    const tooltipElements = {
        container: tooltipContainer,
        title: tooltipTitle,
        filename: tooltipFilename,
        abstract: tooltipAbstract,
        keywords: tooltipKeywords,
        link: tooltipLink
    };

    console.log("main.js: Attempting to fetch data from '../../data/processed_data.json'");

    // **D3 图谱配置**
    const d3Config = {
        nodeBaseRadius: 15, // 节点基础半径
        nodeHighlightRadiusIncrease: 5, // 节点高亮时半径增加量
        nodeStrokeWidth: 2.5, // 节点边框粗细
        nodeHighlightStrokeWidth: 4, // 节点高亮时边框粗细

        linkDistance: 120, // 链接默认长度
        linkStrength: 0.7, // 链接强度 (0-1)
        linkOpacity: 0.7, // 链接默认透明度
        linkHighlightOpacity: 1, // 链接高亮时透明度
        linkStrokeWidth: 2, // 链接默认粗细
        linkHighlightStrokeWidth: 4, // 链接高亮时粗细

        chargeStrength: -400, // 节点斥力，负值表示斥力
        centerStrength: 0.05, // 节点向中心聚集的强度
        collidePadding: 8, // 碰撞检测的额外填充，防止重叠
        alphaDecay: 0.02, // 模拟冷却速度，越小模拟时间越长越稳定
        velocityDecay: 0.4, // 速度衰减，防止粒子一直运动

        // 节点颜色映射 (根据你的需求定制)
        nodeColors: {
            "ML": "#4CAF50",      // 绿色 - 机器学习
            "RL": "#3F51B5",      // 蓝色 - 强化学习 (原先的蓝色可能偏亮，这里使用 Material Design indigo)
            "DL": "#F44336",      // 红色 - 深度学习 (Material Design red)
            "concept": "#9C27B0", // 紫色 - 概念 (Material Design purple)
            "Uncategorized": "#9E9E9E" // 灰色 - 未分类
        }
    };
    console.log("main.js: D3 config defined:", d3Config);


    fetch('../../data/processed_data.json')
        .then(response => {
            console.log("main.js: Fetch response received. Status:", response.status);
            if (!response.ok) {
                const errorMsg = `HTTP error! status: ${response.status} for ${response.url}`;
                console.error("main.js: " + errorMsg);
                throw new Error(errorMsg);
            }
            return response.json();
        })
        .then(data => {
            console.log("main.js: Data successfully parsed:", data);

            if (!data || !data.graph || !data.documents) {
                console.error("main.js: Data structure invalid. Missing 'graph' or 'documents'.", data);
                alert("加载知识图谱数据失败：数据结构不正确。");
                return;
            }

            const documentsMap = new Map(data.documents.map(doc => [doc.id, doc]));
            console.log("main.js: Documents Map created.", documentsMap);

            if (!data.graph.nodes || data.graph.nodes.length === 0) {
                console.warn("main.js: No nodes found in graph data. Graph will be empty.");
            } else {
                console.log("main.js: Nodes found:", data.graph.nodes.length);
            }
            
            if (!data.graph.links || data.graph.links.length === 0) {
                console.warn("main.js: No links found in graph data.");
            } else {
                console.log("main.js: Links found:", data.graph.links.length);
            }

            console.log("main.js: Calling renderKnowledgeGraph function.");
            // **将 d3Config 传递给 renderKnowledgeGraph**
            renderKnowledgeGraph(data.graph, svgElement, tooltipElements, documentsMap, d3Config);
            console.log("main.js: renderKnowledgeGraph function called.");

            // 填充 PDF 列表 (这部分逻辑从 index.html 移动到这里，因为它依赖于 processed_data.json)
            const pdfListElement = document.getElementById('pdf-list');
            if (pdfListElement) {
                pdfListElement.innerHTML = '';
                data.documents.forEach(doc => {
                    const listItem = document.createElement('li');
                    const linkElement = document.createElement('a');
                    // **修正 PDF 列表链接路径：从 index.html 出发，正确的路径是 ./data/pdfs/文件名.pdf**
                    linkElement.href = `./data/pdfs/${doc.filename}`; 
                    linkElement.target = "_blank";
                    linkElement.textContent = doc.title;
                    linkElement.title = doc.filename;
                    linkElement.dataset.nodeId = doc.id;

                    linkElement.addEventListener('click', (event) => {
                        console.log(`点击了 PDF 列表项: ${doc.title}`);
                        event.preventDefault(); // 阻止默认的链接跳转

                        // 实际打开PDF
                        if (doc.filename) {
                            window.open(`./data/pdfs/${doc.filename}`, '_blank'); // 再次确认路径
                        } else {
                            console.warn(`文档 "${doc.title}" 没有关联的PDF文件名。`);
                        }
                    });

                    listItem.appendChild(linkElement);
                    pdfListElement.appendChild(listItem);
                });
                console.log("PDF 列表填充完成，并添加了点击事件。");
            } else {
                console.warn("main.js: PDF list element 'pdf-list' not found.");
            }
        })
        .catch(error => {
            console.error("main.js: Error loading knowledge graph data or during rendering:", error);
            alert("加载知识图谱数据失败，请检查 'data/processed_data.json' 文件是否存在且格式正确。\n错误详情请查看浏览器控制台。");
        });
});
