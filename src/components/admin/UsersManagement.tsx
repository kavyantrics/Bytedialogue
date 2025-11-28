'use client'

import { useState } from 'react'
import { trpc } from '@/app/_trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Search, Ban, CheckCircle, Shield, User } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import UserDetailModal from './UserDetailModal'

export default function UsersManagement() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'USER' | 'ADMIN' | undefined>()
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'SUSPENDED' | 'BANNED' | undefined>()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const { toast } = useToast()

  const { data, isLoading, refetch } = trpc.adminGetUsers.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    role: roleFilter,
    accountStatus: statusFilter,
  })

  const { mutate: updateStatus } = trpc.adminUpdateUserStatus.useMutation({
    onSuccess: () => {
      toast({ title: 'User status updated successfully' })
      refetch()
    },
    onError: (error) => {
      toast({
        title: 'Failed to update status',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const { mutate: updateRole } = trpc.adminUpdateUserRole.useMutation({
    onSuccess: () => {
      toast({ title: 'User role updated successfully' })
      refetch()
    },
    onError: (error) => {
      toast({
        title: 'Failed to update role',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleStatusChange = (userId: string, status: 'ACTIVE' | 'SUSPENDED' | 'BANNED') => {
    updateStatus({ userId, status })
  }

  const handleRoleChange = (userId: string, role: 'USER' | 'ADMIN') => {
    updateRole({ userId, role })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter || 'all'} onValueChange={(v) => setRoleFilter(v === 'all' ? undefined : v as 'USER' | 'ADMIN')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? undefined : v as 'ACTIVE' | 'SUSPENDED' | 'BANNED')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="BANNED">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Files</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Messages</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {data?.users.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-zinc-500">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Select
                    value={user.role}
                    onValueChange={(v) => handleRoleChange(user.id, v as 'USER' | 'ADMIN')}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-6 py-4">
                  <Select
                    value={user.accountStatus}
                    onValueChange={(v) => handleStatusChange(user.id, v as 'ACTIVE' | 'SUSPENDED' | 'BANNED')}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      <SelectItem value="BANNED">Banned</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-6 py-4 text-sm">{user._count.files}</td>
                <td className="px-6 py-4 text-sm">{user._count.messages}</td>
                <td className="px-6 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-zinc-600">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.total)} of {data.total} users
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page >= data.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          open={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  )
}

