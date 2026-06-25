exports.handler = async function(event, context) {
    // 获取链接里的用户名参数，比如 ?user=zhangsan
    const user = event.queryStringParameters ? event.queryStringParameters.user : null;

    // 客户名单和到期时间 (年-月-日)
    const usersConfig = {
        "ruanshiwen": "2026-06-26",
        "fengjuntian": "2027-07-01",
        "weixinhongge": "2027-07-01",
        "huangwenshan": "2027-07-01"
    };

    // 如果用户名不存在
    if (!user || !usersConfig[user]) {
        return {
            statusCode: 403,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
            body: "用户不存在或链接无效"
        };
    }

    // 检查是否过期
    const expireDate = new Date(usersConfig[user] + "T23:59:59");
    const now = new Date();

    if (now > expireDate) {
        return {
            statusCode: 403,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
            body: "您的订阅已到期，请联系续费"
        };
    }

    // 已去除ECH参数，兼容NekoBox/安卓TV盒子
    const rawNodes = `vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@wakenew.pages.dev:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E5%8E%9F%E7%94%9F%E5%9C%B0%E5%9D%80-443-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@wakenew.pages.dev:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E5%8E%9F%E7%94%9F%E5%9C%B0%E5%9D%80-443-Trojan-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@wakenew.pages.dev:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=xhttp&host=wakenew.pages.dev&path=%2F31cd326f&mode=stream-one#%E5%8E%9F%E7%94%9F%E5%9C%B0%E5%9D%80-443-xhttp
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.16.242.69:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%A7%BB%E5%8A%A8-HKG-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.19.43.138:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%A7%BB%E5%8A%A8-HKG-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.136.123:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%A7%BB%E5%8A%A8-SJC-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.131.243:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%A7%BB%E5%8A%A8-SJC-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.117.97:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%A7%BB%E5%8A%A8-HKG-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.14.89:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E8%81%94%E9%80%9A-LAX-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.129.109:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E8%81%94%E9%80%9A-SJC-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.131.66:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E8%81%94%E9%80%9A-SJC-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.18.63:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E8%81%94%E9%80%9A-LAX-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.129.221:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E8%81%94%E9%80%9A-SJC-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.48.183:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%94%B5%E4%BF%A1-SIN-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.21.97:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%94%B5%E4%BF%A1-SIN-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.3.65:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%94%B5%E4%BF%A1-SIN-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.14.100:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%94%B5%E4%BF%A1-SIN-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.21.202:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%94%B5%E4%BF%A1-SIN-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@[2606:4700:90c0::b398:b337]:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%A7%BB%E5%8A%A8-HKG-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@[2606:4700:9a65::f923:1033]:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%A7%BB%E5%8A%A8-HKG-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@[2606:4700:91b5::22e:33d5]:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%A7%BB%E5%8A%A8-HKG-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@[2606:4700:57::6ea1:ab5e]:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%A7%BB%E5%8A%A8-HKG-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@[2606:4700:9642::2a58:547e]:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%A7%BB%E5%8A%A8-HKG-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@[2803:f800:50::554d:49c]:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%94%B5%E4%BF%A1-SIN-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@[2606:4700:4405::a082:ca8]:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%94%B5%E4%BF%A1-SIN-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@[2606:4700:4409::d2c1:20d1]:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%94%B5%E4%BF%A1-SIN-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@[2606:4700:5c::2d22:9418]:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%94%B5%E4%BF%A1-SIN-443-WS-TLS
vless://31cd326f-23f5-4d09-a9fd-2016a13480a4@[2606:4700:4400::30b:4045]:443?encryption=none&security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%94%B5%E4%BF%A1-SIN-443-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.16.242.69:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%A7%BB%E5%8A%A8-HKG-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.19.43.138:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%A7%BB%E5%8A%A8-HKG-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.136.123:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%A7%BB%E5%8A%A8-SJC-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.131.243:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%A7%BB%E5%8A%A8-SJC-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.117.97:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E7%A7%BB%E5%8A%A8-HKG-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.14.89:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E8%81%94%E9%80%9A-LAX-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.129.109:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E8%81%94%E9%80%9A-SJC-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@104.17.131.66:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E8%81%94%E9%80%9A-SJC-443-Trojan-WS-TLS
trojan://31cd326f-23f5-4d09-a9fd-2016a13480a4@162.159.18.63:443?security=tls&sni=wakenew.pages.dev&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&insecure=0&allowInsecure=0&type=ws&host=wakenew.pages.dev&path=%2F%3Fed%3D2048#%E8%81%94%E9%80%9A-LAX-443-Trojan-WS-TLS`;

    const base64Content = Buffer.from(rawNodes.trim()).toString('base64');

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET"
        },
        body: base64Content
    };
};
