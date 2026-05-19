const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate Limiting (Prevent spam)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Email Transporter Configuration (Use your email)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'silatrix22@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Contact Form API Endpoint
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        // Email to admin
        const mailOptions = {
            from: `"Sila Tech Contact" <${process.env.EMAIL_USER || 'silatrix22@gmail.com'}>`,
            to: process.env.ADMIN_EMAIL || 'silatrix22@gmail.com',
            replyTo: email,
            subject: `New Contact: ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0066ff;">New Contact Form Submission</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <p><strong>Message:</strong></p>
                    <p style="background: #f4f4f4; padding: 15px; border-radius: 5px;">${message.replace(/\n/g, '<br>')}</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">Sent from Sila Tech Website</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        // Auto-reply to user
        const autoReplyOptions = {
            from: `"Sila Tech Team" <${process.env.EMAIL_USER || 'your-email@gmail.com'}>`,
            to: email,
            subject: 'Thank you for contacting Sila Tech!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0066ff;">Hello ${name},</h2>
                    <p>Thank you for reaching out to Sila Tech!</p>
                    <p>We have received your message regarding <strong>"${subject}"</strong> and will get back to you within 24 hours.</p>
                    <br>
                    <p>Best regards,<br><strong>Sila Tech Team</strong></p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">© 2026 Sila Tech - Cybersecurity & Innovation</p>
                </div>
            `
        };

        await transporter.sendMail(autoReplyOptions);

        res.status(200).json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: 'Failed to send message. Please try again later.' });
    }
});

// WhatsApp Bot API Endpoint (Example)
app.post('/api/whatsapp/send', async (req, res) => {
    const { number, message } = req.body;
    
    // Integration with WhatsApp Business API or Baileys library
    // This is a placeholder - you'll need to implement actual WhatsApp integration
    
    res.json({ success: true, message: 'WhatsApp message queued' });
});

// Security Scan Endpoint (Example)
app.post('/api/security/scan', async (req, res) => {
    const { url } = req.body;
    
    // Implement vulnerability scanning logic here
    // For now, return mock data
    
    res.json({
        status: 'completed',
        vulnerabilities: [],
        score: 95,
        recommendations: ['Update SSL certificate', 'Enable 2FA']
    });
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files (if you want to serve HTML from server)
app.use(express.static('public'));

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Sila Tech Server running on port ${PORT}`);
    console.log(`📧 Email service: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured - using demo mode'}`);
    console.log(`🌐 Visit: http://localhost:${PORT}`);
});
