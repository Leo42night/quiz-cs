import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BACKEND_URL } from "@/constants";
// import { LogIn } from "lucide-react"; // Icon alternatif jika tidak pakai SVG Google

interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export default function GoogleAuthButton() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        // Ambil data profile dari Google API
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const data = await res.json();
        // console.log("Google login data", data);
        // ambil user dari backend
        const resUser = await fetch(`${BACKEND_URL}/api/users/${data.id}`);
        if (!resUser.ok) throw new Error("Gagal ambil data user");
        const dataUser = await resUser.json();
        setUser(dataUser);
      } catch (error) {
        console.error("Gagal mengambil data user", error);
      } finally {
        setLoading(false);
      }
    },
    onError: () => console.log("Login Failed"),
  });

  // Kondisi Jika User Sudah Login
  if (user) {
    return (
      <div className="flex items-center gap-3 p-2 border rounded-lg w-fit transition-all animate-in fade-in zoom-in">
        <Avatar className="h-9 w-9">
          <AvatarImage src={user.picture} alt={user.name} />
          <AvatarFallback>{user.name?.charAt(0) ?? ":)"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium leading-none">{user.name}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setUser(null)}
          className="ml-2 text-xs"
        >
          Logout
        </Button>
      </div>
    );
  }

  // Kondisi Jika Belum Login
  return (
    <Button
      variant="outline"
      onClick={() => login()}
      disabled={loading}
      className="flex items-center gap-2"
    >
      {loading ? (
        "Loading..."
      ) : (
        <>
          <svg className="h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
          </svg>
          Login with Google
        </>
      )}
    </Button>
  );
}