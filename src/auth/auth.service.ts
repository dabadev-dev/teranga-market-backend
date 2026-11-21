import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  
async register(registerDto: RegisterDto) {
  const existingUser = await this.usersService.findByEmail(
    registerDto.email,
  );

  if (existingUser) {
    throw new ConflictException(
      'Un utilisateur existe déjà avec cet email',
    );
  }

  const { typeCompte, ...userData } = registerDto;

  const user = await this.usersService.createRegisteredUser(
    userData,
    typeCompte,
  );

  return {
    message:
      typeCompte === 'VENDEUSE'
        ? 'Demande vendeuse envoyée. En attente de validation.'
        : 'Inscription réussie.',
    user: {
      id: user.id,
      nom: user.nom,
      email: user.email,
      telephone: user.telephone,
      adresse: user.adresse,
      role: user.role,
      statut: user.statut,
    },
  };
}


  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(
      loginDto.email,
    );

    if (!user) {
      throw new UnauthorizedException(
        'Email ou mot de passe incorrect',
      );
    }

    if (!user.password) {
  throw new UnauthorizedException(
    'Email ou mot de passe incorrect',
  );
}

const passwordCorrect = await bcrypt.compare(
  loginDto.password,
  user.password,
);

    if (!passwordCorrect) {
      throw new UnauthorizedException(
        'Email ou mot de passe incorrect',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      message: 'Connexion réussie',
      access_token: token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        statut: user.statut,
      },
    };
  }
}