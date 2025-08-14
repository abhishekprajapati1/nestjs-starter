import { ApiProperty } from "@nestjs/swagger";
import { IsJWT, IsNotEmpty, IsString } from "class-validator";

export class TokenDto {
    @IsString()
    @IsJWT()
    @ApiProperty()
    token: string;
}