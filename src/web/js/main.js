// main.js
// 应用程序的主逻辑

// 先直接在这里加一个log，看脚本是否开始执行
console.log("main.js: Script started.");

import { renderKnowledgeGraph } from './graph.js'; // 导入图谱渲染函数

document.addEventListener('DOMContentLoaded', () => {
    console.log("main.js: DOMContentLoaded event fired.");

    const svgElement = document.getElementById('knowledge-graph');
    // 检查 SVG 元素是否被正确获取
    if (!svgElement) {
        console.error("main.js: Error: SVG element 'knowledge-graph' not found!");
        return; // 如果SVG元素不存在，停止执行
    }
    console.log("main.js: SVG element found.", svgElement);


    const tooltipContainer = document.getElementById('tooltip');
    if (!tooltipContainer) {
        console.error("main.js: Error: Tooltip container 'tooltip' not found!");
        // 不return，因为tooltip不是图谱渲染的必要条件，但会影响交互
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

    console.log("main.js: Attempting to fetch data from '../data/processed_data.json'");

    // 加载processed_data.json数据
    fetch('../data/processed_data.json')
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

            // 检查 data.graph 和 data.documents 是否存在
            if (!data || !data.graph || !data.documents) {
                console.error("main.js: Data structure invalid. Missing 'graph' or 'documents'.", data);
                alert("加载知识图谱数据失败：数据结构不正确。");
                return;
            }

            // 将documents数组转换为Map，方便根据id查找
            const documentsMap = new Map(data.documents.map(doc => [doc.id, doc]));
            console.log("main.js: Documents Map created.", documentsMap);

            // 检查 nodes 和 links 是否非空
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
            // 渲染知识图谱
            renderKnowledgeGraph(data.graph, svgElement, tooltipElements, documentsMap);
            console.log("main.js: renderKnowledgeGraph function called.");
        })
        .catch(error => {
            console.error("main.js: Error loading knowledge graph data or during rendering:", error);
            alert("加载知识图谱数据失败，请检查 'data/processed_data.json' 文件是否存在且格式正确。\n错误详情请查看浏览器控制台。");
        });
});

