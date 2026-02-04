import { Module, Global } from '@nestjs/common';
import { LoggingService } from './logging.service';

/**
 * Global logging module untuk PortfolioHub
 * Menyediakan logging service untuk seluruh aplikasi
 */
@Global()
@Module({
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LoggingModule {}
