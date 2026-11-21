import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';

import { Order } from './order.model';
import { OrderItem } from './order-item.model';
import { SellerOrder } from './seller-order.model';

import { Product } from '../products/product.model';
import { UsersService } from '../users/users.service';

import { CreateOrderDto } from './dto/create-order.dto';

import { User } from '../users/user.model';
import { GuestOrderLookupDto } from './dto/guest-order-lookup.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order)
    private readonly orderModel: typeof Order,

    @InjectModel(OrderItem)
    private readonly orderItemModel: typeof OrderItem,

    @InjectModel(SellerOrder)
    private readonly sellerOrderModel: typeof SellerOrder,

    @InjectModel(Product)
    private readonly productModel: typeof Product,

    private readonly usersService: UsersService,
  ) {}

  // Consultation sécurisée d'une commande sans connexion
async findGuestOrder(dto: GuestOrderLookupDto) {
  const order = await this.orderModel.findByPk(dto.orderId, {
    include: [
      {
        model: User,
        attributes: ['id', 'telephone'],
        required: true,
      },
      {
        model: OrderItem,
        include: [
          {
            model: Product,
            as: 'product',
          },
        ],
      },
      {
        model: SellerOrder,
        include: [
          {
            model: OrderItem,
            include: [
              {
                model: Product,
                as: 'product',
              },
            ],
          },
        ],
      },
    ],
  });

  if (!order) {
    throw new NotFoundException('Commande introuvable');
  }

  const orderData = order.toJSON() as any;

  const savedPhone = String(orderData.user?.telephone || '').trim();
  const submittedPhone = String(dto.telephone || '').trim();

  if (!savedPhone || savedPhone !== submittedPhone) {
    throw new ForbiddenException(
      'Le numéro de téléphone ne correspond pas à cette commande',
    );
  }

  // Ne pas exposer les informations personnelles du client
  delete orderData.user;

  return orderData;
}


  // Création d'une commande sans connexion client
  async create(createOrderDto: CreateOrderDto) {
    if (!createOrderDto.items?.length) {
      throw new BadRequestException(
        'La commande doit contenir au moins un produit',
      );
    }

    const sequelize = this.orderModel.sequelize;

    if (!sequelize) {
      throw new Error('Connexion à la base de données indisponible');
    }

    const order = await sequelize.transaction(async (transaction) => {
      // 1. Création ou récupération du compte client
      const client = await this.usersService.createGuestClient(
        {
          nom: createOrderDto.nom,
          telephone: createOrderDto.telephone,
          adresse: createOrderDto.adresse,
        },
        transaction,
      );

      // 2. Regroupement des quantités par produit
      const quantities = new Map<number, number>();

      for (const item of createOrderDto.items) {
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          throw new BadRequestException(
            'La quantité doit être supérieure à zéro',
          );
        }

        const currentQuantity = quantities.get(item.productId) || 0;

        quantities.set(item.productId, currentQuantity + item.quantity);
      }

      // 3. Vérification des produits et des stocks
      const sellerGroups = new Map<
        number,
        {
          items: {
            product: Product;
            quantity: number;
            prix: number;
          }[];
          total: number;
        }
      >();

      let totalGeneral = 0;

      for (const [productId, quantity] of quantities) {
        const product = await this.productModel.findByPk(productId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!product) {
          throw new NotFoundException(`Produit ${productId} introuvable`);
        }

        if (product.stock < quantity) {
          throw new BadRequestException(
            `Stock insuffisant pour le produit ${product.nom}`,
          );
        }

        const sellerId = Number(product.userId);
        const prix = Number(product.prix);
        const subtotal = prix * quantity;

        if (!sellerGroups.has(sellerId)) {
          sellerGroups.set(sellerId, {
            items: [],
            total: 0,
          });
        }

        const group = sellerGroups.get(sellerId)!;

        group.items.push({
          product,
          quantity,
          prix,
        });

        group.total += subtotal;
        totalGeneral += subtotal;
      }

      // 4. Création de la commande principale
      const newOrder = await this.orderModel.create(
        {
          total: totalGeneral,
          userId: client.id,
          statut: 'EN_ATTENTE',
          modePaiement: 'PAIEMENT_LIVRAISON',
          statutPaiement: 'EN_ATTENTE',
        },
        { transaction },
      );

      // 5. Création d'une sous-commande par vendeuse
      for (const [sellerId, group] of sellerGroups) {
        const sellerOrder = await this.sellerOrderModel.create(
          {
            total: group.total,
            statut: 'EN_ATTENTE',
            orderId: newOrder.id,
            sellerId,
          },
          { transaction },
        );

        // 6. Enregistrement des articles de cette vendeuse
        for (const item of group.items) {
          await this.orderItemModel.create(
            {
              orderId: newOrder.id,
              sellerOrderId: sellerOrder.id,
              productId: item.product.id,
              quantity: item.quantity,
              prix: item.prix,
            },
            { transaction },
          );

          // 7. Mise à jour du stock
          await item.product.update(
            {
              stock: item.product.stock - item.quantity,
            },
            { transaction },
          );
        }
      }

      return newOrder;
    });

    // Retourner la commande complète après validation
    return this.findOne(order.id, order.userId, 'CLIENT');
  }

  // Liste des commandes
  async findAll(userId: number, role: string) {
    if (role === 'VENDEUSE') {
      return this.findSellerOrders(userId);
    }

    const where = role === 'ADMIN' ? {} : { userId };

    return this.orderModel.findAll({
      where,
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              as: 'product',
            },
          ],
        },
        {
          model: SellerOrder,
          include: [
            {
              model: OrderItem,
              include: [
                {
                  model: Product,
                  as: 'product',
                },
              ],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  // Consultation d'une commande
  async findOne(id: number, userId: number, role: string) {
    const isSeller = role === 'VENDEUSE';

    const includes: any[] = [];

    if (!isSeller) {
      includes.push({
        model: OrderItem,
        include: [
          {
            model: Product,
            as: 'product',
          },
        ],
      });
    }

    includes.push({
      model: SellerOrder,
      where: isSeller ? { sellerId: userId } : undefined,
      required: isSeller,
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              as: 'product',
            },
          ],
        },
      ],
    });

    const order = await this.orderModel.findByPk(id, {
      include: includes,
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    if (role === 'ADMIN') {
      return order;
    }

    if (role === 'CLIENT') {
      if (Number(order.userId) !== Number(userId)) {
        throw new ForbiddenException(
          'Vous ne pouvez consulter que vos propres commandes',
        );
      }

      return order;
    }

    if (isSeller) {
      return order;
    }

    throw new ForbiddenException('Accès non autorisé à cette commande');
  }

  // Liste des sous-commandes d'une vendeuse
  async findSellerOrders(userId: number) {
    return this.sellerOrderModel.findAll({
      where: { sellerId: userId },
      include: [
        {
          model: Order,
          include: [
            {
              model: OrderItem,
              include: [
                {
                  model: Product,
                  as: 'product',
                },
              ],
            },
          ],
        },
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              as: 'product',
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  // Modification du statut d'une sous-commande
  async updateStatus(id: number, statut: string, userId: number, role: string) {
    // Seule une vendeuse peut modifier une sous-commande
    if (role !== 'VENDEUSE') {
      throw new ForbiddenException(
        'Seule la vendeuse concernée peut modifier le statut de sa commande',
      );
    }

    const allowedStatuses = [
      'EN_ATTENTE',
      'CONFIRMEE',
      'EXPEDIEE',
      'LIVREE',
      'ANNULEE',
    ];

    if (!allowedStatuses.includes(statut)) {
      throw new BadRequestException('Statut de commande invalide');
    }

    // Les deux mises à jour doivent réussir ensemble
    return this.orderModel.sequelize!.transaction(async (transaction) => {
      // Vérifier que la sous-commande appartient à la vendeuse
      const sellerOrder = await this.sellerOrderModel.findOne({
        where: {
          id,
          sellerId: userId,
        },
        transaction,
      });

      if (!sellerOrder) {
        throw new NotFoundException(
          'Sous-commande introuvable ou non autorisée',
        );
      }

      // Vérifier les transitions autorisées
      const transitions: Record<string, string[]> = {
        EN_ATTENTE: ['CONFIRMEE', 'ANNULEE'],
        CONFIRMEE: ['EXPEDIEE'],
        EXPEDIEE: ['LIVREE'],
      };

      const nextStatuses = transitions[sellerOrder.statut] || [];

      if (!nextStatuses.includes(statut)) {
        throw new BadRequestException(
          `Transition impossible : ${sellerOrder.statut} vers ${statut}`,
        );
      }

      // Enregistrer le nouveau statut de la vendeuse
      sellerOrder.statut = statut;
      await sellerOrder.save({ transaction });

      // Récupérer la commande principale
      const order = await this.orderModel.findByPk(sellerOrder.orderId, {
        transaction,
      });

      if (!order) {
        throw new NotFoundException('Commande principale introuvable');
      }

      // Récupérer toutes les sous-commandes de cette commande
      const sellerOrders = await this.sellerOrderModel.findAll({
        where: {
          orderId: order.id,
        },
        transaction,
      });

      const statuses = sellerOrders.map((item) => item.statut);

      // Calculer automatiquement le statut global
      let globalStatus: string;

      if (statuses.every((s) => s === 'ANNULEE')) {
        globalStatus = 'ANNULEE';
      } else if (statuses.every((s) => s === 'LIVREE')) {
        globalStatus = 'LIVREE';
      } else if (statuses.includes('LIVREE')) {
        globalStatus = 'PARTIELLEMENT_LIVREE';
      } else if (statuses.includes('EXPEDIEE')) {
        globalStatus = 'EXPEDIEE';
      } else if (statuses.includes('CONFIRMEE')) {
        globalStatus = 'CONFIRMEE';
      } else {
        globalStatus = 'EN_ATTENTE';
      }

      // Mettre à jour la commande principale
      order.statut = globalStatus;
      await order.save({ transaction });

      return {
        message: 'Statut de la sous-commande mis à jour avec succès',
        sellerOrder,
        orderStatut: globalStatus,
      };
    });
  }
}
