import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Film, Search, User, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavbarProps {
  isAuthenticated?: boolean; // Props này có thể không cần thiết nữa nếu tự check localStorage
  onLogout?: () => void;
  userAvatar?: string;
  userName?: string;
}

const Navbar = ({ isAuthenticated: propAuth, userName: propName, userAvatar: propAvatar }: NavbarProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [keyword, setKeyword] = useState("");

  // Kiểm tra trạng thái đăng nhập khi component mount
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (userStr && token) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    // Xóa token và redirect
    localStorage.clear();
    setUser(null);
    navigate("/login");
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && keyword.trim()) {
      // Chuyển hướng sang trang Movies với query search (bạn cần xử lý bên trang Movies)
      // Ví dụ: navigate(`/movies?search=${keyword}`);
      // Tạm thời mình chỉ log ra
      console.log("Searching for:", keyword);
    }
  };

  // Ưu tiên dùng dữ liệu từ localStorage, nếu không có thì dùng props (fallback)
  const isLoggedIn = user !== null || propAuth;
  const displayName = user?.username || propName || "User";
  const displayAvatar = user?.avatar || propAvatar;

  return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <Film className="h-8 w-8 text-primary group-hover:text-secondary transition-colors" />
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              WatchTogether
            </span>
            </Link>

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
              <Link to="/library">
                <Button variant="ghost" className="hover:text-primary transition-colors">
                  Thư viện
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-4">
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

              {isLoggedIn ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar>
                          <AvatarImage src={displayAvatar} alt={displayName} />
                          <AvatarFallback className="bg-gradient-primary text-white">
                            {displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5 text-sm font-semibold text-primary">
                        {displayName}
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Hồ sơ
                        </Link>
                      </DropdownMenuItem>
                      {/* Nếu là admin thì hiện nút quản trị */}
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <Film className="mr-2 h-4 w-4" />
                          Quản trị
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
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