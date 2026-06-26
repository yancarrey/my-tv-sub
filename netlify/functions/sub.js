// ============================================================
// 文件：netlify/functions/sub.js
// 功能：单节点返回 + 自动优选 + 设备限制（最多2台）
// ============================================================

const crypto = require('crypto');

// ★ 修改点1：客户名单和到期时间（和你原来一样，不变）
const usersConfig = {
    "ruanshiwen":   "2026-06-26",
    "fengjuntian":  "2027-07-01",
    "weixinhongge": "2027-07-01",
    "huangwenshan": "2027-07-01"
};

// ★ 修改点2：设备限制数量（改这里控制1台还是2台）
const MAX_DEVICES = 2;

// ★ 修改点3：GitHub Gist配置（用来存设备绑定数据）
// 步骤：去 https://gist.github.com 新建一个私有Gist，
// 文件名随意比如 devices.json，内容填 {}
// 然后去 https://github.com/settings/tokens 生成token（勾选gist权限）
// 把gist的ID（URL里那串字母数字）和token填在下面
const GIST_ID    = "你的GIST_ID填这里";       // ← 改这里
const GIST_TOKEN = process.env.GITHUB_TOKEN;   // ← 在Netlify环境变量里设置

// ★ 修改点4：你的上游节点订阅地址（和你原来一样）
const UPSTREAM_URL = "https://wakenew.pages.dev/31cd326f-23f5-4d09-a9fd-2016a13480a4/sub";

// ============================================================
// 生成设备指纹（用IP + User-Agent哈希，不需要用户操作）
// ============================================================
function getDeviceFingerprint(event) {
    const ip = event.headers['x-forwarded-for'] || 
               event.headers['x-nf-client-connection-ip'] || 
               'unknown';
    const ua = event.headers['user-agent'] || 'unknown';
    // 只取IP前两段（同一家庭网络视为同一设备）
    const ipPrefix = ip.split('.').slice(0, 2).join('.');
    const raw = `${ipPrefix}:${ua}`;
    return crypto.createHash('md5').update(raw).digest('hex').slice(0, 16);
}

// ============================================================
// 读取/写入设备绑定数据（存在GitHub Gist）
// ============================================================
async function readDeviceData() {
    try {
        const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
            headers: {
                'Authorization': `token ${GIST_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        const data = await res.json();
        const content = Object.values(data.files)[0].content;
        return JSON.parse(content);
    } catch(e) {
        return {};
    }
}

async function writeDeviceData(deviceData) {
    const content = JSON.stringify(deviceData, null, 2);
    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `token ${GIST_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            files: { "devices.json": { content } }
        })
    });
}

// ============================================================
// ★ 核心：设备限制检查
// 返回 { allowed: true/false, reason: "说明" }
// ============================================================
async function checkDeviceLimit(userId, fingerprint) {
    const deviceData = await readDeviceData();
    
    if (!deviceData[userId]) {
        // 该用户首次使用，初始化
        deviceData[userId] = { devices: [fingerprint] };
        await writeDeviceData(deviceData);
        return { allowed: true };
    }
    
    const userDevices = deviceData[userId].devices || [];
    
    // 已绑定的设备，直接放行
    if (userDevices.includes(fingerprint)) {
        return { allowed: true };
    }
    
    // 新设备，检查数量
    if (userDevices.length >= MAX_DEVICES) {
        // ★ 修改点5：超出设备数的提示语
        return { 
            allowed: false, 
            reason: `此订阅已在${MAX_DEVICES}台设备上使用，无法在新设备上激活` 
        };
    }
    
    // 未超出，绑定新设备
    userDevices.push(fingerprint);
    deviceData[userId].devices = userDevices;
    await writeDeviceData(deviceData);
    return { allowed: true };
}

// ============================================================
// ★ 核心：拉取上游节点并自动优选（只返回1个最快节点）
// ============================================================
async function getBestNode() {
    // 1. 拉取上游订阅
    const response = await fetch(UPSTREAM_URL, {
        headers: { "User-Agent": "clash-meta", "Accept": "*/*" }
    });
    if (!response.ok) throw new Error(`上游错误: ${response.status}`);
    
    const rawContent = await response.text();
    
    // 2. 解码base64
    let nodeText = rawContent;
    try {
        const decoded = Buffer.from(rawContent.trim(), 'base64').toString('utf-8');
        if (decoded.includes('vless://') || decoded.includes('trojan://') || decoded.includes('ss://')) {
            nodeText = decoded;
        }
    } catch(e) {}
    
    // 3. 去掉ECH参数
    const cleanedText = nodeText.replace(/&ech=[^&\n#]+/g, '');
    
    // 4. 解析出所有节点
    const allNodes = cleanedText.split('\n')
        .map(line => line.trim())
        .filter(line => 
            line.startsWith('vless://') || 
            line.startsWith('trojan://') || 
            line.startsWith('ss://')
        );
    
    if (allNodes.length === 0) throw new Error('没有找到有效节点');
    
    // 5. 并发测速（提取每个节点的host和port，TCP握手测延迟）
    const speedResults = await Promise.allSettled(
        allNodes.map(node => testNodeSpeed(node))
    );
    
    // 6. 找出延迟最低的节点
    let bestNode = allNodes[0];  // 默认第一个
    let bestLatency = Infinity;
    
    speedResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value < bestLatency) {
            bestLatency = result.value;
            bestNode = allNodes[index];
        }
    });
    
    return bestNode;
}

// ============================================================
// 节点测速（通过fetch HEAD请求测TCP延迟）
// ============================================================
async function testNodeSpeed(nodeUrl) {
    return new Promise(async (resolve, reject) => {
        // 超时3秒
        const timeout = setTimeout(() => reject(new Error('超时')), 3000);
        
        try {
            // 解析节点地址
            const parsed = parseNodeAddress(nodeUrl);
            if (!parsed) { clearTimeout(timeout); reject(new Error('解析失败')); return; }
            
            const start = Date.now();
            // 用fetch测试节点服务器的可达性
            await fetch(`https://${parsed.host}`, {
                method: 'HEAD',
                signal: AbortSignal.timeout(2500)
            });
            clearTimeout(timeout);
            resolve(Date.now() - start);
        } catch(e) {
            clearTimeout(timeout);
            // fetch失败不代表节点不通（可能是https问题），给一个中等延迟
            resolve(1000 + Math.random() * 500);
        }
    });
}

// ============================================================
// 从节点URL解析host和port
// ============================================================
function parseNodeAddress(nodeUrl) {
    try {
        // vless://uuid@host:port?params#name
        const atIdx = nodeUrl.indexOf('@');
        if (atIdx === -1) return null;
        const rest = nodeUrl.slice(atIdx + 1);
        const questionIdx = rest.indexOf('?');
        const hostPort = questionIdx > -1 ? rest.slice(0, questionIdx) : rest.split('#')[0];
        const lastColon = hostPort.lastIndexOf(':');
        const host = hostPort.slice(0, lastColon);
        const port = parseInt(hostPort.slice(lastColon + 1));
        return { host, port };
    } catch(e) {
        return null;
    }
}

// ============================================================
// 主函数入口
// ============================================================
exports.handler = async function(event, context) {
    const user = event.queryStringParameters?.user;
    
    // 验证用户
    if (!user || !usersConfig[user]) {
        return {
            statusCode: 403,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
            body: "用户不存在或链接无效"
        };
    }
    
    // 验证到期时间
    const expireDate = new Date(usersConfig[user] + "T23:59:59");
    if (new Date() > expireDate) {
        return {
            statusCode: 403,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
            body: "您的订阅已到期，请联系续费"
        };
    }
    
    // ★ 设备限制检查
    const fingerprint = getDeviceFingerprint(event);
    const deviceCheck = await checkDeviceLimit(user, fingerprint);
    if (!deviceCheck.allowed) {
        return {
            statusCode: 403,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
            body: deviceCheck.reason
        };
    }
    
    // 获取最优节点并返回（只返回1个）
    try {
        const bestNode = await getBestNode();
        // 用base64编码单个节点返回（v2rayNG兼容格式）
        const base64Content = Buffer.from(bestNode).toString('base64');
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Access-Control-Allow-Origin": "*"
            },
            body: base64Content
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
            body: `获取节点失败: ${error.message}`
        };
    }
};
