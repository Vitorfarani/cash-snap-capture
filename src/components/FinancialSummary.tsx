import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface Transaction {
  type: "income" | "expense";
  amount: number;
}

interface FinancialSummaryProps {
  transactions: Transaction[];
}

const FinancialSummary = ({ transactions }: FinancialSummaryProps) => {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expenses;

  const summaryCards = [
    {
      title: "Ganhos",
      value: income,
      icon: TrendingUp,
      color: "text-income",
      bgColor: "bg-income-light",
    },
    {
      title: "Despesas",
      value: expenses,
      icon: TrendingDown,
      color: "text-expense",
      bgColor: "bg-expense-light",
    },
    {
      title: "Saldo",
      value: balance,
      icon: Wallet,
      color: balance >= 0 ? "text-income" : "text-expense",
      bgColor: balance >= 0 ? "bg-income-light" : "bg-expense-light",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {summaryCards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className={`${card.bgColor} border-none shadow-sm`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>
                    R$ {card.value.toFixed(2)}
                  </p>
                </div>
                <Icon className={`h-8 w-8 ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default FinancialSummary;
