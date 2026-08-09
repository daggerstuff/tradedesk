// @ts-nocheck
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 4,
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  billTo: {
    flex: 1,
  },
  dates: {
    flex: 1,
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 9,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: 12,
    color: '#1e293b',
    marginBottom: 2,
  },
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colPrice: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right', fontWeight: 'bold' },
  totals: {
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  totalRow: {
    flexDirection: 'row',
    width: 200,
    paddingVertical: 4,
  },
  totalLabel: {
    flex: 1,
    textAlign: 'left',
    color: '#64748b',
    fontSize: 11,
  },
  totalValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
  },
  grandTotal: {
    flexDirection: 'row',
    width: 200,
    paddingVertical: 8,
    borderTopWidth: 2,
    borderTopColor: '#1e293b',
    marginTop: 4,
  },
  grandTotalText: {
    flex: 1,
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: 14,
    color: '#1e293b',
  },
  grandTotalValue: {
    flex: 1,
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 14,
    color: '#1e293b',
  },
  notes: {
    marginTop: 30,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 9,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#94a3b8',
  },
});

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface InvoicePdfProps {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  companyName: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  items: InvoiceItem[];
}

export default function InvoicePdf({
  invoiceNumber,
  issueDate,
  dueDate,
  subtotal,
  taxRate,
  taxAmount,
  total,
  notes,
  companyName,
  customerName,
  customerEmail,
  customerAddress,
  items,
}: InvoicePdfProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{companyName || 'TradeDesk'}</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{invoiceNumber}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.billTo}>
            <Text style={styles.label}>Bill To</Text>
            <Text style={styles.value}>{customerName || 'Customer'}</Text>
            {customerEmail && <Text style={styles.value}>{customerEmail}</Text>}
            {customerAddress && <Text style={styles.value}>{customerAddress}</Text>}
          </View>
          <View style={styles.dates}>
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>Issue Date</Text>
              <Text style={styles.value}>{issueDate}</Text>
            </View>
            <View>
              <Text style={styles.label}>Due Date</Text>
              <Text style={styles.value}>{dueDate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, styles.tableHeaderText]}>Description</Text>
            <Text style={[styles.colQty, styles.tableHeaderText]}>Qty</Text>
            <Text style={[styles.colPrice, styles.tableHeaderText]}>Unit Price</Text>
            <Text style={[styles.colTotal, styles.tableHeaderText]}>Total</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>${Number(item.unit_price).toFixed(2)}</Text>
              <Text style={styles.colTotal}>${Number(item.total).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
          </View>
          {taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({taxRate}%)</Text>
              <Text style={styles.totalValue}>${taxAmount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalText}>Total Due</Text>
            <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        {notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Thank you for your business! • Generated by TradeDesk
        </Text>
      </Page>
    </Document>
  );
}
