import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const demoUser = {
  username: 'demo',
  email: 'demo@example.com',
  password: 'DemoUser123',
};

const expenseTemplates = [
  ['Grocery run', 86.42, 'Groceries', 'Weekly groceries from the local market'],
  ['Coffee shop', 6.75, 'Food', 'Latte and breakfast pastry'],
  ['Bus pass', 32.0, 'Transportation', 'Reloaded transit card'],
  ['Gas station', 48.3, 'Transportation', 'Fuel for the week'],
  ['Movie night', 28.5, 'Entertainment', 'Two tickets and snacks'],
  ['Streaming subscription', 15.99, 'Subscriptions', 'Monthly video streaming plan'],
  ['Electric bill', 119.84, 'Bills', 'Monthly electricity payment'],
  ['Phone bill', 64.0, 'Bills', 'Mobile phone plan'],
  ['Pharmacy pickup', 22.18, 'Health', 'Cold medicine and vitamins'],
  ['Doctor copay', 35.0, 'Health', 'Clinic visit copay'],
  ['Textbook rental', 41.25, 'Education', 'Course material rental'],
  ['Online course', 19.99, 'Education', 'Monthly learning subscription'],
  ['Weekend train', 54.5, 'Travel', 'Round trip train ticket'],
  ['Hotel deposit', 142.0, 'Travel', 'Deposit for weekend stay'],
  ['Lunch with classmate', 17.35, 'Food', 'Campus lunch'],
  ['Dinner takeout', 24.8, 'Food', 'Takeout after a long day'],
  ['New hoodie', 58.99, 'Shopping', 'Clothing purchase'],
  ['Desk supplies', 27.46, 'Shopping', 'Notebook, pens, and folders'],
  ['Internet bill', 72.5, 'Bills', 'Home internet service'],
  ['Gym membership', 39.99, 'Health', 'Monthly gym membership'],
  ['Music subscription', 10.99, 'Subscriptions', 'Monthly music plan'],
  ['Rideshare', 18.65, 'Transportation', 'Ride home from downtown'],
  ['Concert ticket', 76.0, 'Entertainment', 'Live music ticket'],
  ['Museum visit', 18.0, 'Entertainment', 'Weekend museum admission'],
  ['Produce market', 34.2, 'Groceries', 'Fresh produce and pantry items'],
  ['Bakery stop', 9.4, 'Food', 'Bread and coffee'],
  ['Parking garage', 12.0, 'Transportation', 'Downtown parking'],
  ['Software subscription', 12.99, 'Subscriptions', 'Productivity app subscription'],
  ['Lab fee', 25.0, 'Education', 'Class lab materials fee'],
  ['Airport snacks', 16.7, 'Travel', 'Snacks before flight'],
] as const;

function dateDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

async function main() {
  const existingDemoUser = await prisma.user.findUnique({
    where: { email: demoUser.email },
  });

  if (existingDemoUser) {
    await prisma.user.delete({
      where: { id: existingDemoUser.id },
    });
  }

  const hashedPassword = await bcrypt.hash(demoUser.password, 10);

  const user = await prisma.user.create({
    data: {
      username: demoUser.username,
      email: demoUser.email,
      password: hashedPassword,
    },
  });

  const expenses = Array.from({ length: 90 }, (_, index) => {
    const [title, baseAmount, category, description] =
      expenseTemplates[index % expenseTemplates.length];
    const cycle = Math.floor(index / expenseTemplates.length);
    const amountAdjustment = (index % 7) * 1.35 + cycle * 2.5;

    return {
      userId: user.id,
      title,
      amount: Number((baseAmount + amountAdjustment).toFixed(2)),
      category,
      date: dateDaysAgo(index),
      description,
    };
  });

  await prisma.expense.createMany({
    data: expenses,
  });

  console.log(`Seeded ${user.email} with ${expenses.length} expenses.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
