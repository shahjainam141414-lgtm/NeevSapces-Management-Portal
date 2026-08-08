"use client";

import { useCallback, useEffect, useState } from "react";
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
import { ScrollRegion } from "@/components/ui/scroll-region";
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
import { getCurrentAdminProfile } from "@/app/actions/auth";
import type { AdminProfile } from "@/lib/admin-profiles";
import type { UserRole } from "@/lib/nav-config";
import { canDeleteUser, canEditUser, isUserRole } from "@/lib/roles";

export function UsersPageContent() {
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteUser, setDeleteUser] = useState<AdminProfile | null>(null);
  const [editUser, setEditUser] = useState<AdminProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const [listResult, me] = await Promise.all([
      listAdminProfiles(),
      getCurrentAdminProfile(),
    ]);
    setCurrentUser(me);
    if (!listResult.ok) {
      setError(listResult.error);
      setUsers([]);
    } else {
      setUsers(listResult.profiles);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUsers();
  }, [loadUsers]);

  const actorRole: UserRole =
    currentUser && isUserRole(currentUser.role) ? currentUser.role : "Manager";

  const filteredUsers = users.filter((user) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const name = (user.name ?? "").toLowerCase();
    const email = (user.email ?? "").toLowerCase();
    const phone = (user.phone ?? "").toLowerCase();
    const role = (user.role ?? "").toLowerCase();
    return (
      name.includes(q) ||
      email.includes(q) ||
      phone.includes(q) ||
      role.includes(q)
    );
  });

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

  const renderActions = (user: AdminProfile) => {
    const isSelf = currentUser?.id === user.id;
    const showEdit = canEditUser(actorRole, user.role, isSelf);
    const showDelete = canDeleteUser(actorRole, user.role, isSelf);

    if (!showEdit && !showDelete) {
      return (
        <span className="text-xs text-slate-400">{isSelf ? "You" : "—"}</span>
      );
    }

    return (
      <ActionsDropdown
        onEdit={showEdit ? () => setEditUser(user) : undefined}
        onDelete={showDelete ? () => setDeleteUser(user) : undefined}
      />
    );
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Team"
          title="User Management"
          description="Invite admins and managers. They receive a welcome email to set a password."
          actions={
            <UserFormDialog
              actorRole={actorRole}
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
                  : `${users.length} team member${users.length === 1 ? "" : "s"}`}
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
                <div className="space-y-2.5 p-3 md:hidden">
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
                <div className="hidden md:block">
                  <TableSkeleton rows={5} columns={6} />
                </div>
              </>
            ) : filteredUsers.length === 0 ? (
              <EmptyState
                icon={UsersIcon}
                title="No users yet"
                description="Invite your first team member to get started."
                action={
                  <UserFormDialog
                    actorRole={actorRole}
                    onCreated={(profile) => {
                      setUsers((prev) => [profile, ...prev]);
                    }}
                  />
                }
              />
            ) : (
              <>
                <div className="space-y-2.5 p-3 md:hidden">
                  {filteredUsers.map((user) => {
                    const isSelf = currentUser?.id === user.id;
                    return (
                      <div
                        key={user.id}
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
                                {getInitials(user.name || user.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">
                                {user.name || "—"}
                                {isSelf ? (
                                  <span className="ml-1.5 text-xs font-normal text-slate-400">
                                    (you)
                                  </span>
                                ) : null}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {user.email}
                              </p>
                              {user.phone ? (
                                <p className="mt-0.5 truncate text-xs text-slate-400">
                                  {user.phone}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          {renderActions(user)}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                          <Badge variant="secondary">{user.role}</Badge>
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
                      </div>
                    );
                  })}
                </div>

                <ScrollRegion fade className="hidden md:block">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/95 text-xs uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3.5 font-semibold lg:px-6">
                          User
                        </th>
                        <th className="px-4 py-3.5 font-semibold lg:px-6">
                          Email
                        </th>
                        <th className="px-4 py-3.5 font-semibold lg:px-6">
                          Role
                        </th>
                        <th className="px-4 py-3.5 font-semibold lg:px-6">
                          Phone
                        </th>
                        <th className="px-4 py-3.5 font-semibold lg:px-6">
                          Status
                        </th>
                        <th className="w-12 px-3 py-3.5 lg:px-4">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => {
                        const isSelf = currentUser?.id === user.id;
                        return (
                          <tr
                            key={user.id}
                            className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/80"
                          >
                            <td className="px-4 py-4 lg:px-6">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  {user.photo_url ? (
                                    <AvatarImage
                                      src={user.photo_url}
                                      alt={user.name}
                                    />
                                  ) : null}
                                  <AvatarFallback className="text-xs">
                                    {getInitials(user.name || user.email)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {user.name || "—"}
                                    {isSelf ? (
                                      <span className="ml-1.5 text-xs font-normal text-slate-400">
                                        (you)
                                      </span>
                                    ) : null}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-slate-600 lg:px-6">
                              {user.email}
                            </td>
                            <td className="px-4 py-4 lg:px-6">
                              <Badge variant="secondary">{user.role}</Badge>
                            </td>
                            <td className="px-4 py-4 text-slate-600 lg:px-6">
                              {user.phone ?? "—"}
                            </td>
                            <td className="px-4 py-4 lg:px-6">
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
                            <td className="px-3 py-4 text-right lg:px-4">
                              {renderActions(user)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </ScrollRegion>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {editUser && (
        <UserFormDialog
          mode="edit"
          user={editUser}
          actorRole={actorRole}
          isSelf={currentUser?.id === editUser.id}
          open={!!editUser}
          onOpenChange={(next) => {
            if (!next) setEditUser(null);
          }}
          onUpdated={(profile) => {
            setUsers((prev) =>
              prev.map((u) => (u.id === profile.id ? profile : u)),
            );
            if (currentUser?.id === profile.id) setCurrentUser(profile);
          }}
        />
      )}

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
