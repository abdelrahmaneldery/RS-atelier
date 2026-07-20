-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "branchId" TEXT NOT NULL,
    "collectionId" TEXT,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fabric" TEXT,
    "colour" TEXT,
    "silhouette" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "fixCount" INTEGER NOT NULL DEFAULT 0,
    "price" INTEGER,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "insuranceAmount" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("branchId", "code", "collectionId", "colour", "createdAt", "description", "fabric", "fixCount", "id", "insuranceAmount", "price", "published", "silhouette", "slug", "status", "updatedAt") SELECT "branchId", "code", "collectionId", "colour", "createdAt", "description", "fabric", "fixCount", "id", "insuranceAmount", "price", "published", "silhouette", "slug", "status", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_branchId_published_status_idx" ON "Product"("branchId", "published", "status");
CREATE INDEX "Product_collectionId_idx" ON "Product"("collectionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
