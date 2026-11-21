import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

import { User } from '../users/user.model';
import { Category } from '../categories/category.model';

export type ProductCreationAttributes = {
  id?: number;
  nom: string;
  description: string;
  prix: number;
  stock: number;
  image?: string;
  userId: number;
  categoryId?: number;
};

@Table({
  tableName: 'products',
})
export class Product extends Model<
  Product,
  ProductCreationAttributes
> {
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
    allowNull: false,
  })
  declare description: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare prix: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare stock: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare image: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'user_id',
  })
  declare userId: number;

  @BelongsTo(() => User)
  declare user: User;

  @ForeignKey(() => Category)
@Column({
  type: DataType.INTEGER,
  allowNull: true,
  field: 'category_id',
})
declare categoryId: number;

@BelongsTo(() => Category)
declare category: Category;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;
}