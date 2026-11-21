
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

export type UserCreationAttributes = {
  id?: number;
  nom: string;
  email?: string | null;
  password?: string | null;
  telephone: string;
  adresse?: string;
  role?: 'CLIENT' | 'VENDEUSE' | 'ADMIN';
  statut?: 'EN_ATTENTE' | 'APPROUVEE' | 'REFUSEE';
};

@Table({
  tableName: 'users',
})
export class User extends Model<User, UserCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare nom: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  declare email: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare password: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare telephone: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare adresse: string;

  @Column({
    type: DataType.ENUM('CLIENT', 'VENDEUSE', 'ADMIN'),
    allowNull: false,
    defaultValue: 'CLIENT',
  })
  declare role: string;

  @Column({
    type: DataType.ENUM('EN_ATTENTE', 'APPROUVEE', 'REFUSEE'),
    allowNull: false,
    defaultValue: 'EN_ATTENTE',
  })
  declare statut: string;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;
}
