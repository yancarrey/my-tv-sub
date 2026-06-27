const crypto = require('crypto');

// ★ 用户名单（注意：huangwenshan补回来了，weixinhongge去掉重复）
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

// ============================================================
// 到期检查（北京时间当天23:59:59 = UTC 15:59:59）
// ============================================================
function isExpired(userId) {
    if (!usersConfig[userId]) return true;
    const expireUTC = new Date(usersConfig[userId] + 'T15:59:59Z');
    return new Date() > expireUTC;
}

// ============================================================
// 设备指纹
// ============================================================
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

// ============================================================
// 读Gist
// ============================================================
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
    } catch(e) {
        return {};
    }
}

// ============================================================
// 写Gist
// ============================================================
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
            files: {
                "devices.json": {
                    content: JSON.stringify(deviceData, null, 2)
                }
            }
        })
    });
}

// ============================================================
// 设备限制（最多2台）
// ============================================================
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

// ============================================================
// 拉取真实节点（原来能用的逻辑，完全保留）
// ============================================================
async function getRealNode() {
    const response = await fetch(UPSTREAM_URL, {
        headers: {
            "User-Agent": "clash-meta",
            "Accept": "*/*"
        }
    });
    if (!response.ok) throw new Error(`上游错误: ${response.status}`);

    const rawContent = await response.text();
    let nodeText = rawContent;
    try {
        const decoded = Buffer.from(rawContent.trim(), 'base64').toString('utf-8');
        if (
            decoded.includes('vless://') ||
            decoded.includes('trojan://') ||
            decoded.includes('ss://')
        ) {
            nodeText = decoded;
        }
    } catch(e) {}

    // 去掉ECH参数（安卓TV兼容）
    const cleaned = nodeText.replace(/&ech=[^&\n#]+/g, '');

    // 解析所有节点
    const nodes = cleaned.split('\n')
        .map(l => l.trim())
        .filter(l =>
            l.startsWith('vless://') ||
            l.startsWith('trojan://') ||
            l.startsWith('ss://')
        );

    if (nodes.length === 0) throw new Error('无有效节点');

    // 随机返回一个节点（只返回1个，用户看不到其他节点）
    return nodes[Math.floor(Math.random() * nodes.length)];
}

// ============================================================
// 生成假节点（到期用户专用，连接必然失败）
// ★ 关键：用户刷新后拿到假节点，无法翻墙
// 用户不刷新 = 用本地缓存 = 还能用（无法避免）
// 用户刷新或开机自动刷新 = 拿到假节点 = 立刻失效
// ============================================================
function getFakeNode(userId) {
    const fakeUUID = crypto.createHash('md5')
        .update(userId + 'fake')
        .digest('hex')
        .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
    // 指向一个必然超时的地址
    return `vless://${fakeUUID}@192.0.2.1:443?encryption=none&security=tls&type=ws&path=%2F#订阅已到期`;
}

// ============================================================
// 主入口
// ============================================================
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
        // 返回假节点（200状态码让v2rayNG接受）
        // 假节点连接超时，用户无法翻墙
        // 节点名字显示"订阅已到期"提醒用户
        const fakeNode = getFakeNode(user);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'profile-update-interval': '1'
            },
            body: Buffer.from(fakeNode).toString('base64')
        };
    }

    // 3. 设备限制（需要GIST_ID和GITHUB_TOKEN环境变量）
    // 如果没有配置Gist，跳过设备限制直接返回节点
    if (GIST_ID && GIST_TOKEN) {
        const fp = getFingerprint(event);
        const check = await checkDevice(user, fp);
        if (!check.ok) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                body: check.msg
            };
        }
    }

    // 4. ★ 返回真实节点（未到期用户，正常可用）
    try {
        const node = await getRealNode();
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'profile-update-interval': '1'
            },
            body: Buffer.from(node).toString('base64')
        };
    } catch(e) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: `错误: ${e.message}`
        };
    }
};
