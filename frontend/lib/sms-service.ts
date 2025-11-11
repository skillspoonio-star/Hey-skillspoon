// SMS Service for sending bills to customers
export interface BillData {
  sessionId: string
  tableNumber: number
  customerName: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  subtotal: number
  tax: number
  total: number
  phoneNumber: string
}

export class SMSService {
  // In a real application, this would integrate with an SMS API like Twilio, AWS SNS, etc.
  async sendBill(billData: BillData): Promise<boolean> {
    try {
      // Validate phone number
      const cleanPhone = billData.phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        throw new Error('Invalid phone number: must be exactly 10 digits');
      }
      billData.phoneNumber = cleanPhone;

      // Simulate SMS sending delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Format bill message
      const message = this.formatBillMessage(billData)
      

      // In production, you would call your SMS API here
      // Example: await twilioClient.messages.create({ to: billData.phoneNumber, body: message })

      // Store bill in localStorage for demo purposes
      const bills = JSON.parse(localStorage.getItem("sent_bills") || "[]")
      bills.push({
        ...billData,
        sentAt: new Date().toISOString(),
        message,
      })
      localStorage.setItem("sent_bills", JSON.stringify(bills))

      return true
    } catch (error) {
      console.error("[v0] Error sending SMS:", error)
      return false
    }
  }

  private formatBillMessage(billData: BillData): string {
    const itemsList = billData.items
      .map((item) => `${item.quantity}x ${item.name} - ₹${item.price * item.quantity}`)
      .join("\n")

    return `
Hey Paytm - Bill for Table ${billData.tableNumber}
Session: ${billData.sessionId}
Customer: ${billData.customerName}

Items:
${itemsList}

Subtotal: ₹${billData.subtotal}
Tax (5%): ₹${billData.tax}
Total: ₹${billData.total}

Thank you for dining with us!
    `.trim()
  }
}

export const smsService = new SMSService()
