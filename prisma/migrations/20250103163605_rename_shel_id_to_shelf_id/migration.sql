-- CreateTable
CREATE TABLE "PantryShelf" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryShelf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shelfId" TEXT NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "PantryShelf"("id") ON DELETE CASCADE ON UPDATE CASCADE;
