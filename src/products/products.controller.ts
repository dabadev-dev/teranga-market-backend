
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// Créer automatiquement le dossier uploads s'il n'existe pas
const uploadDirectory = join(process.cwd(), 'uploads');
mkdirSync(uploadDirectory, { recursive: true });

const imageUploadOptions = {
  storage: diskStorage({
    destination: uploadDirectory,
    filename: (_req, file, callback) => {
      const extension = extname(file.originalname).toLowerCase();
      callback(null, `${randomUUID()}${extension}`);
    },
  }),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (
    _req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
      return callback(
        new Error('Format d’image non autorisé. Utilise JPG, PNG ou WEBP.'),
        false,
      );
    }

    callback(null, true);
  },
};

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Créer un produit avec image
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDEUSE', 'ADMIN')
  @Post()
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() request: any,
  ) {
    return this.productsService.create(
      {
        ...createProductDto,
        image: file ? `/uploads/${file.filename}` : undefined,
      },
      request.user.id,
      request.user.role,
    );
  }

  // Récupérer tous les produits
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // Récupérer les produits de la vendeuse
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDEUSE', 'ADMIN')
  @Get('mine')
  async findMine(@Request() req: any) {
    return this.productsService.findMine(req.user.id, req.user.role);
  }

  // Récupérer un produit par ID
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  // Modifier un produit
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDEUSE', 'ADMIN')
  @Put(':id')
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() request: any,
  ) {
    return this.productsService.update(
      id,
      {
        ...updateProductDto,
        ...(file ? { image: `/uploads/${file.filename}` } : {}),
      },
      request.user.id,
      request.user.role,
    );
  }

  // Supprimer un produit
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDEUSE', 'ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() request: any) {
    return this.productsService.remove(
      id,
      request.user.id,
      request.user.role,
    );
  }
}
