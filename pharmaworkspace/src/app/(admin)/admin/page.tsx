import { MembersTable } from '@/components/admin/members-table'

export default function AdminPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mon équipe</h1>
        <p className="text-sm text-muted-foreground">
          Gérez votre équipe, les accès et les rôles.
        </p>
      </div>

      <MembersTable />
    </div>
  )
}
