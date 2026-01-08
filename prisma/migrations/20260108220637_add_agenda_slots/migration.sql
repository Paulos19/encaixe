-- CreateTable
CREATE TABLE "AgendaSlot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgendaSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgendaSlot_userId_startTime_idx" ON "AgendaSlot"("userId", "startTime");

-- AddForeignKey
ALTER TABLE "AgendaSlot" ADD CONSTRAINT "AgendaSlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
