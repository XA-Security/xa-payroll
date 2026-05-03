import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer'
import { format } from 'date-fns'

Font.register({
  family: 'Helvetica',
  src: 'https://fonts.googleapis.com/css2?family=Helvetica',
})

interface PayrollEntry {
  date: {
    formatted: string
    timestamp: number
  }
  start_time: string
  end_time: string
  hours: {
    regular: number
    special: number
    overtime: number
    total: number
    cost: number
    rate: number | null
    location: { name: string }
  }
  in_location_name: string
}

interface PayrollPdfTemplateProps {
  employee: {
    name: string
    eid: string
    email: string
  }
  entries: PayrollEntry[]
  startDate: string
  endDate: string
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 20,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 12,
    color: '#64748b',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#f1f5f9',
    padding: 8,
    marginBottom: 10,
    color: '#1e293b',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 9,
    color: '#64748b',
    width: 100,
  },
  value: {
    fontSize: 9,
    color: '#1e293b',
    flex: 1,
    fontWeight: 500,
  },
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  tableRow: {
    display: 'table-row',
  },
  tableHeader: {
    display: 'table-row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  tableCell: {
    padding: 6,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    flex: 1,
  },
  tableCellHeader: {
    padding: 6,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e293b',
    borderRightWidth: 1,
    borderRightColor: '#cbd5e1',
    flex: 1,
  },
  tableCellRight: {
    padding: 6,
    fontSize: 8,
    textAlign: 'right' as const,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    flex: 0.8,
  },
  tableCellRightHeader: {
    padding: 6,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right' as const,
    borderRightWidth: 1,
    borderRightColor: '#cbd5e1',
    flex: 0.8,
  },
  summaryRow: {
    display: 'table-row',
    backgroundColor: '#f8fafc',
    borderTopWidth: 2,
    borderTopColor: '#cbd5e1',
  },
  summaryCell: {
    padding: 6,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right' as const,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    textAlign: 'center' as const,
    fontSize: 8,
    color: '#64748b',
  },
})

export function PayrollPdfTemplate({
  employee,
  entries,
  startDate,
  endDate,
}: PayrollPdfTemplateProps) {
  const totals = entries.reduce(
    (acc, entry) => ({
      regular: acc.regular + entry.hours.regular,
      special: acc.special + entry.hours.special,
      overtime: acc.overtime + entry.hours.overtime,
      total: acc.total + entry.hours.total,
      cost: acc.cost + entry.hours.cost,
    }),
    { regular: 0, special: 0, overtime: 0, total: 0, cost: 0 }
  )

  const sortedEntries = [...entries].sort((a, b) => a.date.timestamp - b.date.timestamp)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>XA Security Group</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.pageTitle}>Payroll Report</Text>
        </View>

        {/* Employee Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employee Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{employee.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Employee ID:</Text>
            <Text style={styles.value}>{employee.eid}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{employee.email}</Text>
          </View>
        </View>

        {/* Pay Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pay Period</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Period:</Text>
            <Text style={styles.value}>
              {format(new Date(startDate), 'MMM d, yyyy')} - {format(new Date(endDate), 'MMM d, yyyy')}
            </Text>
          </View>
        </View>

        {/* Payroll Entries Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payroll Entries</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellHeader}>Date</Text>
              <Text style={styles.tableCellHeader}>Time</Text>
              <Text style={styles.tableCellHeader}>Location</Text>
              <Text style={styles.tableCellRightHeader}>Reg Hrs</Text>
              <Text style={styles.tableCellRightHeader}>OT Hrs</Text>
              <Text style={styles.tableCellRightHeader}>STAT Hrs</Text>
              <Text style={styles.tableCellRightHeader}>Total</Text>
              <Text style={styles.tableCellRightHeader}>Rate</Text>
              <Text style={styles.tableCellRightHeader}>Cost</Text>
            </View>

            {/* Table Rows */}
            {sortedEntries.map((entry, idx) => (
              <View style={styles.tableRow} key={`${entry.date.timestamp}-${idx}`}>
                <Text style={styles.tableCell}>{format(new Date(entry.date.timestamp * 1000), 'MMM d')}</Text>
                <Text style={styles.tableCell}>
                  {entry.start_time} - {entry.end_time}
                </Text>
                <Text style={styles.tableCell}>{entry.hours.location?.name || entry.in_location_name || '-'}</Text>
                <Text style={styles.tableCellRight}>{entry.hours.regular.toFixed(2)}</Text>
                <Text style={styles.tableCellRight}>{entry.hours.overtime.toFixed(2)}</Text>
                <Text style={styles.tableCellRight}>{entry.hours.special.toFixed(2)}</Text>
                <Text style={styles.tableCellRight}>{entry.hours.total.toFixed(2)}</Text>
                <Text style={styles.tableCellRight}>
                  {entry.hours.rate ? `$${entry.hours.rate.toFixed(2)}` : '-'}
                </Text>
                <Text style={styles.tableCellRight}>${entry.hours.cost.toFixed(2)}</Text>
              </View>
            ))}

            {/* Summary Row */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryCell} colSpan={3}>
                TOTAL
              </Text>
              <Text style={styles.summaryCell}>{totals.regular.toFixed(2)}</Text>
              <Text style={styles.summaryCell}>{totals.overtime.toFixed(2)}</Text>
              <Text style={styles.summaryCell}>{totals.special.toFixed(2)}</Text>
              <Text style={styles.summaryCell}>{totals.total.toFixed(2)}</Text>
              <Text style={styles.summaryCell}></Text>
              <Text style={styles.summaryCell}>${totals.cost.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>© XA Security Group - Confidential</Text>
          <Text>Generated on {format(new Date(), 'MMM d, yyyy HH:mm')}</Text>
        </View>
      </Page>
    </Document>
  )
}
