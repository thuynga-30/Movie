import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Film, Search, User, LogOut, LayoutDashboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/services/api"; // ✅ Import hàm xử lý ảnh

interface NavbarProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
  userAvatar?: string;
  userName?: string;
}

const Navbar = ({
                  isAuthenticated: propAuth,
                  onLogout: propLogout,
                  userAvatar: propAvatar,
                  userName: propName
                }: NavbarProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [keyword, setKeyword] = useState("");

  // 1. Kiểm tra trạng thái đăng nhập từ LocalStorage
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (userStr && token) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  // 2. Xử lý Đăng xuất
  const handleLogout = () => {
    localStorage.clear(); // Xóa sạch dữ liệu
    setUser(null);

    if (propLogout) {
      propLogout();
    } else {
      navigate("/login");
    }
  };

  // 3. Xử lý Tìm kiếm (Chuyển trang thật)
  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && keyword.trim()) {
      // ✅ Chuyển hướng sang trang Movies kèm từ khóa
      navigate(`/movies?search=${encodeURIComponent(keyword)}`);
    }
  };

  // Ưu tiên dùng dữ liệu thật từ State
  const isLoggedIn = user !== null || propAuth;
  const displayName = user?.username || propName || "User";

  // ✅ Xử lý ảnh Avatar (Thêm domain localhost:8080 nếu cần)
  const displayAvatar = user ? getImageUrl(user.avatar) : propAvatar;

  // ✅ Lấy Role (admin/user)
  const userRole = user?.role;

  return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">

            {/* LOGO */}
            <Link to="/" className="flex items-center gap-2 group">
              <Film className="h-8 w-8 text-primary group-hover:text-secondary transition-colors" />
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              WatchTogether
            </span>
            </Link>

            {/* MENU GIỮA */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/movies">
                <Button variant="ghost" className="hover:text-primary transition-colors">
                  Phim
                </Button>
              </Link>
              <Link to="/rooms">
                <Button variant="ghost" className="hover:text-primary transition-colors">
                  Phòng xem
                </Button>
              </Link>
              {isLoggedIn && (
                  <Link to="/library">
                    <Button variant="ghost" className="hover:text-primary transition-colors">
                      Thư viện
                    </Button>
                  </Link>
              )}
            </div>

            {/* MENU PHẢI */}
            <div className="flex items-center gap-4">

              {/* SEARCH BOX */}
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Tìm kiếm phim..."
                    className="pl-10 w-64 bg-card border-border focus:border-primary transition-colors"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={handleSearch}
                />
              </div>

              {/* USER DROPDOWN */}
              {isLoggedIn ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-border">
                        <Avatar>
                          <AvatarImage src={displayAvatar} alt={displayName} className="object-cover" />
                          <AvatarFallback className="bg-gradient-primary text-white font-bold">
                            {displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                      <div className="px-2 py-1.5 text-sm font-semibold text-primary truncate">
                        Xin chào, {displayName}
                      </div>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="cursor-pointer flex items-center w-full">
                          <User className="mr-2 h-4 w-4" />
                          Hồ sơ cá nhân
                        </Link>
                      </DropdownMenuItem>

                      {/* ✅ CHỈ HIỆN KHI ROLE LÀ "admin" (chữ thường) */}
                      {userRole === "admin" && (
                          <DropdownMenuItem asChild>
                            <Link to="/admin" className="cursor-pointer flex items-center w-full text-orange-500 font-medium">
                              <LayoutDashboard className="mr-2 h-4 w-4" />
                              Quản trị hệ thống
                            </Link>
                          </DropdownMenuItem>
                      )}
                      {/* --------------------------------------------- */}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive w-full flex items-center">
                        <LogOut className="mr-2 h-4 w-4" />
                        Đăng xuất
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              ) : (
                  <div className="flex gap-2">
                    <Link to="/login">
                      <Button variant="ghost">Đăng nhập</Button>
                    </Link>
                    <Link to="/register">
                      <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">
                        Đăng ký
                      </Button>
                    </Link>
                  </div>
              )}
            </div>
          </div>
        </div>
      </nav>
  );
};

export default Navbar;