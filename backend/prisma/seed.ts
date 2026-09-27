import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash("admin123", 10);
  const userPass = await bcrypt.hash("user123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@lostfound.com" },
    update: {},
    create: { name: "Admin", email: "admin@lostfound.com", password: adminPass, role: "ADMIN" },
  });

  const user1 = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: { name: "Alice", email: "alice@example.com", password: userPass },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: { name: "Bob", email: "bob@example.com", password: userPass },
  });

  await prisma.item.createMany({
    data: [
      {
        reporterId: user1.id, type: "LOST", title: "iPhone 15", category: "Electronics",
        description: "Black case with a small white sticker on the back",
        location: "Central Library", dateLostFound: new Date("2026-09-20"), status: "ACTIVE",
      },
      {
        reporterId: user2.id, type: "FOUND", title: "Black Backpack", category: "Bags",
        description: "Found near the entrance, has a water bottle inside",
        location: "Block 3", dateLostFound: new Date("2026-09-22"), status: "ACTIVE",
      },
      {
        reporterId: user1.id, type: "LOST", title: "Student ID Card", category: "Documents",
        description: "SRM IST student ID card",
        location: "Cafeteria", dateLostFound: new Date("2026-09-18"), status: "ACTIVE",
      },
      {
        reporterId: user2.id, type: "FOUND", title: "AirPods Pro", category: "Electronics",
        description: "White AirPods Pro in case, found on a bench",
        location: "Sports Complex", dateLostFound: new Date("2026-09-21"), status: "ACTIVE",
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed complete. Admin:", admin.email, "| Users:", user1.email, user2.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
