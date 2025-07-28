import { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Flex,
  SelectField,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  View,
  useTheme,
} from '@aws-amplify/ui-react';
import { Schema } from '../../amplify/data/resource';

type TransactionFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Schema['Transaction']['type'], 'id' | 'createdAt' | 'updatedAt' | 'owner' | 'account' | 'category'>) => void;
  accounts: Schema['Account']['type'][];
  categories: Schema['Category']['type'][];
};

const TransactionForm = ({
  isOpen,
  onClose,
  onSave,
  accounts,
  categories,
}: TransactionFormProps) => {
  const { tokens } = useTheme();
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [accountId, setAccountId] = useState<string | undefined>(accounts[0]?.id);
  const [categoryId, setCategoryId] = useState<string | undefined>(categories[0]?.id);
  const [isOutflow, setIsOutflow] = useState(true);

  useEffect(() => {
    // if there's no account selected, or the selected one is no longer in the list, pick the first one.
    if (accounts.length > 0 && !accounts.some((a) => a.id === accountId)) {
      setAccountId(accounts[0].id);
    }
    // if there's no category selected, or the selected one is no longer in the list, pick the first one.
    if (categories.length > 0 && !categories.some((c) => c.id === categoryId)) {
      setCategoryId(categories[0].id);
    }
  }, [accounts, categories, accountId, categoryId]);

  const handleSave = () => {
    const absAmount = parseFloat(amount);
    if (payee && !isNaN(absAmount) && accountId) {
      // For inflows, category is optional (goes to "Ready to Assign")
      // For outflows, category is required.
      if (isOutflow && !categoryId) {
        alert('Please select a category for outflows.');
        return;
      }

      // The `date` from the form is 'YYYY-MM-DD'. The backend expects a full ISO 8601 string.
      // Appending T00:00:00 makes the Date constructor interpret it as local time
      // instead of UTC, which prevents off-by-one-day errors in some timezones.
      const dateInISO = new Date(`${date}T00:00:00`).toISOString();

      const finalAmount = isOutflow ? -absAmount : absAmount;

      const transactionData: Omit<Schema['Transaction']['type'], 'id' | 'createdAt' | 'updatedAt' | 'owner' | 'account' | 'category'> = {
        payee,
        amount: finalAmount,
        date: dateInISO,
        accountId,
      };

      if (isOutflow && categoryId) {
        transactionData.categoryId = categoryId;
      }

      onSave(transactionData);
      // Reset form
      setPayee('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsOutflow(true);
    } else {
      alert('Please fill all required fields.');
    }
  };

  const inflowCategoryId = 'ready-to-assign';

  if (!isOpen) {
    return null;
  }

  return (
    <View
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
    <Card
        variation="elevated"
        padding={tokens.space.large} // Changed from style prop to padding prop
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: '500px',
        }}
      >
        <Flex direction="column" gap={tokens.space.medium}>
          <TextField
            label="Payee"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            placeholder="e.g., Supermarket"
            isRequired
          />
          <ToggleButtonGroup
            value={isOutflow ? 'out' : 'in'}
            isExclusive
            onChange={(value) => setIsOutflow(value === 'out')}
            width="100%"
            justifyContent="stretch"
          >
            <ToggleButton value="out" flex="1">- Outflow</ToggleButton>
            <ToggleButton value="in" flex="1">+ Inflow</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            label="Amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            isRequired
            color={isOutflow ? tokens.colors.red[80] : tokens.colors.green[80]}
            style={{ fontWeight: 'bold' }}
          />
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            isRequired
          />
          <SelectField label="Account" value={accountId} onChange={(e) => setAccountId(e.target.value)} isRequired>
            {accounts.map((acc) => (<option key={acc.id} value={acc.id}>{acc.name}</option>))}
          </SelectField>
          <SelectField
            label="Category"
            value={isOutflow ? categoryId : inflowCategoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            isDisabled={!isOutflow}
            descriptiveText={!isOutflow ? "Inflows increase money 'Ready to Assign'." : "Select a budget category for the expense."}
          >
            {isOutflow ? (categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))) : (<option value={inflowCategoryId}>Ready to Assign</option>)}
          </SelectField>
          <Flex justifyContent="flex-end" gap={tokens.space.small}>
            <Button onClick={onClose} variation="link">Cancel</Button>
            <Button onClick={handleSave} variation="primary">Save</Button>
          </Flex>
        </Flex>
      </Card>
    </View>
  );
};

export default TransactionForm;