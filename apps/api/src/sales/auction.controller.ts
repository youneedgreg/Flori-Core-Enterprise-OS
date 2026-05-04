/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuctionService } from './auction.service';
import type { CreateAuctionLotDto, AuctionResultDto } from './auction.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('sales/auction')
@UseGuards(JwtAuthGuard)
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) {}

  @Get('lots')
  getAuctionLots(@Req() req: any) {
    return this.auctionService.getAuctionLots(req.user.tenantId);
  }

  @Post('lots')
  createAuctionLot(@Req() req: any, @Body() dto: CreateAuctionLotDto) {
    return this.auctionService.createAuctionLot(req.user.tenantId, dto);
  }

  @Post('import')
  importAuctionResults(
    @Req() req: any,
    @Body() results: { results: AuctionResultDto[] },
  ) {
    return this.auctionService.importAuctionResults(
      req.user.tenantId,
      results.results,
    );
  }
}
