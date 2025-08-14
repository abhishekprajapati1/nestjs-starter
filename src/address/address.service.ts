import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ICreate, IFindOneByLabel, IRemove, IUpdate } from './types';
import { DatabaseId } from 'lib/types';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  async findOneByUserId(user_id: DatabaseId) {
    return await this.prisma.address.findUnique({
      where: {
        user_id,
      },
    });
  }

  async findOne(address_id: DatabaseId) {
    return await this.prisma.address.findUnique({
      where: {
        id: address_id,
      },
    });
  }

  async create({ createAddressDto, user_id, prisma = this.prisma }: ICreate) {
    return await prisma.address.create({
      data: {
        ...createAddressDto,
        user: {
          connect: { id: user_id },
        },
      },
    });
  }

  async update({
    updateAddressDto,
    address_id,
    prisma = this.prisma,
  }: IUpdate) {
    return await prisma.address.update({
      where: {
        id: address_id,
      },
      data: {
        ...updateAddressDto,
      },
    });
  }

  async remove({ address_id, prisma = this.prisma }: IRemove) {
    return await prisma.address.delete({
      where: {
        id: address_id,
      },
    });
  }

  async isUserAddress(user_id: DatabaseId, address_id: DatabaseId) {
    const address = await this.prisma.address.findUnique({
      where: {
        id: address_id,
        user_id,
      },
    });
    return address;
  }
}
