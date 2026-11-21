import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { Order } from './order.model';
import { Product } from '../products/product.model';
import { SellerOrder } from './seller-order.model';

export type OrderItemCreationAttributes = {
  id?: number;
  quantity: number;
  prix: number;
  orderId: number;
  productId: number;
  sellerOrderId?: number | null;
};

@Table({ tableName: 'order_items' })
export class OrderItem extends Model<OrderItem, OrderItemCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare quantity: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare prix: number;

  @ForeignKey(() => Order)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'order_id',
  })
  declare orderId: number;

  @BelongsTo(() => Order)
  declare order: Order;

  @ForeignKey(() => SellerOrder)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'seller_order_id',
  })
  declare sellerOrderId: number | null;

  @BelongsTo(() => SellerOrder)
  declare sellerOrder: SellerOrder;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'product_id',
  })
  declare productId: number;

  @BelongsTo(() => Product, {
    foreignKey: 'productId',
    as: 'product',
  })
  declare product: Product;
}
