import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty()
  readonly firstName: string;
  @ApiProperty()
  readonly lastName: string;
  @ApiProperty()
  readonly email: string;
  @ApiProperty()
  readonly birthday: Date;
  @ApiProperty()
  readonly password: string;
  @ApiPropertyOptional()
  readonly profilePicture?: string;
}
