import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// pdfmake is loaded dynamically in generateInvoice method

@Injectable()
export class InvoiceService {
    private printer: any;

    constructor(private prisma: PrismaService) {
        // Define fonts
        const fonts = {
            Roboto: {
                normal: 'node_modules/pdfmake/build/vfs_fonts.js',
                bold: 'node_modules/pdfmake/build/vfs_fonts.js',
                italics: 'node_modules/pdfmake/build/vfs_fonts.js',
                bolditalics: 'node_modules/pdfmake/build/vfs_fonts.js',
            },
        };
    }

    /**
     * Generate PDF invoice for an order
     */
    async generateInvoice(orderId: string): Promise<Buffer> {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const items = order.items as any[];
        const shippingAddress = order.shippingAddress as any;

        // Build document definition
        const docDefinition: any = {
            content: [
                // Header
                { text: 'INVOICE', style: 'header' },
                { text: `Order #${order.orderNumber}`, style: 'subheader' },
                { text: `Date: ${new Date(order.createdAt).toLocaleDateString()}`, margin: [0, 0, 0, 20] },

                // Billing Info
                {
                    columns: [
                        {
                            width: '*',
                            text: [
                                { text: 'Bill To:\n', bold: true },
                                order.user ? `${order.user.firstName} ${order.user.lastName}\n` : 'Guest\n',
                                order.user?.email || '',
                            ],
                        },
                        {
                            width: '*',
                            text: [
                                { text: 'Ship To:\n', bold: true },
                                shippingAddress?.name || 'N/A',
                                '\n',
                                shippingAddress?.street || '',
                                '\n',
                                `${shippingAddress?.city || ''}, ${shippingAddress?.state || ''} ${shippingAddress?.zip || ''}`,
                            ],
                        },
                    ],
                    margin: [0, 0, 0, 20],
                },

                // Items Table
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 60, 80, 80],
                        body: [
                            [
                                { text: 'Item', bold: true },
                                { text: 'Qty', bold: true, alignment: 'center' },
                                { text: 'Price', bold: true, alignment: 'right' },
                                { text: 'Total', bold: true, alignment: 'right' },
                            ],
                            ...items.map((item) => [
                                item.name || 'Product',
                                { text: item.quantity?.toString() || '1', alignment: 'center' },
                                { text: `₹${(item.price || 0).toFixed(2)}`, alignment: 'right' },
                                { text: `₹${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`, alignment: 'right' },
                            ]),
                        ],
                    },
                    margin: [0, 0, 0, 20],
                },

                // Totals
                {
                    columns: [
                        { width: '*', text: '' },
                        {
                            width: 200,
                            table: {
                                widths: ['*', 80],
                                body: [
                                    ['Subtotal:', { text: `₹${order.subtotal.toFixed(2)}`, alignment: 'right' }],
                                    ['Discount:', { text: `-₹${order.discount.toFixed(2)}`, alignment: 'right' }],
                                    ['Shipping:', { text: `₹${order.shippingCost.toFixed(2)}`, alignment: 'right' }],
                                    ['Tax:', { text: `₹${order.tax.toFixed(2)}`, alignment: 'right' }],
                                    [
                                        { text: 'Total:', bold: true, fontSize: 14 },
                                        { text: `₹${order.total.toFixed(2)}`, alignment: 'right', bold: true, fontSize: 14 },
                                    ],
                                ],
                            },
                            layout: 'noBorders',
                        },
                    ],
                },

                // Payment Status
                {
                    text: `\nPayment Status: ${order.paymentStatus.toUpperCase()}`,
                    style: order.paymentStatus === 'paid' ? 'paid' : 'unpaid',
                    margin: [0, 20, 0, 0],
                },

                // Footer
                {
                    text: 'Thank you for your order!',
                    style: 'footer',
                    margin: [0, 40, 0, 0],
                },
            ],
            styles: {
                header: {
                    fontSize: 24,
                    bold: true,
                    margin: [0, 0, 0, 10],
                },
                subheader: {
                    fontSize: 14,
                    bold: true,
                    color: '#666',
                },
                paid: {
                    color: 'green',
                    bold: true,
                },
                unpaid: {
                    color: 'red',
                    bold: true,
                },
                footer: {
                    fontSize: 12,
                    italics: true,
                    color: '#666',
                    alignment: 'center',
                },
            },
            defaultStyle: {
                fontSize: 10,
            },
        };

        // Generate PDF using simple approach
        const pdfMake = require('pdfmake/build/pdfmake');
        const pdfFonts = require('pdfmake/build/vfs_fonts');
        pdfMake.vfs = pdfFonts.pdfMake.vfs;

        return new Promise((resolve, reject) => {
            const pdfDoc = pdfMake.createPdf(docDefinition);
            pdfDoc.getBuffer((buffer: Buffer) => {
                resolve(buffer);
            });
        });
    }

    /**
     * Get invoice data (for preview or custom rendering)
     */
    async getInvoiceData(orderId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return {
            order,
            items: order.items as any[],
            shippingAddress: order.shippingAddress as any,
            generatedAt: new Date().toISOString(),
        };
    }
}
