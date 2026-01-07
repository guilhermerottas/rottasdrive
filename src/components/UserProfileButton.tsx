import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { UserProfileDialog } from "./UserProfileDialog";

export const UserProfileButton = () => {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <>
      <Avatar 
        className="h-9 w-9 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setOpen(true)}
      >
        <AvatarImage src={profile?.avatar_url || undefined} />
        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
          {getInitials(profile?.nome)}
        </AvatarFallback>
      </Avatar>

      <UserProfileDialog open={open} onOpenChange={setOpen} />
    </>
  );
};
