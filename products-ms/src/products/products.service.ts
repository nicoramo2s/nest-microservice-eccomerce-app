import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PrismaService } from 'src/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: createProductDto,
    });
    return product;
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const totalPages = await this.prisma.product.count({
      where: { available: true },
    });
    const lastPage = Math.ceil(totalPages / limit);

    return {
      data: await this.prisma.product.findMany({
        where: { available: true },
        skip: (page - 1) * limit,
        take: limit,
      }),
      metadata: {
        total: totalPages,
        page: page,
        lastPage: lastPage,
      },
    };
  }

  async findOne(id: number) {
    return await this.prisma.product
      .findUniqueOrThrow({
        where: { id , available: true },
      })
      .catch(() => {
        throw new RpcException({
          message: `Product with id ${id} not found`,
          status: HttpStatus.NOT_FOUND,
        });
      });
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id: __, ...data } = updateProductDto;
    return await this.prisma.product
      .update({
        where: { id },
        data: data,
      })
      .catch(() => {
        throw new RpcException({
          message: `Product with id ${id} not found`,
          status: HttpStatus.NOT_FOUND,
        });
      });
  }

  async remove(id: number) {
    const product = await this.prisma.product
      .update({
        where: { id, available: true },
        data: { available: false },
      })
      .catch(() => {
        throw new RpcException({
          message: `Product with id ${id} not found`,
          status: HttpStatus.NOT_FOUND,
        });
      });
    return product;
  }
}
