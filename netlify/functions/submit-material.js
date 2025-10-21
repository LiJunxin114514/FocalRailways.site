// netlify/functions/submit-material.js
const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  console.log('函数开始执行', new Date().toISOString());

  // 设置 CORS 头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // 处理预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // 只处理 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Method Not Allowed'
      })
    };
  }

  try {
    console.log('解析请求体...');

    // 解析表单数据
    let formData;
    try {
      formData = JSON.parse(event.body);
      console.log('表单数据解析成功:', Object.keys(formData));
    } catch (parseError) {
      console.error('JSON解析错误:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: '无效的JSON数据'
        })
      };
    }

    const {
      materialTitle,
      materialDescription,
      materialType,
      contactInfo,
      agreeTerms
    } = formData;

    // 验证必填字段
    if (!materialTitle || !materialDescription || !materialType || !contactInfo || !agreeTerms) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: '所有字段都是必填的'
        })
      };
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactInfo)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: '请输入有效的邮箱地址'
        })
      };
    }

    console.log('环境变量检查...');
    // 检查环境变量
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('环境变量未设置');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: '服务器配置错误：环境变量未设置'
        })
      };
    }

    console.log('创建邮件传输器...');
    // 使用 Nodemailer 发送邮件
    const transporter = nodemailer.createTransport({
      host: 'smtp.qq.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // 验证传输器配置
    try {
      await transporter.verify();
      console.log('SMTP连接验证成功');
    } catch (verifyError) {
      console.error('SMTP连接失败:', verifyError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: '邮件服务器连接失败，请检查邮箱配置'
        })
      };
    }

    console.log('准备邮件内容...');
    // 构建邮件内容
    const mailOptions = {
      from: `"FocalRailways素材提交" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `FocalRailways - 新素材提交: ${materialTitle}`,
      replyTo: contactInfo,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Microsoft YaHei', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
                .header { background: linear-gradient(135deg, #2196F3, #1565C0); color: white; padding: 20px; text-align: center; }
                .content { padding: 25px; }
                .field { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee; }
                .field-label { font-weight: bold; color: #333; margin-bottom: 5px; display: flex; align-items: center; }
                .field-value { color: #666; padding-left: 25px; }
                .icon { margin-right: 8px; font-size: 16px; }
                .footer { background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
                .important { background: #fff3e0; padding: 10px; border-radius: 5px; border-left: 4px solid #ff9800; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚆 FocalRailways - 新素材提交</h1>
                    <p>您收到一个新的铁路素材提交</p>
                </div>
                <div class="content">
                    <div class="important">
                        <strong>💡 提示：</strong> 请及时审核此素材并联系提交者
                    </div>
                    <div class="field">
                        <div class="field-label"><span class="icon">📌</span> 素材标题</div>
                        <div class="field-value">${materialTitle}</div>
                    </div>
                    <div class="field">
                        <div class="field-label"><span class="icon">📝</span> 素材描述</div>
                        <div class="field-value">${materialDescription.replace(/\n/g, '<br>')}</div>
                    </div>
                    <div class="field">
                        <div class="field-label"><span class="icon">🔖</span> 素材类型</div>
                        <div class="field-value">${materialType}</div>
                    </div>
                    <div class="field">
                        <div class="field-label"><span class="icon">📧</span> 联系方式</div>
                        <div class="field-value">${contactInfo}</div>
                    </div>
                    <div class="field">
                        <div class="field-label"><span class="icon">✅</span> 同意协议</div>
                        <div class="field-value">${agreeTerms ? '是' : '否'}</div>
                    </div>
                    <div class="field">
                        <div class="field-label"><span class="icon">🕒</span> 提交时间</div>
                        <div class="field-value">${new Date().toLocaleString('zh-CN')}</div>
                    </div>
                </div>
                <div class="footer">
                    <p>此邮件由 FocalRailways 网站自动发送</p>
                    <p>请勿直接回复此邮件，如需联系提交者请回复至: ${contactInfo}</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    console.log('发送邮件...');
    // 发送邮件
    const info = await transporter.sendMail(mailOptions);
    console.log('邮件发送成功:', info.messageId);

    // 返回成功响应
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: '素材提交成功！我们将在3-7个工作日内审核并联系您。',
        emailId: info.messageId
      })
    };

  } catch (error) {
    console.error('处理表单提交时出错:', error);

    let errorMessage = '服务器错误，请稍后重试或直接发送邮件到 2247028586@qq.com';

    if (error.code === 'EAUTH') {
      errorMessage = '邮件认证失败，请检查邮箱账号和授权码';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = '无法连接到邮件服务器';
    } else if (error.message.includes('Invalid login')) {
      errorMessage = '邮箱登录失败，请检查邮箱账号和授权码是否正确';
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: errorMessage
      })
    };
  }
};