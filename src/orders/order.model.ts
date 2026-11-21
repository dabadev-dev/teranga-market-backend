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

import { User } from '../users/user.model';
import { OrderItem } from './order-item.model';
import { SellerOrder } from './seller-order.model';

export type OrderCreationAttributes = {
  id?: number;
  total: number;
  statut?: string;
  userId: number;
  modePaiement?: string;
  statutPaiement?: string;
};

@Table({ tableName: 'orders' })
export class Order extends Model<Order, OrderCreationAttributes> {
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
      'PARTIELLEMENT_LIVREE',
    ),
    allowNull: false,
    defaultValue: 'EN_ATTENTE',
  })
  declare statut: string;

  @Column({
    type: DataType.STRING(30),
    allowNull: false,
    defaultValue: 'PAIEMENT_LIVRAISON',
    field: 'mode_paiement',
  })
  declare modePaiement: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    defaultValue: 'EN_ATTENTE',
    field: 'statut_paiement',
  })
  declare statutPaiement: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'user_id',
  })
  declare userId: number;

  @BelongsTo(() => User)
  declare user: User;

  @HasMany(() => OrderItem)
  declare items: OrderItem[];

  @HasMany(() => SellerOrder)
  declare sellerOrders: SellerOrder[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
