import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { Category } from './category.model';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
  ) {}

  async create(data: {
    nom: string;
    description?: string;
  }): Promise<Category> {
    return this.categoryModel.create(data);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryModel.findAll({
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryModel.findByPk(id);

    if (!category) {
      throw new NotFoundException(
        'Catégorie introuvable',
      );
    }

    return category;
  }

  async update(
    id: number,
    data: {
      nom?: string;
      description?: string;
    },
  ): Promise<Category> {
    const category = await this.findOne(id);

    await category.update(data);

    return category;
  }

  async remove(id: number) {
    const category = await this.findOne(id);

    await category.destroy();

    return {
      message: 'Catégorie supprimée avec succès',
    };
  }
}