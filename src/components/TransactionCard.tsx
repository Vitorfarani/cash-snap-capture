import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Receipt } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  description: string;
  category?: string;
  receipt_image_url?: string;
}

interface TransactionCardProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

const TransactionCard = ({ transaction, onEdit, onDelete }: TransactionCardProps) => {
  const isIncome = transaction.type === "income";
  const bgColor = isIncome ? "bg-income-light" : "bg-expense-light";
  const textColor = isIncome ? "text-income" : "text-expense";
  const borderColor = isIncome ? "border-income" : "border-expense";

  return (
    <Card className={`p-4 transition-all hover:shadow-md ${bgColor} border-l-4 ${borderColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{transaction.description}</h3>
            {transaction.receipt_image_url && (
              <Receipt className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{format(new Date(transaction.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
            {transaction.category && (
              <>
                <span>•</span>
                <span className="px-2 py-0.5 bg-secondary rounded-full text-xs">
                  {transaction.category}
                </span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`text-xl font-bold ${textColor}`}>
            {isIncome ? "+" : "-"} R$ {transaction.amount.toFixed(2)}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(transaction)}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(transaction.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TransactionCard;
