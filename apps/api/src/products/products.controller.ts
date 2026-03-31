import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProductsService } from './products.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    return this.productsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.productsService.findOne(tenantId, id);
  }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() data: any) {
    const tenantId = req.user.tenantId;
    return this.productsService.create(tenantId, data);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    const tenantId = req.user.tenantId;
    return this.productsService.update(tenantId, id, data);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.productsService.remove(tenantId, id);
  }
}
