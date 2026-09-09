import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * A demo enquiry from the public marketing site.
 *
 * Lengths are capped on every field. This endpoint is unauthenticated and sends
 * email, so the request body is the one thing an attacker fully controls — an
 * uncapped free-text field is how that becomes a way to post a novel into
 * somebody's inbox.
 */
export class DemoRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  farm: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  role: string;

  @IsEmail()
  @MaxLength(160)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  hectares?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  headcount?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  /**
   * Honeypot. Hidden from people by CSS, so anything here came from a bot and
   * the request is accepted and dropped rather than refused — a 400 tells the
   * script what to change.
   */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;
}
