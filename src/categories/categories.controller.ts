import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { CategoriesService } from './categories.service';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
  ) {}

  // ADMIN uniquement
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(
    @Body()
    data: {
      nom: string;
      description?: string;
    },
  ) {
    return this.categoriesService.create(data);
  }

  // Public
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  // Public
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriesService.findOne(id);
  }

  // ADMIN uniquement
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    data: {
      nom?: string;
      description?: string;
    },
  ) {
    return this.categoriesService.update(id, data);
  }

  // ADMIN uniquement
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriesService.remove(id);
  }
}