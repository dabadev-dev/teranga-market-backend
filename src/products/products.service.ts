import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';

import { Product } from './product.model';
import { Category } from '../categories/category.model';
import { User } from '../users/user.model';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product)
    private readonly productModel: typeof Product,

    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  /*Vérifie que l'utilisateur peut gérer des produits.*/
  private async checkSellerPermission(
    userId: number,
    role: string,
  ): Promise<void> {
    // L'administrateur peut toujours gérer les produits
    if (role === 'ADMIN') {
      return;
    }

    // Seule une vendeuse peut gérer ses produits
    if (role !== 'VENDEUSE') {
      throw new ForbiddenException(
        'Seules les vendeuses peuvent gérer des produits',
      );
    }

    const user = await this.userModel.findByPk(userId);

    if (!user) {
      throw new NotFoundException(
        'Utilisateur introuvable',
      );
    }

    // Une vendeuse doit être approuvée par l'administrateur
    if (user.statut !== 'APPROUVEE') {
      throw new ForbiddenException(
        'Votre compte vendeuse doit être approuvé par un administrateur avant de pouvoir vendre',
      );
    }
  }

  async create(
    createProductDto: CreateProductDto,
    userId: number,
    role: string,
  ): Promise<Product> {
    await this.checkSellerPermission(userId, role);

    return this.productModel.create({
      ...createProductDto,
      userId,
    });
  }

  async findAll(): Promise<Product[]> {
    return this.productModel.findAll({
      include: [Category],
      order: [['created_at', 'DESC']],
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productModel.findByPk(id, {
      include: [Category],
    });

    if (!product) {
      throw new NotFoundException(
        'Produit introuvable',
      );
    }

    return product;
  }

  async findMine(
  userId: number,
  role: string,
): Promise<Product[]> {
  await this.checkSellerPermission(userId, role);

  return this.productModel.findAll({
    where: { userId },
    include: [Category],
    order: [['created_at', 'DESC']],
  });
}

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    userId: number,
    role: string,
  ): Promise<Product> {
    const product = await this.findOne(id);

    await this.checkSellerPermission(userId, role);

    if (
      role !== 'ADMIN' &&
      product.userId !== userId
    ) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres produits',
      );
    }

    await product.update(updateProductDto);

    return product;
  }

  async remove(
    id: number,
    userId: number,
    role: string,
  ) {
    const product = await this.findOne(id);

    await this.checkSellerPermission(userId, role);

    if (
      role !== 'ADMIN' &&
      product.userId !== userId
    ) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres produits',
      );
    }

    await product.destroy();

    return {
      message: 'Produit supprimé avec succès',
    };
  }
}