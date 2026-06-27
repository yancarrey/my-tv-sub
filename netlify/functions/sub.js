const crypto = require('crypto');

const usersConfig = {
    "ruanshiwen":   "2026-06-29",
    "fengjuntian":  "2027-07-01",
    "weixinhongge": "2027-07-01",
    "huangwenshan": "2027-07-01",
    "alan":         "2027-07-01",
    "yanzhisheng":  "2027-07-01",
    "yedeqiang":    "2027-07-01"
};

// 每个用户最多几台设备
const MAX_DEVICES = 2;

const GIST_ID    = process.env.GIST_ID;
const GIST_TOKEN = process.env.GITHUB_TOKEN;

// 到期检查
function isExpired(userId) {
    if (!usersConfig[userId]) return true;
    const expireUTC = new Date(usersConfig[userId] + 'T15:59:59Z');
    return new Date() > expireUTC;
}

// 设备指纹（IP前两段 + UserAgent）
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

// 读GIST
async function readGist() {
    if (!GIST_ID || !GIST_TOKEN) return null;
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
        return null;
    }
}

// 写GIST
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

// 设备限制检查
async function checkDevice(userId, fingerprint) {
    const data = await readGist();

    // GIST没配置，跳过设备限制
    if (data === null) return { ok: true, msg: 'gist未配置，跳过设备限制' };

    if (!data[userId]) {
        data[userId] = { devices: [fingerprint] };
        await writeGist(data);
        return { ok: true };
    }

    const devices = data[userId].devices || [];

    // 已绑定设备，直接放行
    if (devices.includes(fingerprint)) return { ok: true };

    // 超出设备数量
    if (devices.length >= MAX_DEVICES) {
        return {
            ok: false,
            msg: `此订阅已在${MAX_DEVICES}台设备上激活，请联系管理员`
        };
    }

    // 新设备，记录后放行
    devices.push(fingerprint);
    data[userId].devices = devices;
    await writeGist(data);
    return { ok: true };
}

// 全部节点内容
function getNodes() {
    return `vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@wakenew.pages.dev:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#原生地址-443-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@wakenew.pages.dev:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#原生地址-443-Trojan-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@wakenew.pages.dev:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=xhttp&host=wakenew.pages.dev&path=%2F31cd326f&mode=stream-one#原生地址-443-xhttp
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.16.242.69:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#移动-HKG-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.19.43.138:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#移动-HKG-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.136.123:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#移动-SJC-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.131.243:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#移动-SJC-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.117.97:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#移动-HKG-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.14.89:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#联通-LAX-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.129.109:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#联通-SJC-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.131.66:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#联通-SJC-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.18.63:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#联通-LAX-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.129.221:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#联通-SJC-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.48.183:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#电信-SIN-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.21.97:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#电信-SIN-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.3.65:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#电信-SIN-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.14.100:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#电信-SIN-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.21.202:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#电信-SIN-443-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.16.242.69:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#移动-HKG-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.19.43.138:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#移动-HKG-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.136.123:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#移动-SJC-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.131.243:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#移动-SJC-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.117.97:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#移动-HKG-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.14.89:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#联通-LAX-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.129.109:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#联通-SJC-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.131.66:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#联通-SJC-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.18.63:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#联通-LAX-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.129.221:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#联通-SJC-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.48.183:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#电信-SIN-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.21.97:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#电信-SIN-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.3.65:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#电信-SIN-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.14.100:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#电信-SIN-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.21.202:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#电信-SIN-443-Trojan-WS-TLS`;
}

// 主入口
exports.handler = async function(event) {
    const user = event.queryStringParameters?.user;

    // 用户检查
    if (!user || !usersConfig[user]) {
        return {
            statusCode: 403,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: '用户不存在或链接无效'
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
            body: '您的订阅已到期，请联系续费'
        };
    }

    // 设备限制（配置了GIST才执行）
    const fp = getFingerprint(event);
    const check = await checkDevice(user, fp);
    if (!check.ok) {
        return {
            statusCode: 403,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: check.msg
        };
    }

    // 返回全部节点
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'profile-update-interval': '1'
        },
        body: Buffer.from(getNodes().trim()).toString('base64')
    };
};
