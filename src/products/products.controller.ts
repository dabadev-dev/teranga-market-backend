
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
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { randomUUID } from 'node:crypto';

import cloudinary from '../config/cloudinary.config';

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

const imageUploadOptions = {
  storage: new CloudinaryStorage({
    cloudinary,
    params: async () => ({
      folder: 'teranga-market/products',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      public_id: randomUUID(),
    }),
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

  // Créer un produit avec image Cloudinary
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDEUSE', 'ADMIN')
  @Post()
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() request: any,
  ) {
    const imageUrl = file
      ? (file as Express.Multer.File & { path: string }).path
      : undefined;

    return this.productsService.create(
      {
        ...createProductDto,
        image: imageUrl,
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
    const imageUrl = file
      ? (file as Express.Multer.File & { path: string }).path
      : undefined;

    return this.productsService.update(
      id,
      {
        ...updateProductDto,
        ...(imageUrl ? { image: imageUrl } : {}),
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
