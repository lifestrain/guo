const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Server酱配置 - 用于微信推送通知
// 获取方式：访问 https://sct.ftqq.com/ 注册并获取 SendKey
const SERVER_CHAN_SENDKEY = process.env.SERVER_CHAN_SENDKEY || '您的Server酱SendKey';

// 主页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'food.html'));
});

// 接收订单API
app.post('/api/order', async (req, res) => {
    try {
        const { items, total, time, message } = req.body;
        
        console.log('收到新订单！');
        console.log('订单内容:', message);
        console.log('订单时间:', time);
        
        // 通过Server酱发送微信通知
        if (SERVER_CHAN_SENDKEY && SERVER_CHAN_SENDKEY !== '您的Server酱SendKey') {
            await sendWechatNotification(message, time);
        } else {
            console.log('未配置Server酱，跳过推送通知');
        }
        
        res.json({ 
            success: true, 
            message: '订单已提交',
            orderId: Date.now()
        });
    } catch (error) {
        console.error('处理订单失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '服务器错误' 
        });
    }
});

// 发送微信通知函数
async function sendWechatNotification(orderMessage, time) {
    try {
        const title = '🎉 收到新订单啦！';
        const desp = `
## 小猫厨房新订单

**订单内容：** ${orderMessage}

**下单时间：** ${time}

**订单数量：** ${orderMessage.split('、').length} 项

---
💕 快去看看吧！
        `.trim();
        
        const response = await axios.post(
            `https://sctapi.ftqq.com/${SERVER_CHAN_SENDKEY}.send`,
            new URLSearchParams({
                title: title,
                desp: desp
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        console.log('微信通知发送成功:', response.data);
        return true;
    } catch (error) {
        console.error('发送微信通知失败:', error.message);
        return false;
    }
}

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: '服务运行中' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`\n🚀 小猫厨房服务已启动！`);
    console.log(`📱 本地访问: http://localhost:${PORT}`);
    console.log(`\n💡 使用说明:`);
    console.log(`1. 获取Server酱SendKey: https://sct.ftqq.com/`);
    console.log(`2. 设置环境变量: SERVER_CHAN_SENDKEY=你的SendKey`);
    console.log(`3. 启动服务: node server.js`);
    console.log(`4. 将链接发给女朋友使用\n`);
});
