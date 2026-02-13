// dni.dto.ts
import { IsNumberString, Length } from 'class-validator';

export class DniDto {
  @IsNumberString()
  @Length(7, 8)
  dni!: string;
}
