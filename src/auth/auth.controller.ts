import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from 'src/dto/login.dto';
import { AuthGuard } from './auth.guard';
import { RegisterDto } from 'src/dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return { token: this.authService.register(registerDto) };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return { token: this.authService.login(loginDto) };
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  profile(@Request() req) {
    return req.user;
  }
}
