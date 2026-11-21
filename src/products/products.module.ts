import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './product.model';
import { User } from '../users/user.model';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Product,
      User,
    ]),
    AuthModule,
  ],

  controllers: [ProductsController],

  providers: [ProductsService],

  exports: [ProductsService],
})
export class ProductsModule {}