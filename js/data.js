// js/data.js (示例 - 您需要将 pdfPath 添加到相关节点)

const graphData = {
    nodes: [
        // 机器学习 (绿色 - category-1)
        {
            id: "machine_learning",
            name: "机器学习",
            category: 1,
            info: "机器学习是人工智能的一个分支，旨在使计算机能够从数据中学习，而无需明确编程。",
            shape: "circle",
            radius: 25,
            pdfPath: "pdfs/LLM_Beyond jailbreaks.pdf" // 示例：为机器学习节点添加PDF路径
        },
        {
            id: "supervised_learning",
            name: "监督学习",
            category: 1,
            info: "通过标记数据进行训练，学习输入到输出的映射关系。",
            shape: "circle",
            radius: 18
        },
        {
            id: "unsupervised_learning",
            name: "无监督学习",
            category: 1,
            info: "在未标记数据中发现模式和结构。",
            shape: "circle",
            radius: 18
        },
        {
            id: "reinforcement_learning",
            name: "强化学习",
            category: 2,
            info: "智能体通过与环境的交互学习，以最大化累积奖励。",
            shape: "square",
            radius: 22,
            pdfPath: "pdfs/LLM_Beyond jailbreaks.pdf" // 示例：为强化学习节点添加PDF路径
        },

        // 强化学习 (蓝色 - category-2)
        { id: "agent", name: "智能体", category: 2, info: "在环境中执行动作并接收奖励的学习实体。", shape: "square", radius: 16 },
        { id: "environment", name: "环境", category: 2, info: "智能体与之交互的系统，提供状态和奖励。", shape: "square", radius: 16 },
        { id: "reward", name: "奖励", category: 2, info: "评估智能体行为好坏的信号。", shape: "square", radius: 14 },
        { id: "policy", name: "策略", category: 2, info: "智能体在给定状态下选择动作的规则。", shape: "square", radius: 14 },
        { id: "value_function", name: "价值函数", category: 2, info: "评估在特定状态下遵循某种策略能够获得的预期累积奖励。", shape: "square", radius: 15 },

        // 深度学习 (红色 - category-3)
        {
            id: "deep_learning",
            name: "深度学习",
            category: 3,
            info: "机器学习的子集，使用多层神经网络学习复杂模式。",
            shape: "triangle",
            radius: 25,
            pdfPath: "pdfs/LLM_Beyond jailbreaks.pdf" // 示例：为深度学习节点添加PDF路径
        },
        { id: "neural_network", name: "神经网络", category: 3, info: "受生物神经网络启发的计算模型。", shape: "triangle", radius: 18 },
        { id: "cnn", name: "卷积神经网络 (CNN)", category: 3, info: "擅长图像识别和处理。", shape: "triangle", radius: 20 },
        { id: "rnn", name: "循环神经网络 (RNN)", category: 3, info: "擅长序列数据处理，如文本和语音。", shape: "triangle", radius: 18 },
        { id: "transformer", name: "Transformer", category: 3, info: "基于自注意力机制的神经网络架构，广泛应用于NLP。", shape: "triangle", radius: 22 },

        // 自然语言处理 (紫色 - category-4)
        { id: "nlp", name: "自然语言处理 (NLP)", category: 4, info: "使计算机能够理解、解释和生成人类语言的人工智能领域。", shape: "diamond", radius: 22 },
        { id: "text_mining", name: "文本挖掘", category: 4, info: "从非结构化文本数据中提取有用信息。", shape: "diamond", radius: 16 },
        { id: "sentiment_analysis", name: "情感分析", category: 4, info: "识别文本中表达的情绪倾向。", shape: "diamond", radius: 16 },
        { id: "machine_translation", name: "机器翻译", category: 4, info: "将文本从一种语言自动翻译成另一种语言。", shape: "diamond", radius: 16 },

        // 计算机视觉 (黄色 - category-5)
        { id: "computer_vision", name: "计算机视觉", category: 5, info: "使计算机能够理解和解释图像和视频的人工智能领域。", shape: "star", radius: 25 },
        { id: "image_recognition", name: "图像识别", category: 5, info: "识别图像中的对象和特征。", shape: "star", radius: 18 },
        { id: "object_detection", name: "目标检测", category: 5, info: "在图像中定位并识别特定对象。", shape: "star", radius: 18 },
        { id: "segmentation", name: "图像分割", category: 5, info: "将图像划分为多个区域或对象。", shape: "star", radius: 18 }
    ],
    links: [
        // ... 链接数据保持不变 ...
        { source: "machine_learning", target: "supervised_learning" },
        { source: "machine_learning", target: "unsupervised_learning" },
        { source: "machine_learning", target: "reinforcement_learning" },
        { source: "machine_learning", target: "deep_learning" },

        // 强化学习
        { source: "reinforcement_learning", target: "agent" },
        { source: "reinforcement_learning", target: "environment" },
        { source: "reinforcement_learning", target: "reward" },
        { source: "reinforcement_learning", target: "policy" },
        { source: "reinforcement_learning", target: "value_function" },

        // 深度学习
        { source: "deep_learning", target: "neural_network" },
        { source: "deep_learning", target: "cnn" },
        { source: "deep_learning", target: "rnn" },
        { source: "deep_learning", target: "transformer" },
        { source: "neural_network", target: "cnn" },
        { source: "neural_network", target: "rnn" },
        { source: "neural_network", target: "transformer" },

        // 自然语言处理
        { source: "nlp", target: "text_mining" },
        { source: "nlp", target: "sentiment_analysis" },
        { source: "nlp", target: "machine_translation" },
        { source: "deep_learning", target: "nlp" }, // 深度学习与NLP相关
        { source: "transformer", target: "nlp" }, // Transformer与NLP强相关

        // 计算机视觉
        { source: "computer_vision", target: "image_recognition" },
        { source: "computer_vision", target: "object_detection" },
        { source: "computer_vision", target: "segmentation" },
        { source: "deep_learning", target: "computer_vision" }, // 深度学习与计算机视觉相关
        { source: "cnn", target: "computer_vision" } // CNN与计算机视觉强相关
    ]
};
