import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class RemitoDetailDto {
  @IsInt() idProducto!: number;
  @IsInt() @Min(1) cantidad!: number;
}

export class CreateRemitoDto {
  @IsDateString() fechaEntrega!: string;
  @IsDateString() horaEntrega!: string;
  @IsInt() idEstado!: number;
  @IsInt() idCliente!: number;
  @IsOptional() @IsInt() idResponsableEntrega?: number;
  @IsArray() @ValidateNested({ each: true }) @Type(() => RemitoDetailDto) detalles!: RemitoDetailDto[];
  @IsOptional() @IsString() observacion?: string;
}

export class UpdateRemitoDto {
  @IsOptional() @IsInt() idEstado?: number;
  @IsOptional() @IsString() observacion?: string;
  @IsOptional() @IsString() inconveniente?: string;
  @IsOptional() @IsString() formaPago?: string;
  @IsOptional() @IsDateString() fechaEntregaReal?: string;
}

export class RemitoFilterDto {
  @IsOptional() @IsDateString() desde?: string;
  @IsOptional() @IsDateString() hasta?: string;
  @IsOptional() @IsInt() @Type(() => Number) idCliente?: number;
  @IsOptional() @IsInt() @Type(() => Number) idEstado?: number;
  @IsOptional() @IsInt() @Type(() => Number) idProducto?: number;
  @IsOptional() @IsString() localidad?: string;
  @IsOptional() @IsString() provincia?: string;
  @IsOptional() @IsNumber() @Type(() => Number) precioMin?: number;
  @IsOptional() @IsNumber() @Type(() => Number) precioMax?: number;
}