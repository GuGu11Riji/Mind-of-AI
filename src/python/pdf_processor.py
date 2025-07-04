import pdfplumber
import json
import os
import re

# 定义PDFs目录和输出JSON文件的路径
PDFS_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'pdfs')
OUTPUT_JSON_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'processed_data.json')

def extract_metadata_from_pdf(filepath):
    """
    从PDF文件中提取元数据（标题、文本内容）。
    这是一个简化版本，后续可以根据需求增加摘要、关键词等提取。
    """
    title = os.path.basename(filepath) # 默认使用文件名作为标题
    full_text = ""
    try:
        with pdfplumber.open(filepath) as pdf:
            # 尝试从PDF元数据中获取标题
            if pdf.metadata and '/Title' in pdf.metadata:
                title = pdf.metadata['/Title'].strip()
            
            for page in pdf.pages:
                full_text += page.extract_text() or "" # 提取页面文本
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return None, None
    return title, full_text

def clean_text(text):
    """
    简单清洗文本，移除多余的空白符等。
    """
    if text is None:
        return ""
    text = re.sub(r'\s+', ' ', text).strip() # 替换多个空白符为单个空格
    return text

def build_knowledge_graph_data(pdf_files):
    """
    构建知识图谱所需的数据结构。
    初期：每个PDF是一个文档节点。
    """
    documents = []
    nodes = []
    links = []

    doc_id_counter = 0

    for pdf_file in pdf_files:
        filepath = os.path.join(PDFS_DIR, pdf_file)
        title, full_text = extract_metadata_from_pdf(filepath)

        if title is None: # 跳过处理失败的PDF
            continue

        doc_id = f"doc_{doc_id_counter:03d}"
        doc_id_counter += 1

        # 构建文档元数据
        documents.append({
            "id": doc_id,
            "filename": pdf_file,
            "title": title,
            "abstract": clean_text(full_text[:500]) + "..." if full_text else "暂无摘要", # 提取前500字符作为摘要
            "keywords": ["机器学习", "强化学习"] if "machine_learning" in pdf_file.lower() or "reinforcement_learning" in pdf_file.lower() else ["知识图谱", "AI"], # 示例关键词
            "path": f"../data/pdfs/{pdf_file}" # 相对于index.html的路径
        })

        # 构建图谱节点
        nodes.append({
            "id": doc_id,
            "label": title,
            "type": "document"
        })

    # 简单的连接逻辑：所有文档节点相互连接 (这只是一个占位符，未来会更智能)
    # 也可以实现更智能的链接，比如基于关键词相似度
    # 例如，如果两个文档的关键词有重叠，则创建一条边
    for i in range(len(nodes)):
        for j in range(i + 1, len(nodes)):
            # 这里可以添加更复杂的逻辑来判断是否连接
            # 例如：基于文档内容相似度，或者文件名关键词重叠等
            # 为了简化，我们暂时不添加文档间链接，保持图谱更稀疏和可读
            # links.append({"source": nodes[i]["id"], "target": nodes[j]["id"], "type": "相关"})
            pass # 暂时不创建文档间的随机链接，让图谱更清晰

    # 最终的数据结构
    graph_data = {
        "documents": documents,
        "graph": {
            "nodes": nodes,
            "links": links
        }
    }
    return graph_data

def main():
    """主函数，用于执行PDF处理和数据生成。"""
    pdf_files = [f for f in os.listdir(PDFS_DIR) if f.endswith('.pdf')]
    if not pdf_files:
        print(f"No PDF files found in {PDFS_DIR}. Please place your PDFs there.")
        return

    print(f"Found {len(pdf_files)} PDF files. Processing...")
    knowledge_graph_data = build_knowledge_graph_data(pdf_files)

    with open(OUTPUT_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(knowledge_graph_data, f, ensure_ascii=False, indent=4)
    
    print(f"Knowledge graph data successfully generated at {OUTPUT_JSON_PATH}")

if __name__ == "__main__":
    main()

