import { createClient } from '@/lib/supabase/client'
import { getPharmacyMembers } from '@/lib/queries/admin'
import {
  countTasks,
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  getTasksPaginated,
  getTasksSectionPaginated,
  updateTask,
} from '@/lib/queries/tasks'

export const tasksService = {
  getTasks,
  getTasksPaginated,
  getTasksSectionPaginated,
  countTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getPharmacyMembers,
  async getCurrentUserId() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.id ?? null
  },
}
