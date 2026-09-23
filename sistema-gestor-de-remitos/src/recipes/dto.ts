import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RecipeIngredientDto {
  @IsInt() idInsumo!: number;
  @IsNumber() @Min(0) cantidad!: number;
}

export class CreateRecipeDto {
  @IsOptional() @IsInt() idProducto?: number;
  @IsString() descripcion!: string;
  @IsNumber() @Min(0) rendimiento!: number;
  @IsString() unidadRendimiento!: string;
  @IsInt() @Min(0) tiempoPrepMin!: number;
  @IsOptional() @IsString() instrucciones?: string;
  detalles!: RecipeIngredientDto[];
}