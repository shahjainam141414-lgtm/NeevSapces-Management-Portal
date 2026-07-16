"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Users as UsersIcon } from "lucide-react";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ActionsDropdown } from "@/components/ui/actions-dropdown";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { AlertBanner } from "@/components/ui/alert-banner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getInitials } from "@/lib/utils";
import {
  deleteAdminUser,
  listAdminProfiles,
} from "@/app/actions/users";
import type { AdminProfile } from "@/lib/admin-profiles";

export function UsersPageContent() {
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteUser, setDeleteUser] = useState<AdminProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const result = await listAdminProfiles();
    if (!result.ok) {
      setError(result.error);
      setUsers([]);
    } else {
      setUsers(result.profiles);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    const result = await deleteAdminUser(deleteUser.id);
    setDeleting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
    setDeleteUser(null);
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Team"
          title="User Management"
          description="Invite Super Admins. They receive a welcome email to set a password."
          actions={
            <UserFormDialog
              onCreated={(profile) => {
                setUsers((prev) => [profile, ...prev]);
              }}
            />
          }
        />

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">All Users</CardTitle>
              <p className="mt-0.5 text-sm text-slate-500">
                {loading
                  ? "Loading..."
                  : `${users.length} Super Admin${users.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {error && (
              <AlertBanner
                variant="warning"
                className="rounded-none border-x-0 border-t-0"
              >
                {error}
                <button
                  type="button"
                  className="ml-2 cursor-pointer font-semibold underline underline-offset-2"
                  onClick={() => void loadUsers()}
                >
                  Retry
                </button>
              </AlertBanner>
            )}

            {loading ? (
              <>
                <div className="space-y-2.5 p-3 sm:hidden">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3.5 py-3"
                    >
                      <Skeleton className="size-10 shrink-0 rounded-full" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block">
                  <TableSkeleton rows={5} columns={5} />
                </div>
              </>
            ) : filteredUsers.length === 0 ? (
              <EmptyState
                icon={UsersIcon}
                title="No users yet"
                description="Invite your first Super Admin to get started."
                action={
                  <UserFormDialog
                    onCreated={(profile) => {
                      setUsers((prev) => [profile, ...prev]);
                    }}
                  />
                }
              />
            ) : (
              <>
                {/* Mobile cards */}
                <div className="space-y-2.5 p-3 sm:hidden">
                  {filteredUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: index * 0.04,
                        duration: 0.4,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="rounded-xl border border-slate-100 bg-white px-3.5 py-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            {user.photo_url ? (
                              <AvatarImage
                                src={user.photo_url}
                                alt={user.name}
                              />
                            ) : null}
                            <AvatarFallback className="text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">
                              {user.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <ActionsDropdown
                          onDelete={() => setDeleteUser(user)}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                        <span className="text-xs text-slate-500">
                          {user.phone ?? "—"}
                        </span>
                        <Badge
                          variant={
                            user.status === "active"
                              ? "success"
                              : "destructive"
                          }
                        >
                          {user.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="sticky top-14 z-10 border-b border-slate-100 bg-slate-50/95 text-xs uppercase tracking-wider text-slate-500 backdrop-blur-sm">
                        <th className="px-6 py-3.5 font-semibold">User</th>
                        <th className="px-6 py-3.5 font-semibold">Email</th>
                        <th className="px-6 py-3.5 font-semibold">Phone</th>
                        <th className="px-6 py-3.5 font-semibold">Status</th>
                        <th className="w-12 px-4 py-3.5">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: index * 0.04,
                            duration: 0.4,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/80"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                {user.photo_url ? (
                                  <AvatarImage
                                    src={user.photo_url}
                                    alt={user.name}
                                  />
                                ) : null}
                                <AvatarFallback className="text-xs">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {user.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Super Admin
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {user.phone ?? "—"}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant={
                                user.status === "active"
                                  ? "success"
                                  : "destructive"
                              }
                            >
                              {user.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <ActionsDropdown
                              onDelete={() => setDeleteUser(user)}
                            />
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteUser?.name}&quot;?
              They will lose access immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteUser(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={deleting}
              onClick={() => void handleDelete()}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
