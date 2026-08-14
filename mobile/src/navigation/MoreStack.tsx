import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreMenuScreen } from '../screens/MoreMenuScreen';
import { ExpensesScreen } from '../screens/ExpensesScreen';
import { AddExpenseScreen } from '../screens/AddExpenseScreen';
import { CustomersScreen } from '../screens/CustomersScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { ComplianceScreen } from '../screens/ComplianceScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { InvoiceDetailScreen } from '../screens/InvoiceDetailScreen';
import { QuoteDetailScreen } from '../screens/QuoteDetailScreen';
import { NewQuoteScreen } from '../screens/NewQuoteScreen';
import { JobDetailScreen } from '../screens/JobDetailScreen';
import { ReferralScreen } from '../screens/ReferralScreen';
import type { MoreStackParamList } from './types';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: 'More' }} />
      <Stack.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'Expenses' }} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Add Expense', presentation: 'modal' }} />
      <Stack.Screen name="Customers" component={CustomersScreen} options={{ title: 'Customers' }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
      <Stack.Screen name="Compliance" component={ComplianceScreen} options={{ title: 'Compliance' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: 'Invoice' }} />
      <Stack.Screen name="QuoteDetail" component={QuoteDetailScreen} options={{ title: 'Quote' }} />
      <Stack.Screen name="NewQuote" component={NewQuoteScreen} options={{ title: 'New Quote', presentation: 'modal' }} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Details' }} />
      <Stack.Screen name="Referral" component={ReferralScreen} options={{ title: 'Referral Program' }} />
    </Stack.Navigator>
  );
}
