
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

import { Order } from './order.model';
import { User } from '../users/user.model';
import { OrderItem } from './order-item.model';

export type SellerOrderCreationAttributes = {
  id?: number;
  total: number;
  statut?: string;
  orderId: number;
  sellerId: number;
};

@Table({
  tableName: 'seller_orders',
})
export class SellerOrder extends Model<
  SellerOrder,
  SellerOrderCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare total: number;

  @Column({
    type: DataType.ENUM(
      'EN_ATTENTE',
      'CONFIRMEE',
      'EXPEDIEE',
      'LIVREE',
      'ANNULEE',
    ),
    allowNull: false,
    defaultValue: 'EN_ATTENTE',
  })
  declare statut: string;

  @ForeignKey(() => Order)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'order_id',
  })
  declare orderId: number;

  @BelongsTo(() => Order)
  declare order: Order;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'seller_id',
  })
  declare sellerId: number;

  @BelongsTo(() => User)
  declare seller: User;

  @HasMany(() => OrderItem)
  declare items: OrderItem[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
