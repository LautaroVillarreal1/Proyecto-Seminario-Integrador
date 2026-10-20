import { ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Matches, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RecipeIngredientDto {
  @IsInt() @Min(1) idInsumo!: number;
  @IsNumber() @IsPositive() cantidad!: number;
}

export class CreateRecipeDto {
  @IsOptional() @IsInt() idProducto?: number;
  @IsString() @IsNotEmpty() @Matches(/\S/) descripcion!: string;
  @IsNumber() @Min(1) rendimiento!: number;
  @IsString() @IsNotEmpty() @Matches(/\S/) unidadRendimiento!: string;
  @IsInt() @Min(0) tiempoPrepMin!: number;
  @IsOptional() @IsString() instrucciones?: string;
  @IsArray() @ArrayNotEmpty() @ValidateNested({ each: true }) @Type(() => RecipeIngredientDto) detalles!: RecipeIngredientDto[];
}