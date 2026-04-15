import { PrismaClient } from "@prisma/client"; const prisma = new PrismaClient(); async function main() { const count = await prisma.variety.count(); console.log("Variety count:", count); } main();
