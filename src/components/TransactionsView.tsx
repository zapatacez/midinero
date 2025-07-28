import { useState } from 'react';
import {
  Card,
  Flex,
  Heading,
  SelectField,
  Text,
  useTheme,
} from '@aws-amplify/ui-react';
import { Schema } from '../../amplify/data/resource';

type TransactionsViewProps = {
  transactions: Array<
    Pick<Schema['Transaction']['type'], 'id' | 'date' | 'payee' | 'amount'| 'accountId'> & {
      category?: { name: string } | null;
      account?: { name: string } | null;
    }
  >;
  accounts: Schema['Account']['type'][];
};

const TransactionsView = ({
  transactions,
  accounts,
}: TransactionsViewProps) => {
  const { tokens } = useTheme();
  const [selectedAccountId, setSelectedAccountId] = useState('all');

  const filteredTransactions =
    selectedAccountId === 'all'
      ? transactions
      : transactions.filter((t) => t.accountId === selectedAccountId);

  // Sort transactions by date, most recent first
  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Flex direction="column" gap={tokens.space.medium}>
      <Heading level={3}>Transactions</Heading>
      <SelectField
        label="Filter by account"
        labelHidden
        value={selectedAccountId}
        onChange={(e) => setSelectedAccountId(e.target.value)}
      >
        <option value="all">All Accounts</option>
        {accounts.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.name}
          </option>
        ))}
      </SelectField>

      {sortedTransactions.length === 0 ? (
        <Text>No transactions yet.</Text>
      ) : (
        <Flex direction="column" gap={tokens.space.small}>
          {sortedTransactions.map((transaction) => (
            <Card key={transaction.id} variation="outlined">
              <Flex justifyContent="space-between" alignItems="center">
                <Flex direction="column">
                  <Text fontWeight="bold">{transaction.payee}</Text>
                  <Text fontSize={tokens.fontSizes.small} color={tokens.colors.font.secondary}>
                    {transaction.category?.name ?? 'Ready to Assign'}
                  </Text>
                  <Text fontSize={tokens.fontSizes.small} color={tokens.colors.font.tertiary}>
                    {new Date(transaction.date).toLocaleDateString()}
                  </Text>
                </Flex>
                <Text fontWeight="bold" color={ transaction.amount < 0 ? tokens.colors.font.error : tokens.colors.font.success }>
                  {transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </Text>
              </Flex>
            </Card>
          ))}
        </Flex>
      )}
    </Flex>
  );
};

export default TransactionsView;