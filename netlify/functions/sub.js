const crypto = require('crypto');

const usersConfig = {
    "ruanshiwen":   "2026-06-26",
    "fengjuntian":  "2027-07-01",
    "weixinhongge": "2027-07-01",
    "huangwenshan": "2027-07-01",
    "alan":         "2027-07-01",
    "yedeqiang":    "2027-07-01"
};

const UPSTREAM_URL = "https://wakenew.pages.dev/31cd326f-23f5-4d09-a9fd-2016a13480a4/sub";

// ★ 套壳Worker域名
const WORKER_DOMAIN = "vpn-proxy.yancarrey.workers.dev";

// 到期检查
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
        .digest('hex')
        .slice(0, 16);
}

// 读Gist
async function readGist() {
    const gistId = process.env.GIST_ID;
    const token  = process.env.GITHUB_TOKEN;
    if (!gistId || !token) return {};
    try {
        const res = await fetch(`https://api.github.com/gists/${gistId}`, {
            headers: {
                'Authorization': `token ${token}`,
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
    const gistId = process.env.GIST_ID;
    const token  = process.env.GITHUB_TOKEN;
    if (!gistId || !token) return;
    await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `token ${token}`,
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

// 设备限制（最多2台）
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
        return { ok: false, msg: '此订阅已在2台设备激活，无法继续使用' };
    }
    devices.push(fingerprint);
    data[userId].devices = devices;
    await writeGist(data);
    return { ok: true };
}

// ★ 拉取节点并套壳（把host换成Worker域名）
async function getProxiedNode(userId) {
    const res = await fetch(UPSTREAM_URL, {
        headers: { 'User-Agent': 'clash-meta', 'Accept': '*/*' }
    });
    if (!res.ok) throw new Error(`上游错误: ${res.status}`);

    const raw = await res.text();
    let nodeText = raw;
    try {
        const decoded = Buffer.from(raw.trim(), 'base64').toString('utf-8');
        if (decoded.includes('vless://') || decoded.includes('trojan://')) {
            nodeText = decoded;
        }
    } catch(e) {}

    // 去ECH
    const cleaned = nodeText.replace(/&ech=[^&\n#]+/g, '');

    // 取所有节点
    const nodes = cleaned.split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('vless://') ||
                     l.startsWith('trojan://') ||
                     l.startsWith('ss://'));

    if (nodes.length === 0) throw new Error('无有效节点');

    // 随机选一个
    const node = nodes[Math.floor(Math.random() * nodes.length)];

    // 提取真实host和port
    const atIdx = node.indexOf('@');
    const afterAt = node.slice(atIdx + 1);
    const qIdx = afterAt.search(/[?#]/);
    const hostPort = qIdx > -1 ? afterAt.slice(0, qIdx) : afterAt;
    const lastColon = hostPort.lastIndexOf(':');
    const realHost = hostPort.slice(0, lastColon);
    const realPort = hostPort.slice(lastColon + 1) || '443';

    // ★ 把host换成Worker域名，参数里带上真实host供转发
    let proxied = node.slice(0, atIdx + 1) +
        `${WORKER_DOMAIN}:443` +
        afterAt.slice(qIdx);

    // 注入转发参数
    if (proxied.includes('?')) {
        proxied = proxied.replace('?', `?u=${userId}&h=${realHost}&p=${realPort}&`);
    } else {
        proxied = proxied.replace(/#/, `?u=${userId}&h=${realHost}&p=${realPort}#`);
    }

    // 节点名字改成干净的名字，用户看不到原始信息
    proxied = proxied.replace(/#[^#]*$/, '#专属节点');

    return proxied;
}

// 主入口
exports.handler = async function(event) {
    const user = event.queryStringParameters?.user;

    // 用户检查
    if (!user || !usersConfig[user]) {
        return {
            statusCode: 403,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: '用户不存在'
        };
    }

    // 到期检查
    if (isExpired(user)) {
        return {
            statusCode: 403,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'profile-update-interval': '1'
            },
            body: '订阅已到期，请联系续费'
        };
    }

    // 设备限制
    const fp = getFingerprint(event);
    const deviceCheck = await checkDevice(user, fp);
    if (!deviceCheck.ok) {
        return {
            statusCode: 403,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: deviceCheck.msg
        };
    }

    // 返回套壳节点
    try {
        const proxied = await getProxiedNode(user);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'profile-update-interval': '1'
            },
            body: Buffer.from(proxied).toString('base64')
        };
    } catch(e) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: `错误: ${e.message}`
        };
    }
};
