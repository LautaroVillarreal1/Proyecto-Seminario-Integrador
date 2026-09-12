import { IsEmail, IsInt, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  apellido!: string;

  @IsEmail()
  correoElectronico!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsInt()
  idRol!: number;
}