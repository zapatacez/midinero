import { useState } from 'react';
import {
  Button,
  Card,
  Flex,
  Heading,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Text,
  TextField,
  useTheme,
} from '@aws-amplify/ui-react';
import { Schema } from '../../amplify/data/resource';

type ManageViewProps = {
  accounts: Schema['Account']['type'][];
  transactions: Array<Pick<Schema['Transaction']['type'], 'accountId' | 'amount'>>;
  categories: Schema['Category']['type'][];
  onCreateAccount: (name: string, balance: number) => void;
  onCreateCategory: (name: string) => void;
};

const ManageView = ({
  accounts,
  categories,
  onCreateAccount,
  onCreateCategory,
  transactions,
}: ManageViewProps) => {
  const { tokens } = useTheme();
  const [newAccountName, setNewAccountName] = useState('');
  const [newStartingBalance, setNewStartingBalance] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  const getAccountBalance = (accountId: string) => {
    // Guard against transactions being undefined on initial render
    if (!transactions) {
      return 0;
    }
    return transactions
      .filter((t) => t.accountId === accountId)
      .reduce((acc, t) => acc + t.amount, 0);
  };

  const handleCreateAccount = () => {
    const balance = parseFloat(newStartingBalance || '0');
    if (newAccountName.trim() && !isNaN(balance)) {
      onCreateAccount(newAccountName.trim(), balance);
      setNewAccountName('');
      setNewStartingBalance('');
    }
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      onCreateCategory(newCategoryName.trim());
      setNewCategoryName('');
    }
  };

  return (
    <Flex direction="column" gap={tokens.space.large}>
      {/* Account Management */}
      <Card>
        <Heading level={3} paddingBottom={tokens.space.medium}>
          Accounts
        </Heading>
        <Table>
          <TableBody>
            {accounts.map((acc) => (
              <TableRow key={acc.id}>
                <TableCell>{acc.name}</TableCell>
                <TableCell textAlign="right" fontWeight="bold">
                  {getAccountBalance(acc.id).toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {accounts.length === 0 && <Text>No accounts yet. Add one to get started!</Text>}
        <form onSubmit={(e) => { e.preventDefault(); handleCreateAccount(); }}>
          <Flex marginTop={tokens.space.medium} gap={tokens.space.small}>
            <TextField
              label="New Account Name"
              labelHidden
              placeholder="New Account Name"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              isRequired
            />
            <TextField
              label="Starting Balance"
              labelHidden
              placeholder="Starting Balance"
              type="number"
              value={newStartingBalance}
              onChange={(e) => setNewStartingBalance(e.target.value)}
            />
            <Button type="submit" variation="primary">
              Add
            </Button>
          </Flex>
        </form>
      </Card>

      {/* Category Management */}
      <Card>
        <Heading level={3}>Categories</Heading>
        {categories.map((cat) => (
          <Text key={cat.id}>{cat.name}</Text>
        ))}
        {categories.length === 0 && <Text>No categories yet. Add some to build your budget.</Text>}
        <form onSubmit={(e) => { e.preventDefault(); handleCreateCategory(); }}>
          <Flex marginTop={tokens.space.medium} gap={tokens.space.small}>
            <TextField
              label="New Category Name"
              labelHidden
              placeholder="New Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              isRequired
            />
            <Button type="submit">Add</Button>
          </Flex>
        </form>
      </Card>
    </Flex>
  );
};

export default ManageView;