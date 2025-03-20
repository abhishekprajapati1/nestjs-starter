# NestJS + TypeScript + Swagger + Prisma Starter

## Description

This is a starter template for a NestJS application that uses TypeScript, Swagger, and Prisma. It provides a basic structure for building a RESTful API with a PostgreSQL database.

## Features

Followings are preconfigured out of the box:

- TypeScript
- Swagger documentation
- Prisma ORM
- PostgreSQL database
- Redis cache
- AWS S3 storage
- User Authentication
- File handling and auto cleanup
- Mailing service
- Token management (JWT)

## Dependencies

- Redis Server

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- Visit the [Redis Documentation](https://redis.io/documentation) to learn more about Redis.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
