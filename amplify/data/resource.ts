import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  // Account to hold cash (e.g., Checking, Savings)
  Account: a
    .model({
      name: a.string().required(),
      // The balance will be calculated on the client-side by summing up all associated transactions.
      transactions: a.hasMany("Transaction", "accountId"),
    })
    .authorization((allow) => [allow.owner()]),

  // A master category created by the user (e.g., Rent, Groceries)
  Category: a
    .model({
      name: a.string().required(),
      // A category can have many transactions over time.
      transactions: a.hasMany("Transaction", "categoryId"),
      // A category has a budget entry for each month.
      monthlyBudgets: a.hasMany("MonthlyBudget", "categoryId"),
    })
    .authorization((allow) => [allow.owner()]),

  // Represents the budgeted amount for a category in a specific month.
  MonthlyBudget: a
    .model({
      year: a.integer().required(),
      month: a.integer().required(), // e.g., 1 for January, 2 for February
      assigned: a.float().required().default(0),
      categoryId: a.id().required(),
      category: a.belongsTo("Category", "categoryId"),
    })
    .authorization((allow) => [allow.owner()]),

  // An income or expense transaction.
  Transaction: a
    .model({
      date: a.datetime().required(),
      payee: a.string().required(),
      // Amount is positive for inflows (income) and negative for outflows (expenses).
      amount: a.float().required(),
      accountId: a.id().required(),
      account: a.belongsTo("Account", "accountId"),
      // Category is optional. Inflows might not have a category and contribute to "Ready to Assign".
      categoryId: a.id(),
      category: a.belongsTo("Category", "categoryId"),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});