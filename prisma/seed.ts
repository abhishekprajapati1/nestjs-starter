import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const logger = new Logger('DB_SEED');
const createSuperUser = async () => {
  const exist = await prisma.user.findUnique({
    where: { email: 'admin@coparent.com' },
  });
  if (!exist) {
    const user = await prisma.user.create({
      data: {
        email: 'admin@coparent.com',
        agree_t_and_c: true,
        name: 'Admin',
        type: 'admin',
        credentials: {
          create: {
            password: bcrypt.hashSync('Admin@123', 10),
          },
        },
      },
    });
    logger.log('Created super user', user);
  } else {
    logger.log('Super user already exist.');
  }
};

const main = async () => {
  await createSuperUser();
  process.exit(0);
};

main()
  .catch((error) => {
    logger.log(error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect().catch((error) => {
      logger.log('Something went wrong while disconnecting the prisma', error);
    });
  });
