-- CreateTable
CREATE TABLE "DeckShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "tokenCiphertext" TEXT NOT NULL,
    "tokenIv" TEXT NOT NULL,
    "tokenTag" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeckShare_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DeckShare_tokenHash_key" ON "DeckShare"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "DeckShare_deckId_key" ON "DeckShare"("deckId");

-- CreateIndex
CREATE INDEX "DeckShare_revokedAt_idx" ON "DeckShare"("revokedAt");
