import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, AlertCircle, CheckCircle, Clock, ImageIcon } from "lucide-react";

const ExtraCharges = () => {
  const extraCharges = [
    {
      lodger: "Tom Brown",
      property: "789 High St",
      room: "Room 5",
      reason: "Missed Bin Duty",
      amount: "£25.00",
      dueDate: "2024-12-15",
      status: "Outstanding",
      dateAdded: "2024-12-01",
      evidence: true
    },
    {
      lodger: "Lisa Green",
      property: "123 Main St",
      room: "Room 2",
      reason: "Damage to Property",
      amount: "£150.00",
      dueDate: "2024-12-10",
      status: "Outstanding",
      dateAdded: "2024-11-28",
      evidence: true
    },
    {
      lodger: "Mark Johnson",
      property: "456 River Rd",
      room: "Room 3",
      reason: "Deep Cleaning Required",
      amount: "£75.00",
      dueDate: "2024-12-05",
      status: "Paid",
      dateAdded: "2024-11-20",
      evidence: false
    },
    {
      lodger: "Sophie Chen",
      property: "321 Park Ave",
      room: "Room 1",
      reason: "Lost Key Replacement",
      amount: "£50.00",
      dueDate: "2024-12-08",
      status: "Waived",
      dateAdded: "2024-11-25",
      evidence: false
    },
  ];

  const chargeReasons = [
    "Missed Bin Duty",
    "Damage to Property",
    "Deep Cleaning Required",
    "Lost Key Replacement",
    "Late Payment Fee",
    "Maintenance Callout",
    "Other"
  ];

  const totalOutstanding = extraCharges
    .filter(c => c.status === "Outstanding")
    .reduce((sum, c) => sum + parseFloat(c.amount.replace("£", "")), 0);

  const totalPaid = extraCharges
    .filter(c => c.status === "Paid")
    .reduce((sum, c) => sum + parseFloat(c.amount.replace("£", "")), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Extra Charges System</h2>
        <p className="text-muted-foreground">Manage additional charges for lodgers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-destructive/10 p-3 rounded-full">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">£{totalOutstanding.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-3 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">£{totalPaid.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Paid This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{extraCharges.length}</p>
                <p className="text-sm text-muted-foreground">Total Charges</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Charges */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Extra Charges</CardTitle>
              <CardDescription>Track and manage additional charges</CardDescription>
            </div>
            <Button>
              <CreditCard className="w-4 h-4 mr-2" />
              Add New Charge
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {extraCharges.map((charge, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{charge.lodger}</h4>
                        <Badge variant={
                          charge.status === "Outstanding" ? "destructive" :
                          charge.status === "Paid" ? "default" :
                          "secondary"
                        }>
                          {charge.status}
                        </Badge>
                        {charge.evidence && (
                          <Badge variant="outline">
                            <ImageIcon className="w-3 h-3 mr-1" />
                            Evidence Attached
                          </Badge>
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground mt-2">
                        <p><span className="font-medium text-foreground">Property:</span> {charge.property}</p>
                        <p><span className="font-medium text-foreground">Room:</span> {charge.room}</p>
                        <p><span className="font-medium text-foreground">Reason:</span> {charge.reason}</p>
                        <p><span className="font-medium text-foreground">Amount:</span> <span className="text-lg font-bold text-primary">{charge.amount}</span></p>
                        <p className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Due: {charge.dueDate}
                        </p>
                        <p>Added: {charge.dateAdded}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {charge.status === "Outstanding" && (
                        <>
                          <Button size="sm">Mark as Paid</Button>
                          <Button size="sm" variant="outline">Waive Charge</Button>
                          <Button size="sm" variant="outline">Send Reminder</Button>
                        </>
                      )}
                      {charge.status === "Paid" && (
                        <Button size="sm" variant="outline">View Receipt</Button>
                      )}
                      {charge.evidence && (
                        <Button size="sm" variant="ghost">View Evidence</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charge Reasons Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Common Charge Reasons</CardTitle>
          <CardDescription>Standard categories for extra charges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {chargeReasons.map((reason, index) => (
              <Badge key={index} variant="secondary">{reason}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExtraCharges;
