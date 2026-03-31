import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';

@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get(':model')
  findAll(@Param('model') model: string, @Query() query: any) {
    return this.superAdminService.findAll(model, query);
  }

  @Get(':model/:id')
  findOne(
    @Param('model') model: string,
    @Param('id') id: string,
    @Query() query: any,
  ) {
    return this.superAdminService.findOne(model, id, query);
  }

  @Post(':model')
  create(@Param('model') model: string, @Body() data: any) {
    return this.superAdminService.create(model, data);
  }

  @Patch(':model/:id')
  update(
    @Param('model') model: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.superAdminService.update(model, id, data);
  }

  @Delete(':model/:id')
  remove(@Param('model') model: string, @Param('id') id: string) {
    return this.superAdminService.remove(model, id);
  }
}
