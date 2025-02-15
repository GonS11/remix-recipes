/*
  Warnings:

  - You are about to drop the column `createAt` on the `Ingredient` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Ingredient` table. All the data in the column will be lost.
  - You are about to drop the column `createAt` on the `PantryItem` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `PantryItem` table. All the data in the column will be lost.
  - You are about to drop the column `createAt` on the `PantryShelf` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `PantryShelf` table. All the data in the column will be lost.
  - You are about to drop the column `createAt` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `createAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `User` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Ingredient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PantryItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PantryShelf` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Recipe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ingredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ingredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Ingredient" ("amount", "id", "name", "recipeId") SELECT "amount", "id", "name", "recipeId" FROM "Ingredient";
DROP TABLE "Ingredient";
ALTER TABLE "new_Ingredient" RENAME TO "Ingredient";
CREATE TABLE "new_PantryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shelfId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PantryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PantryItem_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "PantryShelf" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PantryItem" ("id", "name", "shelfId", "userId") SELECT "id", "name", "shelfId", "userId" FROM "PantryItem";
DROP TABLE "PantryItem";
ALTER TABLE "new_PantryItem" RENAME TO "PantryItem";
CREATE TABLE "new_PantryShelf" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PantryShelf_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PantryShelf" ("id", "name", "userId") SELECT "id", "name", "userId" FROM "PantryShelf";
DROP TABLE "PantryShelf";
ALTER TABLE "new_PantryShelf" RENAME TO "PantryShelf";
CREATE TABLE "new_Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "totalTime" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mealPlanMultiplier" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Recipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Recipe" ("id", "imageUrl", "instructions", "name", "totalTime", "userId") SELECT "id", "imageUrl", "instructions", "name", "totalTime", "userId" FROM "Recipe";
DROP TABLE "Recipe";
ALTER TABLE "new_Recipe" RENAME TO "Recipe";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("email", "firstName", "id", "lastName") SELECT "email", "firstName", "id", "lastName" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
