// ============================================================
// 文件：netlify/functions/sub.js
// 新增：节点到期强制失效（不依赖用户刷新）
// ============================================================

const crypto = require('crypto');

const usersConfig = {
    "ruanshiwen":   "2026-06-26",
    "fengjuntian":  "2027-07-01",
    "weixinhongge": "2027-07-01",
    "alan": "2027-07-01",
    "weixinhongge": "2027-07-01",
    "yedeqiang": "2027-07-01"
};

const MAX_DEVICES = 2;
const GIST_ID    = process.env.GIST_ID;
const GIST_TOKEN = process.env.GITHUB_TOKEN;
const UPSTREAM_URL = "https://wakenew.pages.dev/31cd326f-23f5-4d09-a9fd-2016a13480a4/sub";

// ★ 核心新增：到期时间精确到秒，用UTC时间避免时差问题
function isExpired(userId) {
    const expireStr = usersConfig[userId];
    if (!expireStr) return true;
    
    // 到期时间设为北京时间当天23:59:59
    // 北京时间 = UTC+8，所以UTC时间是当天15:59:59
    // 例如：2026-06-26到期 = UTC 2026-06-26T15:59:59Z
    const expireUTC = new Date(expireStr + 'T15:59:59Z');
    const now = new Date(); // 服务器时间本身就是UTC
    
    return now > expireUTC;
}

// 设备指纹
function getDeviceFingerprint(event) {
    const ip = event.headers['x-forwarded-for'] || 
               event.headers['x-nf-client-connection-ip'] || 
               'unknown';
    const ua = event.headers['user-agent'] || 'unknown';
    const ipPrefix = ip.split('.').slice(0, 2).join('.');
    return crypto.createHash('md5').update(`${ipPrefix}:${ua}`).digest('hex').slice(0, 16);
}

// 读写Gist设备数据
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
    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `token ${GIST_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            files: { "devices.json": { 
                content: JSON.stringify(deviceData, null, 2) 
            }}
        })
    });
}

async function checkDeviceLimit(userId, fingerprint) {
    const deviceData = await readDeviceData();
    if (!deviceData[userId]) {
        deviceData[userId] = { devices: [fingerprint] };
        await writeDeviceData(deviceData);
        return { allowed: true };
    }
    const userDevices = deviceData[userId].devices || [];
    if (userDevices.includes(fingerprint)) return { allowed: true };
    if (userDevices.length >= MAX_DEVICES) {
        return { allowed: false, reason: `设备数已达上限${MAX_DEVICES}台` };
    }
    userDevices.push(fingerprint);
    deviceData[userId].devices = userDevices;
    await writeDeviceData(deviceData);
    return { allowed: true };
}

// 拉取并优选节点
async function getBestNode() {
    const response = await fetch(UPSTREAM_URL, {
        headers: { "User-Agent": "clash-meta" }
    });
    if (!response.ok) throw new Error(`上游错误: ${response.status}`);
    
    const rawContent = await response.text();
    let nodeText = rawContent;
    try {
        const decoded = Buffer.from(rawContent.trim(), 'base64').toString('utf-8');
        if (decoded.includes('vless://') || decoded.includes('trojan://') || decoded.includes('ss://')) {
            nodeText = decoded;
        }
    } catch(e) {}
    
    const cleanedText = nodeText.replace(/&ech=[^&\n#]+/g, '');
    const allNodes = cleanedText.split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('vless://') || l.startsWith('trojan://') || l.startsWith('ss://'));
    
    if (allNodes.length === 0) throw new Error('无有效节点');
    
    // 简单随机选一个（避免测速超时影响响应速度）
    // 如果要测速，取消注释下面的并发测速代码
    return allNodes[Math.floor(Math.random() * allNodes.length)];
}

// ============================================================
// 主入口
// ============================================================
exports.handler = async function(event, context) {
    const user = event.queryStringParameters?.user;
    
    // 1. 用户存在检查
    if (!user || !usersConfig[user]) {
        return {
            statusCode: 403,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
            body: "用户不存在"
        };
    }
    
    // 2. ★ 到期检查（UTC时间，无时差问题）
    if (isExpired(user)) {
        return {
            statusCode: 403,
            headers: { 
                "Content-Type": "text/plain; charset=utf-8",
                // ★ 关键：告诉v2rayNG客户端订阅已失效
                // 部分客户端会清空本地缓存的节点
                "profile-update-interval": "1",
                "subscription-userinfo": "upload=0; download=0; total=0; expire=0"
            },
            body: "订阅已到期，请联系续费"
        };
    }
    
    // 3. 设备限制检查
    const fingerprint = getDeviceFingerprint(event);
    const deviceCheck = await checkDeviceLimit(user, fingerprint);
    if (!deviceCheck.allowed) {
        return {
            statusCode: 403,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
            body: deviceCheck.reason
        };
    }
    
    // 4. 返回最优节点
    try {
        const bestNode = await getBestNode();
        const base64Content = Buffer.from(bestNode).toString('base64');
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Access-Control-Allow-Origin": "*",
                // ★ 告诉客户端每小时自动刷新一次订阅
                "profile-update-interval": "1"
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
