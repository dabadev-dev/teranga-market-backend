
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { GuestOrderLookupDto } from './dto/guest-order-lookup.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  // CLIENT : passer commande sans connexion
  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  // ADMIN : toutes les commandes
  // CLIENT connecté : ses commandes
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() request: any) {
    return this.ordersService.findAll(
      request.user.id,
      request.user.role,
    );
  }

  // VENDEUSE : ses propres sous-commandes
  @Get('seller')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDEUSE')
  findSellerOrders(@Req() req: any) {
    return this.ordersService.findSellerOrders(
      req.user.id,
    );
  }


// CLIENT INVITÉ : consulter une commande avec son numéro et son téléphone
@Post('guest/lookup')
findGuestOrder(@Body() dto: GuestOrderLookupDto) {
  return this.ordersService.findGuestOrder(dto);
}

  // Consulter une commande
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: any,
  ) {
    return this.ordersService.findOne(
      id,
      request.user.id,
      request.user.role,
    );
  }

  // VENDEUSE : modifier uniquement sa sous-commande
  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDEUSE')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { statut: string },
    @Req() req: any,
  ) {
    return this.ordersService.updateStatus(
      id,
      body.statut,
      req.user.id,
      req.user.role,
    );
  }
}
