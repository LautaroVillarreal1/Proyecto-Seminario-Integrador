import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ReportsService } from './reports.service';

@Controller('informes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1, 2)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}
  @Get('resumen') summary(@Query('desde') desde?: string, @Query('hasta') hasta?: string) { return this.reports.summary(desde, hasta); }
}