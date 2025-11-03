import { z } from 'zod';

// Authentication schemas
export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: 'Email inválido' })
    .max(255, { message: 'Email muito longo' }),
  password: z
    .string()
    .min(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
    .max(128, { message: 'Senha muito longa' }),
});

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, { message: 'Nome não pode estar vazio' })
    .max(100, { message: 'Nome muito longo' })
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: 'Nome contém caracteres inválidos' }),
  email: z
    .string()
    .trim()
    .email({ message: 'Email inválido' })
    .max(255, { message: 'Email muito longo' }),
  password: z
    .string()
    .min(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
    .max(128, { message: 'Senha muito longa' })
    .regex(/[A-Z]/, { message: 'Senha deve conter ao menos uma letra maiúscula' })
    .regex(/[a-z]/, { message: 'Senha deve conter ao menos uma letra minúscula' })
    .regex(/[0-9]/, { message: 'Senha deve conter ao menos um número' }),
});

// Transaction schema
export const transactionSchema = z.object({
  type: z.enum(['income', 'expense'], { 
    errorMap: () => ({ message: 'Tipo deve ser receita ou despesa' }) 
  }),
  amount: z
    .number({ 
      required_error: 'Valor é obrigatório',
      invalid_type_error: 'Valor deve ser um número' 
    })
    .positive({ message: 'Valor deve ser positivo' })
    .max(999999999.99, { message: 'Valor muito alto' })
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
      message: 'Valor deve ter no máximo 2 casas decimais',
    }),
  date: z
    .date({ required_error: 'Data é obrigatória' })
    .max(new Date(), { message: 'Data não pode ser futura' }),
  description: z
    .string()
    .trim()
    .min(1, { message: 'Descrição não pode estar vazia' })
    .max(500, { message: 'Descrição muito longa (máximo 500 caracteres)' }),
  category: z
    .string()
    .max(50, { message: 'Categoria muito longa' })
    .optional(),
});

export type SignInData = z.infer<typeof signInSchema>;
export type SignUpData = z.infer<typeof signUpSchema>;
export type TransactionData = z.infer<typeof transactionSchema>;
