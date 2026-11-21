import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  HasMany,
} from 'sequelize-typescript';

import { Product } from '../products/product.model';

export type CategoryCreationAttributes = {
  id?: number;
  nom: string;
  description?: string;
};

@Table({ tableName: 'categories' })
export class Category extends Model<Category, CategoryCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare nom: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string;

  @HasMany(() => Product)
  declare products: Product[];
}