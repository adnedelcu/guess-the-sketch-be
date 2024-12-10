import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async register(registerDto: RegisterDto): Promise<string> {
    if (await this.usersService.findByEmail(registerDto.email)) {
      throw new BadRequestException('Email must be unique');
    }

    const user = await this.usersService.create(registerDto);

    const { password, ...payload } = user.toObject();
    const token = this.jwtService.sign(payload);

    return token;
  }

  async login(loginDto: LoginDto): Promise<any> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user?.password || await compare(loginDto.password, user?.password) != true) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const { password, ...payload } = user.toObject();
    const token = this.jwtService.sign(payload);

    return token;
  }
}
