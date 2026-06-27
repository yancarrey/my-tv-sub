// 在getBestNode()函数里，拿到真实节点后，替换其中的host地址

async function getBestNode(userId) {
    // 拉取并解析真实节点（和之前一样）
    const response = await fetch(UPSTREAM_URL, {
        headers: { "User-Agent": "clash-meta" }
    });
    const rawContent = await response.text();
    let nodeText = rawContent;
    try {
        const decoded = Buffer.from(rawContent.trim(), 'base64').toString('utf-8');
        if (decoded.includes('vless://') || decoded.includes('trojan://')) {
            nodeText = decoded;
        }
    } catch(e) {}
    
    const cleanedText = nodeText.replace(/&ech=[^&\n#]+/g, '');
    const allNodes = cleanedText.split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('vless://') || l.startsWith('trojan://') || l.startsWith('ss://'));
    
    if (allNodes.length === 0) throw new Error('无有效节点');
    
    // 随机选一个真实节点
    const realNode = allNodes[Math.floor(Math.random() * allNodes.length)];
    
    // ★★★ 关键步骤：把节点里的host替换成你的Worker域名
    // Worker域名格式：vpn-gate.你的子域名.workers.dev
    const workerDomain = 'vpn-gate.你的账号名.workers.dev';
    
    // 替换节点中的host部分，保留其他所有参数
    // 原始：vless://uuid@real-server.com:443?params#name
    // 替换：vless://uuid@vpn-gate.workers.dev:443?params&user=ruanshiwen#name
    const modifiedNode = realNode
        .replace(/@([^:]+):/, `@${workerDomain}:`)
        .replace(/#/, `&user=${userId}#`);
    
    return modifiedNode;
}
