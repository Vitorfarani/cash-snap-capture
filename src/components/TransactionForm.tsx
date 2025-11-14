import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createWorker } from "tesseract.js";
import { transactionSchema } from "@/lib/validationSchemas";
import { getErrorMessage } from "@/lib/errorHandling";
import { z } from "zod";

interface Transaction {
  id?: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  description: string;
  category?: string;
}

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  onSuccess: () => void;
  userId: string;
}

const CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Saúde",
  "Educação",
  "Lazer",
  "Compras",
  "Salário",
  "Investimentos",
  "Outros",
];

const TransactionForm = ({ open, onOpenChange, transaction, onSuccess, userId }: TransactionFormProps) => {
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [type, setType] = useState<"income" | "expense">(transaction?.type || "expense");
  const [amount, setAmount] = useState(transaction?.amount.toString() || "");
  const [date, setDate] = useState<Date>(transaction?.date ? new Date(transaction.date) : new Date());
  const [description, setDescription] = useState(transaction?.description || "");
  const [category, setCategory] = useState(transaction?.category || "");

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setDate(new Date(transaction.date));
      setDescription(transaction.description);
      setCategory(transaction.category || "");
    } else {
      setType("expense");
      setAmount("");
      setDate(new Date());
      setDescription("");
      setCategory("");
    }
  }, [transaction, open]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    toast.info("Processando recibo...");

    try {
      const worker = await createWorker('por');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

    // Extract amount - try multiple patterns for Brazilian currency format
    let extractedAmount = null;
    
    // Pattern 1: R$ followed by amount (any value from cents to millions)
    const withCurrencySymbol = text.match(/R\$\s*(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})/i);
    if (withCurrencySymbol) {
      const cleanValue = withCurrencySymbol[1].replace(/\./g, '');
      extractedAmount = `${cleanValue}.${withCurrencySymbol[2]}`;
    }
    
    // Pattern 2: Keywords (TOTAL, VALOR, etc.) followed by amount
    if (!extractedAmount) {
      const withKeyword = text.match(/(?:total|valor|subtotal|pagar|pagamento|preco|preço)[\s:R$]*(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})/i);
      if (withKeyword) {
        const cleanValue = withKeyword[1].replace(/\./g, '');
        extractedAmount = `${cleanValue}.${withKeyword[2]}`;
      }
    }
    
    // Pattern 3: Any number with comma and exactly 2 decimal places (last resort)
    if (!extractedAmount) {
      const anyAmount = text.match(/(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})/);
      if (anyAmount) {
        const cleanValue = anyAmount[1].replace(/\./g, '');
        extractedAmount = `${cleanValue}.${anyAmount[2]}`;
      }
    }
    
    if (extractedAmount) {
      setAmount(extractedAmount);
    }

      // Extract date (looking for patterns like 01/01/2024 or 01-01-2024)
      const dateMatch = text.match(/(\d{2})[/-](\d{2})[/-](\d{4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        setDate(new Date(`${year}-${month}-${day}`));
      }

      // Use part of the text as description
      const lines = text.split("\n").filter(line => line.trim().length > 5);
      if (lines.length > 0) {
        setDescription(lines[0].trim().substring(0, 100));
      }

      toast.success("Recibo processado! Revise os dados antes de salvar.");
    } catch (error) {
      console.error("Erro no OCR:", error);
      toast.error("Erro ao processar recibo. Preencha os dados manualmente.");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      const validatedData = transactionSchema.parse({
        type,
        amount: parseFloat(amount),
        date,
        description,
        category: category || undefined,
      });

      const transactionData = {
        user_id: userId,
        type: validatedData.type,
        amount: validatedData.amount,
        date: format(validatedData.date, "yyyy-MM-dd"),
        description: validatedData.description,
        category: validatedData.category || null,
      };

      if (transaction?.id) {
        const { error } = await supabase
          .from("transactions")
          .update(transactionData)
          .eq("id", transaction.id);

        if (error) throw error;
        toast.success("Transação atualizada!");
      } else {
        const { error } = await supabase
          .from("transactions")
          .insert([transactionData]);

        if (error) throw error;
        toast.success("Transação adicionada!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Editar Transação" : "Nova Transação"}
          </DialogTitle>
          <DialogDescription>
            {transaction ? "Atualize os dados da transação" : "Adicione uma nova transação ou envie um recibo"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!transaction && (
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              <Input
                id="receipt"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={ocrLoading}
                className="hidden"
              />
              <Label htmlFor="receipt" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {ocrLoading ? "Processando..." : "Clique para enviar um recibo"}
                  </span>
                </div>
              </Label>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(value: "income" | "expense") => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Ganho</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max="999999999.99"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Ex: Compras no supermercado"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria (opcional)</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || ocrLoading} className="flex-1">
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;
