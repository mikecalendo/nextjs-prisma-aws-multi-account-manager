# Next.js Prisma AWS Multi-Account Management

I built this quickly as an internal tool and thought it might be useful to others.

The repository contains a Next.js application designed to visualize and manage multiple AWS member accounts within a multi-account architecture. It is ideal for managing a cloud platform or hosting company where pro tenants have their own dedicated account space to avoid the noisy neighbor problem—known as the "siloed model"—while freemium users are pooled into shared accounts. Both free and pro/enterprise tiers are managed using Prisma for MongoDB database access.

This app supports bulk management of policies across multiple accounts, allowing you to fetch existing policies, create new ones in bulk, and manage individual policies by creating and deleting them.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Setup](#setup)
- [Todo](#todo)

## Overview

In this system, each AWS root account has a single organization with multiple member accounts:
- **Free Accounts**: Pooled under `Free_Accounts` in the database
- **Pro & Enterprise Accounts**: Pooled under `Pro_Or_Enterprise_Accounts`

![Screenshot](./public/readme-screenshot.png)

## Features

- **Multi-Organization Tabs**: Quickly switch between organizations, each displaying its own accounts.
- **Pooled Accounts**: Shows both free and pro/enterprise accounts along with capacity usage (tenants, full or available).
- **IAM Policy Fetch**: Uses AWS STS to assume each member account role and retrieve policy data for each account.
- **Bulk Updates**: Create policies across all selected accounts in one go.
- **Prisma Integration**: MongoDB database calls with Prisma keep track of account pools, capacities, user associations.

## Tech Stack

- **Frontend:** Next.js
- **Backend / API Routes:** Next.js API routes
- **Database:** Prisma and MongoDB
- **AWS Integration:** AWS SDK
- **Styling:** Tailwind CSS

## Database Schema

### Prisma with MongoDB

```schema.prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                           String   @id @default(auto()) @map("_id") @db.ObjectId
  name                         String?
  tier                         String?  @default("free")
  accountId                    String?
  proOrEnterpriseAccountId     String?
  linkedAccountId              String?
  accountName                  String?
  proOrEnterpriseAccountName   String?
  createdAt                    DateTime @default(now())
  updatedAt                    DateTime @updatedAt
}

model Free_Accounts {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  totalTenants   Int?
  count          Int
  fullCapacity   Int      @default(10)
  isFullCapacity Boolean? @default(false)
  status         String   @default("ACTIVE")
  poolLabel      String?
  accountId      String
  accountNumber  Int?
  accountName    String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  tier           String
}

model Pro_Or_Enterprise_Accounts {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  totalTenants   Int?
  count          Int
  fullCapacity   Int      @default(1)
  isFullCapacity Boolean? @default(false)
  status         String   @default("ACTIVE")
  poolLabel      String?
  accountId      String
  accountNumber  Int?
  accountName    String?
  isAssigned     Boolean? @default(false)
  assignedToUser String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  tier           String
}
```

## Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/mikecalendo/nextjs-prisma-aws-multi-account-manager.git
   cd nextjs-prisma-aws-multi-account-manager


2. **Install Dependencies:**
Make sure you have Node.js installed, then run:

```bash
npm install
# or
yarn install
```

3. **Set Environment Variables:**

Create a .env file in the root directory and add the following (adjust values as needed):

```env
# MongoDB
DATABASE_URL=""

# Account 1
AWS_REGION_1=""
AWS_ACCESS_KEY_ID_1=""
AWS_SECRET_ACCESS_KEY_1=""
ACCOUNT_ID_1=""

# Account 2
AWS_REGION_2=""
AWS_ACCESS_KEY_ID_2=""
AWS_SECRET_ACCESS_KEY_2=""
ACCOUNT_ID_2=""

ORG_UNIT_PREFIX=""
```

```bash
mv -f .env.test .env
```

4. **Assign the Proper IAM Trust Policies and Roles in AWS:**

Each member account must trust the AWS credentials used by the root org.
Ensure sts:AssumeRole is allowed for your root AWS credentials in the child accounts.

5. **Run the Application:**

```bash
npm run dev
# or
yarn dev
```

5. **Open in Browser:**
Open http://localhost:3000 to view the app.

## Todo
- **Finish Editing Individual Policy with Diff:**
- **Account Creation:**
- **Account Sync to Database:**
- **Onboarding Free/Pro Users:**
