class InvoiceLogger {
  log(...args: unknown[]) {
    console.log('[InvoiceLogger]', ...args)
  }

  error(...args: unknown[]) {
    console.error('[InvoiceLogger]', ...args)
  }

  debug(...args: unknown[]) {
    if (process.env.DEBUG) {
      console.log('[InvoiceLogger:Debug]', ...args)
    }
  }
}

export const invoiceLogger = new InvoiceLogger()
