import { useState, useEffect, useMemo } from 'react';
import { useAuthenticator, View, Text, Heading, Card, Flex, Table, TableHead, TableRow, TableCell, TableBody, useTheme, Button } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import TransactionForm from './components/TransactionForm';
import ManageView from './components/ManageView';
import TransactionsView from './components/TransactionsView';

const client = generateClient<Schema>();

// Mock data for now - we will replace this with real data from the backend later.
const mockCategories = [
  { id: '1', name: 'Rent', assigned: 1200, available: 1200 },
  { id: '2', name: 'Groceries', assigned: 400, available: 350.50 },
  { id: '3', name: 'Water', assigned: 75, available: 75 },
  { id: '4', name: 'Internet', assigned: 60, available: 0 },
];

const BudgetView = () => {
  const { tokens } = useTheme();
  return (
    <>
      {/* "Ready to Assign" Section */}
      <Card variation="elevated" style={{ textAlign: 'center', margin: `${tokens.space.large} 0` }}>
        <Text fontSize={tokens.fontSizes.large}>Ready to Assign</Text>
        <Heading level={2} style={{ color: tokens.colors.green[60] }}>
          $1,234.56
        </Heading>
      </Card>

      {/* Budget Categories Section */}
      <Heading level={3} style={{ marginBottom: tokens.space.small }}>Budget</Heading>
      <Table
        highlightOnHover
        variation="striped"
        size="small"
      >
        <TableHead>
          <TableRow>
            <TableCell as="th">Category</TableCell>
            <TableCell as="th" textAlign="right">Assigned</TableCell>
            <TableCell as="th" textAlign="right">Available</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {mockCategories.map((category) => (
            <TableRow key={category.id}>
              <TableCell fontWeight="bold">{category.name}</TableCell>
              <TableCell textAlign="right">
                ${category.assigned.toFixed(2)}
              </TableCell>
              <TableCell
                textAlign="right"
                color={category.available > 0 ? tokens.colors.green[80] : tokens.colors.red[80]}
                fontWeight="bold"
              >
                ${category.available.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

function App() {
  const { tokens } = useTheme();
  const { signOut } = useAuthenticator((context) => [context.user]);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  // We will use these state variables later to hold our data.
  const [accounts, setAccounts] = useState<Array<Schema["Account"]["type"]>>([]);
  const [categories, setCategories] = useState<Array<Schema["Category"]["type"]>>([]);
  const [transactions, setTransactions] = useState<Array<Schema["Transaction"]["type"]>>([]);
  // const [monthlyBudgets, setMonthlyBudgets] = useState<Array<Schema["MonthlyBudget"]["type"]>>([]);
  const [activeView, setActiveView] = useState('budget');

  useEffect(() => {
    // Subscribe to data changes. This will keep the UI in sync.
    const accountsSub = client.models.Account.observeQuery().subscribe({
      next: (data) => {
        setAccounts([...data.items]);
        // If a user has no accounts, guide them to the manage page.
        if (data.items.length === 0) {
          setActiveView('manage');
        }
      }
    });

    const categoriesSub = client.models.Category.observeQuery().subscribe({
      next: (data) => setCategories([...data.items]),
    });

    const transactionsSub = client.models.Transaction.observeQuery({
      // Eagerly load the related account and category names
      selectionSet: [
        'id', 'date', 'payee', 'amount', 'accountId', 'categoryId',
        'account.name', 'category.name'
      ],
    }).subscribe({
      next: (data) => setTransactions([...data.items]),
    });

    // Unsubscribe when the component unmounts
    return () => {
      accountsSub.unsubscribe();
      categoriesSub.unsubscribe();
      transactionsSub.unsubscribe();
    }
  }, []);

  const handleSaveTransaction = async (transaction: Omit<Schema['Transaction']['type'], 'id' | 'createdAt' | 'updatedAt' | 'owner' | 'account' | 'category'>) => {
    try {
      const { errors } = await client.models.Transaction.create(transaction);
      if (errors) {
        throw new Error(JSON.stringify(errors));
      }
      setShowTransactionForm(false);
    } catch (e) {
      console.error('Failed to create transaction:', e);
      alert('Error: Could not save transaction. Check the developer console for more information.');
    }
  };

  const handleCreateAccount = async (name: string, balance: number) => {
    try {
      // 1. Create the account itself
      const { data: newAccount, errors: accountErrors } = await client.models.Account.create({ name });
      if (accountErrors) {
        throw new Error(JSON.stringify(accountErrors));
      }

      // 2. If the account was created successfully and a balance was provided, create the transaction
      if (newAccount && balance !== 0) {
        const { errors: transactionErrors } = await client.models.Transaction.create({
          amount: balance,
          date: new Date().toISOString(),
          payee: 'Starting Balance',
          accountId: newAccount.id,
        });
        if (transactionErrors) {
          throw new Error(JSON.stringify(transactionErrors));
        }
      }
    } catch (e) {
      console.error('Failed to create account and starting balance:', e);
      alert('Error: Could not create account. Check the developer console for more information.');
    }
  };
  const handleCreateCategory = (name: string) => client.models.Category.create({ name });

  return (
    <View style={{ maxWidth: '600px', margin: '0 auto' }}>
      <View style={{ padding: tokens.space.medium, paddingBottom: '80px' /* Space for nav bar */ }}>
        <Flex direction="row" justifyContent="space-between" alignItems="center">
          <Heading level={1}>Mi Dinero</Heading>
          <button onClick={signOut} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: tokens.colors.blue[60] }}>Sign out</button>
        </Flex>

        {activeView === 'budget' && <BudgetView />}
        {activeView === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            accounts={accounts}
          />
        )}
        {activeView === 'manage' && (
          <ManageView
            accounts={accounts}
            transactions={transactions}
            categories={categories}
            onCreateAccount={handleCreateAccount}
            onCreateCategory={handleCreateCategory}
          />
        )}

        <TransactionForm
          isOpen={showTransactionForm}
          onClose={() => setShowTransactionForm(false)}
          onSave={handleSaveTransaction}
          accounts={accounts}
          categories={categories}
        />

      </View>

      {/* Floating Action Button to Add Transaction */}
      <Button
        variation="primary"
        onClick={() => setShowTransactionForm(true)}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          fontSize: '24px',
          lineHeight: '24px',
          padding: 0,
        }}
      >+</Button>

      {/* Bottom Navigation */}
      <Flex
        as="nav"
        direction="row"
        justifyContent="space-around"
        alignItems="center"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: '600px',
          margin: '0 auto',
          borderTop: `1px solid ${tokens.colors.neutral[40]}`,
          backgroundColor: tokens.colors.background.primary,
          padding: `${tokens.space.small} 0`,
        }}
      >
        <Button variation={activeView === 'budget' ? 'primary' : 'link'} onClick={() => setActiveView('budget')}>Budget</Button>
        <Button variation={activeView === 'transactions' ? 'primary' : 'link'} onClick={() => setActiveView('transactions')}>Transactions</Button>
        <Button variation={activeView === 'manage' ? 'primary' : 'link'} onClick={() => setActiveView('manage')}>Manage</Button>
      </Flex>
    </View>
  );
}

export default App;
