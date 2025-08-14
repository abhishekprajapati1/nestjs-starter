# NestJS Starter

It is really easy to get started with NestJS. It includes a basic setup with a few endpoints and a database connection. It is a great starting point for any NestJS application.

## Dependencies
- [NestJS](https://nestjs.com/)
- [Prisma](https://prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [NodeMailer](https://nodemailer.com/)
- [BcryptJS](https://www.npmjs.com/package/bcryptjs)

## Installation

Clone the repository with the following command:

```bash
git clone https://github.com/abhishekprajapati1/nestjs-starter.git
```

Install the dependencies with the following command:

```bash
pnpm install
```

## Running The Development Server

Before running the development server, make sure you have a PostgreSQL database running and configured in the `.env` file.
Use .env.example to create your own .env file.

First apply the migrations it will automatically create the type definition for prisma models.
```bash
pnpm run migrate
```

To run the development server, use the following command:

```bash
pnpm run start:dev
# or
pnpm run start:debug
```

## Running the production server

To run the production server, use the following command:

```bash
pnpm run build
pnpm run start:prod
```

## Accessing the documentation

Once the server is running you can access the swagger documentation at

```bash
http://localhost:8001/docs
```

## Contributing

I check the server responsiveness every month at 1st. It involves checking for outdated dependencies, bugs due to a dependency upgrade etc. Feel free to run and improve this starter. Any PR is appriciated.
