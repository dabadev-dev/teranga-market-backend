
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

import { Order } from './order.model';
import { OrderItem } from './order-item.model';
import { Product } from '../products/product.model';
import { SellerOrder } from './seller-order.model';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Order,
      OrderItem,
      Product,
      SellerOrder,
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
