
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';

import { User } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';

import { Transaction } from 'sequelize';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  // Création classique d'un utilisateur
  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      10,
    );

    return this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
    });
  }

  // Inscription d'une vendeuse ou d'un client
  async createRegisteredUser(
    data: CreateUserDto,
    typeCompte: 'CLIENT' | 'VENDEUSE',
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(
      data.password,
      10,
    );

    return this.userModel.create({
      ...data,
      password: hashedPassword,
      role: typeCompte,
      statut:
        typeCompte === 'VENDEUSE'
          ? 'EN_ATTENTE'
          : 'APPROUVEE',
    });
  }

  // Recherche par email
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({
      where: { email },
    });
  }

  // Recherche par téléphone
  async findByTelephone(
  telephone: string,
  transaction?: Transaction,
): Promise<User | null> {
  return this.userModel.findOne({
    where: { telephone },
    transaction,
  });
}

  // Création automatique d'un compte client lors d'une commande
  async createGuestClient(
  data: {
    nom: string;
    telephone: string;
    adresse?: string;
  },
  transaction?: Transaction,
): Promise<User> {
  const telephone = data.telephone.trim();

  const existingUser = await this.findByTelephone(
    telephone,
    transaction,
  );

    // Si le numéro appartient déjà à une vendeuse ou un admin
    if (
      existingUser &&
      existingUser.role !== 'CLIENT'
    ) {
      throw new ConflictException(
        'Ce numéro est déjà associé à un compte professionnel.',
      );
    }

    // Si le compte client existe déjà, on le réutilise
    if (existingUser) {
      return existingUser;
    }

    // Création d'un compte client sans email ni mot de passe
    return this.userModel.create(
    {
      nom: data.nom.trim(),
      telephone,
      adresse: data.adresse?.trim(),
      email: null,
      password: null,
      role: 'CLIENT',
      statut: 'APPROUVEE',
    },
    { transaction },
  );
  }

  // Liste des utilisateurs
  async findAll() {
    return this.userModel.findAll({
      attributes: {
        exclude: ['password'],
      },
      order: [['created_at', 'DESC']],
    });
  }

  // Recherche d'un utilisateur par ID
  async findOne(id: number) {
    const user = await this.userModel.findByPk(id, {
      attributes: {
        exclude: ['password'],
      },
    });

    if (!user) {
      throw new NotFoundException(
        'Utilisateur introuvable',
      );
    }

    return user;
  }

  // Modification du profil
  async update(
    id: number,
    data: {
      nom?: string;
      email?: string;
    },
    currentUserId: number,
    currentUserRole: string,
  ) {
    const user = await this.userModel.findByPk(id);

    if (!user) {
      throw new NotFoundException(
        'Utilisateur introuvable',
      );
    }

    if (
      currentUserRole !== 'ADMIN' &&
      currentUserId !== id
    ) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que votre propre profil',
      );
    }

    await user.update(data);

    const { password, ...result } = user.toJSON();

    return result;
  }

  // Modification du rôle
  async updateRole(id: number, role: string) {
    const user = await this.userModel.findByPk(id);

    if (!user) {
      throw new NotFoundException(
        'Utilisateur introuvable',
      );
    }

    user.role = role;
    await user.save();

    const { password, ...result } = user.toJSON();

    return result;
  }

  // Validation ou refus d'une vendeuse
  async updateStatus(id: number, statut: string) {
    const user = await this.userModel.findByPk(id);

    if (!user) {
      throw new NotFoundException(
        'Utilisateur introuvable',
      );
    }

    const allowedStatuses = [
      'EN_ATTENTE',
      'APPROUVEE',
      'REFUSEE',
    ];

    if (!allowedStatuses.includes(statut)) {
      throw new ForbiddenException(
        'Statut utilisateur invalide',
      );
    }

    user.statut = statut;
    await user.save();

    const { password, ...result } = user.toJSON();

    return result;
  }

  // Suppression d'un utilisateur
  async remove(id: number) {
    const user = await this.userModel.findByPk(id);

    if (!user) {
      throw new NotFoundException(
        'Utilisateur introuvable',
      );
    }

    await user.destroy();

    return {
      message: 'Utilisateur supprimé avec succès',
    };
  }
}
