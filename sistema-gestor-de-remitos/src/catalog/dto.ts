import { IsBoolean, IsEmail, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductoDto {
  @IsString() nombre!: string;
  @IsString() descripcion!: string;
  @IsNumber() @Min(0) precioUnitario!: number;
  @IsNumber() @Min(0) peso!: number;
  @IsInt() idUnidadDeMedida!: number;
  @IsInt() idCategoria!: number;
  @IsOptional() @IsInt() idreceta?: number;
  @IsOptional() @IsNumber() @Min(0) stockActual?: number;
  @IsOptional() @IsNumber() @Min(0) stockMinimo?: number;
  @IsOptional() @IsBoolean() activo?: boolean;
}

export class CreateInsumoDto {
  @IsString() nombre!: string;
  @IsString() descripcion!: string;
  @IsInt() idUnidadDeMedida!: number;
  @IsOptional() @IsNumber() @Min(0) stockActual?: number;
  @IsOptional() @IsNumber() @Min(0) stockMinimo?: number;
  @IsOptional() @IsNumber() @Min(0) costoUnitario?: number;
  @IsOptional() @IsString() proveedor?: string;
}

export class CreateClienteDto {
  @IsString() nombre!: string;
  @IsString() descripcion!: string;
  @IsString() direccion!: string;
  @IsEmail() correoElectronico!: string;
  @IsString() numeroDeTelefono!: string;
  @IsInt() idProvincia!: number;
  @IsOptional() @IsNumber() latitud?: number;
  @IsOptional() @IsNumber() longitud?: number;
}