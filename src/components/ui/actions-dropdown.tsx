"use client";

import {
  CircleCheck,
  CircleSlash,
  MoreHorizontal,
  Pencil,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type ActionsDropdownProps = {
  onEdit?: () => void;
  onDelete?: () => void;
  /** Show “Set as Active” when provided */
  onSetActive?: () => void;
  /** Show “Set as Inactive” when provided */
  onSetInactive?: () => void;
  /** Show “Set as Default” when provided */
  onSetDefault?: () => void;
  /** Show “Remove Default” when provided */
  onUnsetDefault?: () => void;
};

export function ActionsDropdown({
  onEdit,
  onDelete,
  onSetActive,
  onSetInactive,
  onSetDefault,
  onUnsetDefault,
}: ActionsDropdownProps) {
  const hasStatus = Boolean(onSetActive || onSetInactive);
  const hasDefault = Boolean(onSetDefault || onUnsetDefault);
  const hasMiddle = hasStatus || hasDefault;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-pointer rounded-lg text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 active:scale-95"
          aria-label="Open actions menu"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-1.5">
        {onEdit && (
          <DropdownMenuItem
            onClick={onEdit}
            className="cursor-pointer rounded-md"
          >
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Edit
          </DropdownMenuItem>
        )}
        {hasStatus && (
          <>
            {onEdit && <DropdownMenuSeparator />}
            {onSetActive && (
              <DropdownMenuItem
                onClick={onSetActive}
                className="cursor-pointer rounded-md text-emerald-700 focus:bg-emerald-50 focus:text-emerald-800"
              >
                <CircleCheck className="mr-2 h-3.5 w-3.5" />
                Set as Active
              </DropdownMenuItem>
            )}
            {onSetInactive && (
              <DropdownMenuItem
                onClick={onSetInactive}
                className="cursor-pointer rounded-md text-slate-600 focus:bg-slate-100 focus:text-slate-800"
              >
                <CircleSlash className="mr-2 h-3.5 w-3.5" />
                Set as Inactive
              </DropdownMenuItem>
            )}
          </>
        )}
        {hasDefault && (
          <>
            {(onEdit || hasStatus) && <DropdownMenuSeparator />}
            {onSetDefault && (
              <DropdownMenuItem
                onClick={onSetDefault}
                className="cursor-pointer rounded-md text-amber-700 focus:bg-amber-50 focus:text-amber-800"
              >
                <Star className="mr-2 h-3.5 w-3.5" />
                Set as Default
              </DropdownMenuItem>
            )}
            {onUnsetDefault && (
              <DropdownMenuItem
                onClick={onUnsetDefault}
                className="cursor-pointer rounded-md text-slate-600 focus:bg-slate-100 focus:text-slate-800"
              >
                <StarOff className="mr-2 h-3.5 w-3.5" />
                Remove Default
              </DropdownMenuItem>
            )}
          </>
        )}
        {onDelete && (
          <>
            {hasMiddle && <DropdownMenuSeparator />}
            <DropdownMenuItem
              destructive
              onClick={onDelete}
              className="cursor-pointer rounded-md text-red-600 focus:bg-red-50 focus:text-red-700"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
