import { z } from 'zod'

export const employeeSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(255),
  nickname: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  gender: z.enum(['M', 'F'], { required_error: 'Selecione o sexo' }),
  role_id: z.string().uuid('Cargo inválido'),
  sector_id: z.string().uuid('Setor inválido'),
  work_regime_id: z.string().uuid('Regime de trabalho inválido'),
  contract_type: z.enum(['CLT', 'intermitente', 'freelancer', 'folguista', 'extra']),
  hire_date: z.string().min(1, 'Data de admissão é obrigatória'),
  termination_date: z.string().optional().or(z.literal('')),
  can_open_store: z.boolean().default(false),
  can_close_store: z.boolean().default(false),
  can_work_sundays: z.boolean().default(true),
  sunday_days_off_count: z.number().int().min(0).max(4).default(1),
  max_consecutive_days: z.number().int().min(1).max(7).default(6),
  notes: z.string().max(1000).optional().or(z.literal('')),
})

export type EmployeeFormData = z.infer<typeof employeeSchema>
