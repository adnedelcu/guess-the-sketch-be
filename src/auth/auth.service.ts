import bcrypt from 'bcrypt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from 'src/dto/register.dto';
import { LoginDto } from 'src/dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async register(registerDto: RegisterDto): Promise<string> {
    const user = await this.usersService.create(registerDto);

    const { password, ...result } = user;
    const token = this.jwtService.sign(result);

    return token;
  }

  async login(loginDto: LoginDto): Promise<string> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (await bcrypt.compare(loginDto.password, user?.password) != true) {
      throw new UnauthorizedException();
    }
    const { password, ...result } = user;
    const token = this.jwtService.sign(result);

    return token;
  }
}
