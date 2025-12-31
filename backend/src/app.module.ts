import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { CmsModule } from './cms/cms.module';
import { AuthModule } from './auth/auth.module';
import { UserActionsModule } from './user-actions/user-actions.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { EmailModule } from './email/email.module';
import { CouponsModule } from './coupons/coupons.module';
import { AdminModule } from './admin/admin.module';
import { UploadsModule } from './uploads/uploads.module';
import { ShippingModule } from './shipping/shipping.module';
import { AnalyticsModule } from './analytics/analytics.module';
// Phase 3
import { ReviewsModule } from './reviews/reviews.module';
import { InvoiceModule } from './invoice/invoice.module';
import { TrackingModule } from './tracking/tracking.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
// Phase 4
import { NotificationsModule } from './notifications/notifications.module';
import { TaxModule } from './tax/tax.module';
import { RecentlyViewedModule } from './recently-viewed/recently-viewed.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate Limiting: 100 requests per minute globally
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute in milliseconds
      limit: 100, // 100 requests
    }]),
    ProductsModule,
    CmsModule,
    AuthModule,
    UserActionsModule,
    OrdersModule,
    PaymentsModule,
    EmailModule,
    CouponsModule,
    AdminModule,
    UploadsModule,
    ShippingModule,
    AnalyticsModule,
    // Phase 3
    ReviewsModule,
    InvoiceModule,
    TrackingModule,
    RecommendationsModule,
    // Phase 4
    NotificationsModule,
    TaxModule,
    RecentlyViewedModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global rate limit guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
