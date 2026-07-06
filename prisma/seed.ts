import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function atHour(daysAgo: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
}

async function main() {
  await prisma.entry.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.factoryStock.deleteMany();

  const contacts = await Promise.all([
    prisma.contact.create({
      data: { name: "Rashid Textiles", role: "knitter", phone: "+92 300 1234567" },
    }),
    prisma.contact.create({
      data: { name: "Al-Noor Knitting Works", role: "knitter", phone: "+92 321 9876543" },
    }),
    prisma.contact.create({
      data: { name: "Zainab Knitters", role: "knitter", phone: "+92 333 4567890" },
    }),
    prisma.contact.create({
      data: { name: "Bright Dye Works", role: "dyer", phone: "+92 301 2223344" },
    }),
    prisma.contact.create({
      data: { name: "Indus Dyeing Co.", role: "dyer", phone: "+92 315 5556677" },
    }),
    prisma.contact.create({
      data: { name: "Crescent Dye House", role: "dyer", phone: undefined },
    }),
  ]);

  const [rashid, alNoor, zainab, bright, indus, crescent] = contacts;

  type EntryInput = {
    contactId: string;
    type: "sent" | "received";
    unit: "bags" | "kg";
    quantity: number;
    note?: string;
    createdAt: Date;
  };

  const entries: EntryInput[] = [];

  // 7 days of history (6 days ago -> today)
  entries.push(
    { contactId: rashid.id, type: "sent", unit: "kg", quantity: 120, note: "Raw yarn for winter batch", createdAt: atHour(6, 9, 15) },
    { contactId: bright.id, type: "sent", unit: "bags", quantity: 40, note: "Undyed bags, navy order", createdAt: atHour(6, 10, 0) },
    { contactId: alNoor.id, type: "sent", unit: "kg", quantity: 80, createdAt: atHour(6, 11, 30) },
    { contactId: indus.id, type: "sent", unit: "bags", quantity: 25, createdAt: atHour(6, 14, 0) },
  );

  entries.push(
    { contactId: rashid.id, type: "received", unit: "kg", quantity: 45, note: "Partial return", createdAt: atHour(5, 9, 0) },
    { contactId: bright.id, type: "received", unit: "bags", quantity: 15, createdAt: atHour(5, 13, 20) },
    { contactId: zainab.id, type: "sent", unit: "kg", quantity: 60, createdAt: atHour(5, 15, 45) },
    { contactId: crescent.id, type: "sent", unit: "bags", quantity: 30, createdAt: atHour(5, 16, 10) },
  );

  entries.push(
    { contactId: alNoor.id, type: "received", unit: "kg", quantity: 30, createdAt: atHour(4, 8, 40) },
    { contactId: indus.id, type: "received", unit: "bags", quantity: 10, note: "Colour match approved", createdAt: atHour(4, 12, 0) },
    { contactId: rashid.id, type: "sent", unit: "kg", quantity: 90, createdAt: atHour(4, 14, 30) },
    { contactId: bright.id, type: "sent", unit: "bags", quantity: 20, createdAt: atHour(4, 17, 0) },
  );

  entries.push(
    { contactId: zainab.id, type: "received", unit: "kg", quantity: 25, createdAt: atHour(3, 9, 50) },
    { contactId: crescent.id, type: "received", unit: "bags", quantity: 12, createdAt: atHour(3, 11, 15) },
    { contactId: alNoor.id, type: "sent", unit: "kg", quantity: 55, note: "Rush order", createdAt: atHour(3, 13, 0) },
    { contactId: indus.id, type: "sent", unit: "bags", quantity: 35, createdAt: atHour(3, 16, 40) },
  );

  entries.push(
    { contactId: rashid.id, type: "received", unit: "kg", quantity: 60, createdAt: atHour(2, 9, 0) },
    { contactId: bright.id, type: "received", unit: "bags", quantity: 22, createdAt: atHour(2, 10, 30) },
    { contactId: zainab.id, type: "sent", unit: "kg", quantity: 40, createdAt: atHour(2, 15, 0) },
    { contactId: crescent.id, type: "sent", unit: "bags", quantity: 18, createdAt: atHour(2, 17, 20) },
  );

  // yesterday
  entries.push(
    { contactId: alNoor.id, type: "received", unit: "kg", quantity: 35, createdAt: atHour(1, 8, 45) },
    { contactId: indus.id, type: "received", unit: "bags", quantity: 20, createdAt: atHour(1, 10, 0) },
    { contactId: rashid.id, type: "sent", unit: "kg", quantity: 75, note: "Restock", createdAt: atHour(1, 12, 30) },
    { contactId: bright.id, type: "sent", unit: "bags", quantity: 28, createdAt: atHour(1, 14, 45) },
    { contactId: zainab.id, type: "received", unit: "kg", quantity: 20, createdAt: atHour(1, 16, 0) },
  );

  // today
  entries.push(
    { contactId: rashid.id, type: "sent", unit: "bags", quantity: 32, note: "Morning dispatch", createdAt: atHour(0, 8, 30) },
    { contactId: crescent.id, type: "received", unit: "bags", quantity: 14, createdAt: atHour(0, 9, 15) },
    { contactId: alNoor.id, type: "sent", unit: "kg", quantity: 50, createdAt: atHour(0, 10, 0) },
    { contactId: bright.id, type: "received", unit: "kg", quantity: 38, note: "Dyed yarn back", createdAt: atHour(0, 11, 0) },
    { contactId: indus.id, type: "sent", unit: "bags", quantity: 16, createdAt: atHour(0, 11, 45) },
  );

  for (const entry of entries) {
    await prisma.entry.create({ data: entry });
  }

  await prisma.checklistItem.createMany({
    data: [
      { task: "Follow up with Bright Dye Works on navy order", meta: "40 bags sent 6 days ago", done: false, dueDate: atHour(-1, 17, 0) },
      { task: "Collect pending kg from Al-Noor Knitting Works", meta: "Balance outstanding", done: false, dueDate: atHour(-2, 12, 0) },
      { task: "Weigh and log this morning's dispatch", done: true },
      { task: "Call Indus Dyeing Co. about colour match", meta: "+92 315 5556677", done: false },
      { task: "Reconcile weekly ledger totals", done: false, dueDate: atHour(-3, 9, 0) },
    ],
  });

  const factoryStock = await Promise.all([
    prisma.factoryStock.create({
      data: { yarnType: "Cotton 30s", bags: 100, rate: 850, boughtAt: daysAgo(20) },
    }),
    prisma.factoryStock.create({
      data: { yarnType: "Cotton 30s", bags: 60, rate: 900, boughtAt: daysAgo(5) },
    }),
    prisma.factoryStock.create({
      data: { yarnType: "Polyester 40s", bags: 80, rate: 620, boughtAt: daysAgo(12) },
    }),
    prisma.factoryStock.create({
      data: { yarnType: "Acrylic Blend", bags: 45, rate: 540, boughtAt: daysAgo(8) },
    }),
    prisma.factoryStock.create({
      data: { yarnType: "Merino Wool", bags: 30, rate: 1500, boughtAt: daysAgo(3) },
    }),
  ]);

  console.log(
    `Seeded ${contacts.length} contacts, ${entries.length} entries, and ${factoryStock.length} factory stock lots.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
