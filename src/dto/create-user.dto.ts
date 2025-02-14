import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ name: 'email', example: 'example@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @ApiProperty({ name: 'password', example: '1234567890' })
  @IsNotEmpty()
  password: string;
}
