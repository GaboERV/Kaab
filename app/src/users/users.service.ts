import { Injectable, NotFoundException } from "@nestjs/common";
import type { CreateUserDto } from "./dto/create-user.dto";
import { MongoDbService } from "../mongodb/mongodb.service";
import { type User, type UserResponse, Role } from "../types/user.types";
import { ObjectId } from "mongodb";
import * as bcrypt from "bcrypt";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(private readonly mongoDbService: MongoDbService) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserResponse> {
    const { email, password } = createUserDto;

    // Check if user already exists
    const existingUser = await this.mongoDbService
      .getCollection("users") // Explicit type for collection
      .findOne({ email });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();

    const newUser: Omit<User, "_id"> = {
      email,
      password: hashedPassword,
      role: Role.USER, // Default role for new users
      createdAt: now,
      updatedAt: now,
    };

    try {
      const result = await this.mongoDbService
        .getCollection("users") // Explicit type for collection
        .insertOne(newUser);

      return {
        _id: result.insertedId.toString(),
        email,
        role: Role.USER, // Default role for new users
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Error creating user");
    }
  }

  async findAll(): Promise<UserResponse[]> {
    try {
      const users = await this.mongoDbService
        .getCollection("users") // Explicit type for collection
        .find({}, { projection: { password: 0 } })
        .toArray();

      return users.map((user) => ({
        _id: user._id.toString(),
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Error fetching users");
    }
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    try {
      const objectId = new ObjectId(id);

      // Check if the user exists
      const existingUser = await this.mongoDbService
        .getCollection("users")
        .findOne({ _id: objectId });

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const updateData: Partial<Omit<User, "_id">> = { ...updateUserDto, updatedAt: new Date() }; // Initialize with updatedAt

      if (updateUserDto.password) {
        updateData.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      const result = await this.mongoDbService
        .getCollection("users")
        .updateOne({ _id: objectId }, { $set: updateData });

      if (result.modifiedCount === 0) {
        throw new NotFoundException(`User with ID ${id} not found or no changes applied`); // More specific message
      }

      // Fetch the updated user to return
      const updatedUser = await this.mongoDbService
        .getCollection("users")
        .findOne({ _id: objectId });

      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found after update`); // Double check
      }

      return {
        _id: updatedUser._id.toString(),
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };
    } catch (error) {
      console.error("Error updating user:", error);
      if (error instanceof NotFoundException) {
        throw error; // Re-throw the NotFoundException
      }
      throw new Error(`Error updating user: ${error.message}`); // Include error message
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const objectId = new ObjectId(id);

      // Check if the user exists
      const existingUser = await this.mongoDbService
        .getCollection("users")
        .findOne({ _id: objectId });

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      if (existingUser.role === Role.SUPERUSER) {
        throw new Error("Cannot delete a superuser"); // Prevent deletion of superusers
      }
      const result = await this.mongoDbService
        .getCollection("users")
        .deleteOne({ _id: objectId });

      if (result.deletedCount === 0) {
        throw new NotFoundException(`User with ID ${id} not found`); // Duplicate check
      }
      
    } catch (error) {
      console.error("Error deleting user:", error);
      if (error instanceof NotFoundException) {
        throw error; // Re-throw the NotFoundException
      }
      throw new Error(`Error deleting user: ${error.message}`); // Include error message
    }
  }
    async findById(id: string): Promise<User | null> {
    try {
      if (!ObjectId.isValid(id)) {
        return null
      }

      const user = await this.mongoDbService.getCollection("users").findOne({ _id: new ObjectId(id) })

      if (!user) {
        return null
      }

      return {
        _id: user._id.toString(),
        email: user.email,
        password: user.password,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    } catch (error) {
      console.error("Error finding user by ID:", error)
      return null
    }
  }
}