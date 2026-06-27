exports.handler = async function(event) {
    const user = event.queryStringParameters
        ? event.queryStringParameters.user
        : null;

    const usersConfig = {
        "ruanshiwen":   "2026-06-29",
        "fengjuntian":  "2027-07-01",
        "weixinhongge": "2027-07-01",
        "huangwenshan": "2027-07-01",
        "alan":         "2027-07-01",
        "yanzhisheng":  "2027-07-01",
        "yedeqiang":    "2027-07-01"
    };

    if (!user || !usersConfig[user]) {
        return {
            statusCode: 403,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
            body: "用户不存在或链接无效"
        };
    }

    const expireUTC = new Date(usersConfig[user] + 'T15:59:59Z');
    if (new Date() > expireUTC) {
        return {
            statusCode: 403,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
            body: "您的订阅已到期，请联系续费"
        };
    }

    const rawNodes = [
"vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@wakenew.pages.dev:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#原生-WS-TLS",
"trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@wakenew.pages.dev:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#原生-Trojan-TLS",
"vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.16.242.69:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#移动-HKG-1",
"vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.19.43.138:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#移动-HKG-2",
"vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.136.123:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#移动-SJC-1",
"vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.131.243:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#移动-SJC-2",
"vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.117.97:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#移动-HKG-3",
"vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.14.89:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#联通-LAX-1",
"vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.129.109:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#联通-SJC-1",
"vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.131.66:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#联通-SJC-2",
"vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.18.63:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#联通-LAX-2",
"vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.129.221:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#联通-SJC-3",
"vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.48.183:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#电信-SIN-1",
"vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.21.97:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#电信-SIN-2",
"vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.3.65:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#电信-SIN-3",
"vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.14.100:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#电信-SIN-4",
"vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.21.202:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#电信-SIN-5",
"trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.16.242.69:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#移动-HKG-T1",
"trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.19.43.138:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#移动-HKG-T2",
"trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.136.123:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#移动-SJC-T1",
"trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.131.243:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#移动-SJC-T2",
"trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.117.97:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#移动-HKG-T3",
"trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.14.89:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#联通-LAX-T1",
"trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.129.109:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#联通-SJC-T1",
"trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.131.66:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#联通-SJC-T2",
"trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.18.63:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#联通-LAX-T2",
"trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.129.221:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#联通-SJC-T3",
"trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.48.183:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#电信-SIN-T1",
"trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.21.97:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#电信-SIN-T2",
"trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.3.65:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#电信-SIN-T3",
"trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.14.100:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#电信-SIN-T4",
"trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.21.202:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#电信-SIN-T5"
    ].join('\n');

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "profile-update-interval": "1"
        },
        body: Buffer.from(rawNodes).toString('base64')
    };
};
