
// import { Module } from '@nestjs/common';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { SequelizeModule } from '@nestjs/sequelize';

// import { UsersModule } from './users/users.module';
// import { AuthModule } from './auth/auth.module';
// import { ProductsModule } from './products/products.module';
// import { CategoriesModule } from './categories/categories.module';
// import { OrdersModule } from './orders/orders.module';

// @Module({
//   imports: [
//     ConfigModule.forRoot({
//       isGlobal: true,
//     }),

//     SequelizeModule.forRootAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],

//       useFactory: (configService: ConfigService) => ({
//         dialect: 'postgres',

//         host: configService.get<string>('DB_HOST'),
//         port: Number(configService.get('DB_PORT') || 5432),
//         username: configService.get<string>('DB_USER'),
//         password: configService.get<string>('DB_PASSWORD'),
//         database: configService.get<string>('DB_NAME'),

//         autoLoadModels: true,

//         // À utiliser temporairement pour créer les tables
//         synchronize: configService.get('DB_SYNCHRONIZE') === 'true',
//       }),
//     }),

//     UsersModule,
//     AuthModule,
//     ProductsModule,
//     CategoriesModule,
//     OrdersModule,
//   ],
// })
// export class AppModule {}














import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');

        if (databaseUrl) {
          const dbUrl = new URL(databaseUrl);

          return {
            dialect: 'postgres' as const,
            host: dbUrl.hostname,
            port: Number(dbUrl.port || 5432),
            username: decodeURIComponent(dbUrl.username),
            password: decodeURIComponent(dbUrl.password),
            database: decodeURIComponent(
              dbUrl.pathname.replace(/^\//, ''),
            ),
            dialectOptions:
              dbUrl.searchParams.get('sslmode') === 'require'
                ? {
                    ssl: {
                      require: true,
                      rejectUnauthorized: false,
                    },
                  }
                : undefined,
            autoLoadModels: true,
            synchronize:
              configService.get('DB_SYNCHRONIZE') === 'true',
          };
        }

        return {
          dialect: 'postgres' as const,
          host: configService.get<string>('DB_HOST'),
          port: Number(configService.get('DB_PORT') || 5432),
          username: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          autoLoadModels: true,
          synchronize:
            configService.get('DB_SYNCHRONIZE') === 'true',
        };
      },
    }),

    UsersModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
  ],
})
export class AppModule {}
