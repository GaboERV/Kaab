import { Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import * as bcrypt from "bcrypt"
import { RegisterDto } from "./dto/register.dto"
import { LoginDto } from "./dto/login.dto"
import { ConfigService } from "@nestjs/config"
import { MongoDbService } from "../mongodb/mongodb.service"
import { Role } from "../types/user.types"
import { ObjectId } from "mongodb"

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mongoDbService: MongoDbService,
  ) {}

  async registerSuperusuario(registerDto: RegisterDto, contrasena: string) {
    const { email, password } = registerDto

    const superuserPassword = this.configService.get<string>("SUPERUSER_PASSWORD")
    if (contrasena !== superuserPassword) {
      throw new UnauthorizedException("Invalid password for superuser registration")
    }

    const existingUser = await this.mongoDbService.getCollection("users").findOne({ email })

    if (existingUser) {
      throw new UnauthorizedException("User already exists")
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const now = new Date()

    try {
      await this.mongoDbService.getCollection("users").insertOne({
        email,
        password: hashedPassword,
        role: Role.SUPERUSER,
        createdAt: now,
        updatedAt: now,
      })

      return { message: "Superuser registered successfully" }
    } catch (error) {
      console.error("Error registering superuser:", error)
      throw new Error("Error registering superuser")
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto

    const user = await this.mongoDbService.getCollection("users").findOne({ email })

    if (!user) {
      throw new UnauthorizedException("Invalid credentials")
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials")
    }

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    }

    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>("JWT_SECRET"),
    })

    return {
      token,
      user: {
        _id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
    }
  }

  async validateUser(userId: string) {
    try {
      if (!ObjectId.isValid(userId)) {
        return null
      }

      const user = await this.mongoDbService.getCollection("users").findOne({ _id: new ObjectId(userId) })

      if (!user) {
        return null
      }

      return {
        _id: user._id.toString(),
        email: user.email,
        role: user.role,
      }
    } catch (error) {
      console.error("Error validating user:", error)
      return null
    }
  }
}
