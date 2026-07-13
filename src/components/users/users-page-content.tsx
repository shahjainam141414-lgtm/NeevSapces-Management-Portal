"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ActionsDropdown } from "@/components/ui/actions-dropdown";
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
    setError(null);
    const result = await listAdminProfiles();
    if (!result.ok) {
      setError(result.error);
      setUsers([]);
    } else {
      setUsers(result.profiles);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              User Management
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Invite Super Admins. They receive a welcome email to set a
              password.
            </p>
          </div>
          <UserFormDialog
            onCreated={(profile) => {
              setUsers((prev) => [profile, ...prev]);
            }}
          />
        </div>

        <Card className="overflow-hidden border-slate-200/80 shadow-sm">
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
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-slate-200 bg-white pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {error && (
              <div className="border-b border-amber-100 bg-amber-50 px-6 py-3 text-sm text-amber-800">
                {error}
                <button
                  type="button"
                  className="ml-2 cursor-pointer font-semibold underline"
                  onClick={() => void loadUsers()}
                >
                  Retry
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
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
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        No users yet. Invite your first Super Admin.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
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
                              <AvatarFallback className="bg-[#1a2744] text-xs text-white">
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteUser?.name}&quot;?
              They will lose access immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setDeleteUser(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
