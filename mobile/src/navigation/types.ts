export type BottomTabParamList = {
  Dashboard: undefined;
  Invoices: undefined;
  Quotes: undefined;
  Jobs: undefined;
  More: undefined;
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  Expenses: undefined;
  AddExpense: undefined;
  Customers: undefined;
  Reports: undefined;
  Compliance: undefined;
  Settings: undefined;
  InvoiceDetail: { id: string };
  QuoteDetail: { id: string };
  NewQuote: undefined;
  JobDetail: { id: string };
  Referral: undefined;
};

export type RootStackParamList = BottomTabParamList & MoreStackParamList;
