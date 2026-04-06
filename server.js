const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const SERVER_CHAN_SENDKEY = process.env.SERVER_CHAN_SENDKEY || '';

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'food.html'));
});

app.post('/api/order', async (req, res) => {
    try {
        const { items, total, time, message } = req.body;
        
        console.log('收到新订单！');
        console.log('订单内容:', message);
        console.log('订单时间:', time);
        
        if (SERVER_CHAN_SENDKEY) {
            await sendWechatNotification(message, time);
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
        
        await axios.post(
            `https://sctapi.ftqq.com/${SERVER_CHAN_SENDKEY}.send`,
            new URLSearchParams({ title, desp }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        
        console.log('微信通知发送成功');
        return true;
    } catch (error) {
        console.error('发送微信通知失败:', error.message);
        return false;
    }
}

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: '服务运行中' });
});

app.listen(PORT, () => {
    console.log(`🚀 服务已启动: http://localhost:${PORT}`);
});

module.exports = app;
