import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, DollarSign } from "lucide-react";
import { toast } from "sonner";
import TransactionCard from "@/components/TransactionCard";
import TransactionForm from "@/components/TransactionForm";
import FinancialSummary from "@/components/FinancialSummary";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  description: string;
  category?: string;
  receipt_image_url?: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        setAuthChecking(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setAuthChecking(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authChecking && !user && !session) {
      navigate("/auth");
    }
  }, [authChecking, user, session, navigate]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar transações");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      
      toast.success("Transação excluída!");
      fetchTransactions();
    } catch (error: any) {
      toast.error("Erro ao excluir transação");
    } finally {
      setDeleteId(null);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingTransaction(null);
  };

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">FinanceFlow</h1>
            </div>
            <Button variant="ghost" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <FinancialSummary transactions={transactions} />

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Transações</h2>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Transação
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Carregando...
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">Nenhuma transação encontrada</p>
            <Button onClick={() => setFormOpen(true)} variant="outline">
              Adicionar primeira transação
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
          </div>
        )}
      </main>

      <TransactionForm
        open={formOpen}
        onOpenChange={handleFormClose}
        transaction={editingTransaction}
        onSuccess={fetchTransactions}
        userId={user.id}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
