exports.handler = async function(event, context) {
    const user = event.queryStringParameters ? event.queryStringParameters.user : null;

    // 客户名单和到期时间
    const usersConfig = {
        "ruanshiwen": "2026-06-26",
        "fengjuntian": "2027-07-01",
        "weixinhongge": "2027-07-01",
        "huangwenshan": "2027-07-01"
    };

    if (!user || !usersConfig[user]) {
        return {
            statusCode: 403,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
            body: "用户不存在或链接无效"
        };
    }

    const expireDate = new Date(usersConfig[user] + "T23:59:59");
    const now = new Date();

    if (now > expireDate) {
        return {
            statusCode: 403,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
            body: "您的订阅已到期，请联系续费"
        };
    }

    // 实时从cfnew拉取最新节点，去掉ECH参数后转发
    try {
        const upstreamUrl = "https://wakenew.pages.dev/31cd326f-23f5-4d09-a9fd-2016a13480a4/sub";
        
        const response = await fetch(upstreamUrl, {
            headers: {
                "User-Agent": "clash-meta",
                "Accept": "*/*"
            }
        });

        if (!response.ok) {
            throw new Error(`上游返回错误: ${response.status}`);
        }

        const rawContent = await response.text();
        
        // 判断是否是base64编码
        let nodeText = rawContent;
        try {
            const decoded = Buffer.from(rawContent.trim(), 'base64').toString('utf-8');
            // 如果解码后包含vless://或trojan://说明是base64
            if (decoded.includes('vless://') || decoded.includes('trojan://') || decoded.includes('ss://')) {
                nodeText = decoded;
            }
        } catch(e) {
            // 不是base64，直接用原文
        }

        // 去掉ECH参数（兼容NekoBox/安卓TV）
        const cleanedText = nodeText.replace(/&ech=[^&\n#]+/g, '');

        // 重新base64编码返回
        const base64Content = Buffer.from(cleanedText.trim()).toString('base64');

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET"
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
