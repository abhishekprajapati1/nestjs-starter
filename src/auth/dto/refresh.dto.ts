import { REFRESHABLE_TOKEN_TYPES, REFRESHABLE_TOKEN_TYPES_ARRAY, TOKENS } from "../../../lib/constants";
import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";

export class RefreshTokenDto {
    @IsOptional()
    @IsString()
    @IsIn(REFRESHABLE_TOKEN_TYPES_ARRAY)
    @ApiProperty({ required: false, default: TOKENS.auth_token, description: "Token name that is to be refreshed." })
    type?: REFRESHABLE_TOKEN_TYPES = TOKENS.auth_token as REFRESHABLE_TOKEN_TYPES;
}