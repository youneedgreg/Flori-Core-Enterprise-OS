import {
  IsString,
  IsOptional,
  IsArray,
  IsEmail,
  IsNumber,
  IsUUID,
} from 'class-validator';

export class FarmProfileDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  gpsCoordinates?: string;

  @IsArray()
  @IsString({ each: true })
  certifications!: string[];

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;
}

export class ZoneDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsNumber()
  areaSqm?: number;

  @IsArray()
  @IsString({ each: true })
  cropVarieties!: string[];
}

export class InviteTeamMemberDto {
  @IsEmail()
  email!: string;

  @IsUUID()
  roleId!: string;
}

export class IoTDeviceDto {
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @IsString()
  type!: string;

  @IsString()
  macAddress!: string;

  @IsString()
  mqttTopic!: string;
}
