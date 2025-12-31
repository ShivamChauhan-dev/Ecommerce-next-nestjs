import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get<string>('SMTP_PORT') || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  private async sendEmail(options: EmailOptions) {
    const from = this.configService.get<string>('SMTP_FROM') || 'Anvogue <noreply@anvogue.com>';

    try {
      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email send failed:', error);
      return { success: false, error };
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(email: string, data: OrderEmailData) {
    const itemsHtml = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
        </tr>
      `,
      )
      .join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed! 🎉</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333;">Hi ${data.customerName},</p>
          <p style="font-size: 16px; color: #666;">Thank you for your order! We've received your order and will notify you when it ships.</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">Order Number</p>
            <p style="margin: 5px 0 0; font-size: 20px; font-weight: bold; color: #333;">${data.orderNumber}</p>
          </div>
          
          <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Order Details</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: left;">Item</th>
                <th style="padding: 12px; text-align: center;">Qty</th>
                <th style="padding: 12px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #eee;">
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
              <span style="color: #666;">Subtotal:</span>
              <span style="color: #333;">₹${data.subtotal.toFixed(2)}</span>
            </div>
            ${data.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
              <span style="color: #28a745;">Discount:</span>
              <span style="color: #28a745;">-₹${data.discount.toFixed(2)}</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
              <span style="color: #666;">Shipping:</span>
              <span style="color: #333;">₹${data.shippingCost.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 15px 0 0; padding-top: 15px; border-top: 2px solid #667eea; font-size: 18px; font-weight: bold;">
              <span style="color: #333;">Total:</span>
              <span style="color: #667eea;">₹${data.total.toFixed(2)}</span>
            </div>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #666;">Need help? Contact us at support@anvogue.com</p>
          </div>
        </div>
        
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} Anvogue. All rights reserved.
        </p>
      </div>
    </body>
    </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Order Confirmed - ${data.orderNumber}`,
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string, resetToken: string, userName: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333;">Hi ${userName},</p>
          <p style="font-size: 16px; color: #666;">We received a request to reset your password. Click the button below to create a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          
          <p style="font-size: 14px; color: #999;">This link will expire in 1 hour.</p>
          <p style="font-size: 14px; color: #999;">If you didn't request this, you can safely ignore this email.</p>
          
          <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; font-size: 12px; color: #666;">If the button doesn't work, copy and paste this link:</p>
            <p style="margin: 5px 0 0; font-size: 12px; color: #667eea; word-break: break-all;">${resetLink}</p>
          </div>
        </div>
        
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} Anvogue. All rights reserved.
        </p>
      </div>
    </body>
    </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - Anvogue',
      html,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcome(email: string, userName: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Anvogue! 🎉</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333;">Hi ${userName},</p>
          <p style="font-size: 16px; color: #666;">Welcome to Anvogue! We're excited to have you on board.</p>
          <p style="font-size: 16px; color: #666;">Start exploring our amazing collection and enjoy exclusive deals just for you.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">Start Shopping</a>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #666;">Need help? Contact us at support@anvogue.com</p>
          </div>
        </div>
        
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} Anvogue. All rights reserved.
        </p>
      </div>
    </body>
    </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Anvogue! 🎉',
      html,
    });
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdate(email: string, orderNumber: string, status: string, trackingNumber?: string) {
    const statusMessages: Record<string, { title: string; message: string }> = {
      confirmed: {
        title: 'Order Confirmed ✅',
        message: 'Your order has been confirmed and is being processed.',
      },
      processing: {
        title: 'Order Processing 📦',
        message: 'Your order is being prepared for shipping.',
      },
      shipped: {
        title: 'Order Shipped 🚚',
        message: 'Your order has been shipped and is on its way!',
      },
      delivered: {
        title: 'Order Delivered 🎉',
        message: 'Your order has been delivered. Enjoy your purchase!',
      },
      cancelled: {
        title: 'Order Cancelled ❌',
        message: 'Your order has been cancelled. If you have any questions, please contact support.',
      },
    };

    const statusInfo = statusMessages[status] || { title: 'Order Update', message: `Your order status: ${status}` };

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${statusInfo.title}</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px; color: #666;">Order Number</p>
            <p style="margin: 5px 0 0; font-size: 20px; font-weight: bold; color: #333;">${orderNumber}</p>
          </div>
          
          <p style="font-size: 16px; color: #666;">${statusInfo.message}</p>
          
          ${trackingNumber ? `
          <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #1976d2;">Tracking Number</p>
            <p style="margin: 5px 0 0; font-size: 16px; font-weight: bold; color: #0d47a1;">${trackingNumber}</p>
          </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #666;">Need help? Contact us at support@anvogue.com</p>
          </div>
        </div>
        
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} Anvogue. All rights reserved.
        </p>
      </div>
    </body>
    </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `${statusInfo.title} - ${orderNumber}`,
      html,
    });
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(email: string, userName: string, verifyUrl: string) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email 📧</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333;">Hi ${userName},</p>
          <p style="font-size: 16px; color: #666;">Please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">Verify Email</a>
          </div>
          
          <p style="font-size: 14px; color: #999;">This link will expire in 24 hours.</p>
          <p style="font-size: 14px; color: #999;">If you didn't create an account, you can safely ignore this email.</p>
          
          <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; font-size: 12px; color: #666;">If the button doesn't work, copy and paste this link:</p>
            <p style="margin: 5px 0 0; font-size: 12px; color: #667eea; word-break: break-all;">${verifyUrl}</p>
          </div>
        </div>
        
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} Anvogue. All rights reserved.
        </p>
      </div>
    </body>
    </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - Anvogue',
      html,
    });
  }
}

