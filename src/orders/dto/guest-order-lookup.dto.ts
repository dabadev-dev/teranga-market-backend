
import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GuestOrderLookupDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderId: number;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  telephone: string;
}
