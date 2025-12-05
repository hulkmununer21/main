import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CreditCard, Zap, Droplet, Flame, FileText, CheckCircle, AlertCircle } from "lucide-react";

const PaymentsBilling = () => {
  const payments = [
    {
      lodger: "Tom Brown",
      property: "789 High St",
      room: "Room 5",
      type: "Rent",
      amount: "£750.00",
      dueDate: "2024-12-01",
      paidDate: "2024-12-01",
      status: "Paid",
      method: "Bank Transfer"
    },
    {
      lodger: "Lisa Green",
      property: "123 Main St",
      room: "Room 2",
      type: "Rent",
      amount: "£850.00",
      dueDate: "2024-12-01",
      paidDate: null,
      status: "Overdue",
      method: null
    },
    {
      lodger: "Mark Johnson",
      property: "456 River Rd",
      room: "Room 3",
      type: "Deposit",
      amount: "£500.00",
      dueDate: "2024-11-15",
      paidDate: "2024-11-14",
      status: "Paid",
      method: "Card"
    },
    {
      lodger: "Sophie Chen",
      property: "321 Park Ave",
      room: "Room 1",
      type: "Utilities",
      amount: "£120.00",
      dueDate: "2024-12-05",
      paidDate: null,
      status: "Pending",
      method: null
    },
  ];

  const meterReadings = [
    {
      property: "123 Main St",
      type: "Electricity",
      lastReading: "45678",
      date: "2024-11-30",
      nextDue: "2024-12-30",
      usage: "245 kWh",
      cost: "£58.80"
    },
    {
      property: "456 River Rd",
      type: "Gas",
      lastReading: "12345",
      date: "2024-11-28",
      nextDue: "2024-12-28",
      usage: "180 units",
      cost: "£45.00"
    },
    {
      property: "789 High St",
      type: "Water",
      lastReading: "98765",
      date: "2024-11-25",
      nextDue: "2024-12-25",
      usage: "15 m³",
      cost: "£35.50"
    },
  ];

  const totalReceived = payments
    .filter(p => p.status === "Paid")
    .reduce((sum, p) => sum + parseFloat(p.amount.replace("£", "").replace(",", "")), 0);

  const totalOutstanding = payments
    .filter(p => p.status !== "Paid")
    .reduce((sum, p) => sum + parseFloat(p.amount.replace("£", "").replace(",", "")), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Payments & Billing</h2>
        <p className="text-muted-foreground">Manage rent, deposits, utilities, and payment tracking</p>
      </div>

      {/* Financial Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-3 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">£{totalReceived.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Received This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-destructive/10 p-3 rounded-full">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">£{totalOutstanding.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">£125,000</p>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 p-3 rounded-full">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{payments.length}</p>
                <p className="text-sm text-muted-foreground">Active Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Tracking */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Payment Tracking</CardTitle>
              <CardDescription>Monitor rent, deposits, and utility payments</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Generate Invoice
              </Button>
              <Button>
                <DollarSign className="w-4 h-4 mr-2" />
                Add Payment
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payments.map((payment, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{payment.lodger}</h4>
                        <Badge variant="outline">{payment.type}</Badge>
                        <Badge variant={
                          payment.status === "Paid" ? "default" :
                          payment.status === "Overdue" ? "destructive" :
                          "secondary"
                        }>
                          {payment.status}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                        <p><span className="font-medium text-foreground">Property:</span> {payment.property}</p>
                        <p><span className="font-medium text-foreground">Room:</span> {payment.room}</p>
                        <p><span className="font-medium text-foreground">Amount:</span> <span className="text-lg font-bold text-primary">{payment.amount}</span></p>
                        <p><span className="font-medium text-foreground">Due:</span> {payment.dueDate}</p>
                        {payment.paidDate && (
                          <>
                            <p><span className="font-medium text-foreground">Paid:</span> {payment.paidDate}</p>
                            <p><span className="font-medium text-foreground">Method:</span> {payment.method}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {payment.status === "Paid" ? (
                        <>
                          <Button size="sm" variant="outline">View Receipt</Button>
                          <Button size="sm" variant="ghost">Download</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm">Record Payment</Button>
                          <Button size="sm" variant="outline">Send Reminder</Button>
                          <Button size="sm" variant="ghost">Generate Invoice</Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Meter Readings */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Utility Meter Readings</CardTitle>
              <CardDescription>Track gas, electricity, and water consumption</CardDescription>
            </div>
            <Button>
              <Zap className="w-4 h-4 mr-2" />
              Add Reading
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {meterReadings.map((reading, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{reading.property}</h4>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {reading.type === "Electricity" && <Zap className="w-3 h-3" />}
                          {reading.type === "Gas" && <Flame className="w-3 h-3" />}
                          {reading.type === "Water" && <Droplet className="w-3 h-3" />}
                          {reading.type}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-3 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                        <p><span className="font-medium text-foreground">Reading:</span> {reading.lastReading}</p>
                        <p><span className="font-medium text-foreground">Usage:</span> {reading.usage}</p>
                        <p><span className="font-medium text-foreground">Cost:</span> {reading.cost}</p>
                        <p>Last: {reading.date}</p>
                        <p>Next Due: {reading.nextDue}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Update</Button>
                      <Button size="sm">View History</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentsBilling;
