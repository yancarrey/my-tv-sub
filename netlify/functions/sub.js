const crypto = require('crypto');

const usersConfig = {
    "ruanshiwen":   "2026-06-26",
    "fengjuntian":  "2027-07-01",
    "weixinhongge": "2027-07-01",
    "huangwenshan": "2027-07-01",
    "alan":         "2027-07-01",
    "yedeqiang":    "2027-07-01"
};

const GIST_ID    = process.env.GIST_ID;
const GIST_TOKEN = process.env.GITHUB_TOKEN;
const UPSTREAM_URL = "https://wakenew.pages.dev/31cd326f-23f5-4d09-a9fd-2016a13480a4/sub";

// 到期检查（北京时间当天23:59:59失效）
function isExpired(userId) {
    if (!usersConfig[userId]) return true;
    const expireUTC = new Date(usersConfig[userId] + 'T15:59:59Z');
    return new Date() > expireUTC;
}

// 设备指纹
function getFingerprint(event) {
    const ip = (
        event.headers['x-forwarded-for'] ||
        event.headers['x-nf-client-connection-ip'] ||
        'unknown'
    ).split(',')[0].trim();
    const ua = event.headers['user-agent'] || 'unknown';
    const ipPrefix = ip.split('.').slice(0, 2).join('.');
    return crypto.createHash('md5')
        .update(`${ipPrefix}:${ua}`)
        .digest('hex').slice(0, 16);
}

// 读Gist
async function readGist() {
    if (!GIST_ID || !GIST_TOKEN) return {};
    try {
        const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
            headers: {
                'Authorization': `token ${GIST_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'netlify-fn'
            }
        });
        const data = await res.json();
        const content = Object.values(data.files)[0].content;
        return JSON.parse(content);
    } catch(e) { return {}; }
}

// 写Gist
async function writeGist(deviceData) {
    if (!GIST_ID || !GIST_TOKEN) return;
    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `token ${GIST_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'netlify-fn'
        },
        body: JSON.stringify({
            files: { "devices.json": {
                content: JSON.stringify(deviceData, null, 2)
            }}
        })
    });
}

// 设备限制
async function checkDevice(userId, fingerprint) {
    const data = await readGist();
    if (!data[userId]) {
        data[userId] = { devices: [fingerprint] };
        await writeGist(data);
        return { ok: true };
    }
    const devices = data[userId].devices || [];
    if (devices.includes(fingerprint)) return { ok: true };
    if (devices.length >= 2) {
        return { ok: false, msg: '设备数已达上限，请联系管理员' };
    }
    devices.push(fingerprint);
    data[userId].devices = devices;
    await writeGist(data);
    return { ok: true };
}

// 拉取真实节点（保持原来能用的逻辑不变）
async function getRealNode() {
    const response = await fetch(UPSTREAM_URL, {
        headers: { "User-Agent": "clash-meta", "Accept": "*/*" }
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

    // 去ECH参数
    const cleaned = nodeText.replace(/&ech=[^&\n#]+/g, '');

    // 取所有节点
    const nodes = cleaned.split('\n')
        .map(l => l.trim())
        .filter(l =>
            l.startsWith('vless://') ||
            l.startsWith('trojan://') ||
            l.startsWith('ss://')
        );

    if (nodes.length === 0) throw new Error('无有效节点');

    // 随机选一个真实节点返回
    return nodes[Math.floor(Math.random() * nodes.length)];
}

// ★ 生成一个假节点（到期用户看到这个，能ping但无法翻墙）
function getFakeNode(userId) {
    // 用一个真实存在但拒绝连接的地址
    // 用户v2rayNG显示"连接失败"，不会显示到期提示
    // 这样用户以为是网络问题，不知道是你控制的
    const fakeUUID = crypto.createHash('md5').update(userId).digest('hex')
        .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
    return `vless://${fakeUUID}@1.1.1.1:443?encryption=none&security=tls&type=ws&path=%2F#已过期`;
}

// 主入口
exports.handler = async function(event) {
    const user = event.queryStringParameters?.user;

    // 1. 用户检查
    if (!user || !usersConfig[user]) {
        return {
            statusCode: 403,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: '用户不存在'
        };
    }

    // 2. ★ 到期检查
    if (isExpired(user)) {
        // 返回假节点而不是403
        // 这样v2rayNG不会报错，但连不上网
        // 用户下次刷新订阅还是假节点，直到续费
        const fakeNode = getFakeNode(user);
        const encoded = Buffer.from(fakeNode).toString('base64');
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'profile-update-interval': '1'
            },
            body: encoded
        };
    }

    // 3. 设备限制
    const fp = getFingerprint(event);
    const check = await checkDevice(user, fp);
    if (!check.ok) {
        return {
            statusCode: 403,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: check.msg
        };
    }

    // 4. 返回真实节点
    try {
        const node = await getRealNode();
        const encoded = Buffer.from(node).toString('base64');
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'profile-update-interval': '1'
            },
            body: encoded
        };
    } catch(e) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: `错误: ${e.message}`
        };
    }
};
