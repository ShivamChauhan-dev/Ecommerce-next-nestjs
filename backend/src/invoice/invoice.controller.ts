import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { InvoiceService } from './invoice.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('invoice')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
    constructor(private readonly invoiceService: InvoiceService) { }

    /**
     * Download PDF invoice
     * GET /invoice/:orderId/download
     */
    @Get(':orderId/download')
    async downloadInvoice(
        @Param('orderId') orderId: string,
        @Res() res: Response,
    ) {
        const buffer = await this.invoiceService.generateInvoice(orderId);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="invoice-${orderId}.pdf"`,
            'Content-Length': buffer.length,
        });

        res.end(buffer);
    }

    /**
     * Get invoice data (JSON)
     * GET /invoice/:orderId
     */
    @Get(':orderId')
    async getInvoiceData(@Param('orderId') orderId: string) {
        return this.invoiceService.getInvoiceData(orderId);
    }
}
