import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Film, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // GỌI API LOGIN
      const response = await api.post("/api/auth/login", {
        username: email, // Backend chấp nhận cả username hoặc email ở trường này
        password: password
      });

      // LẤY DỮ LIỆU TỪ RESPONSE
      // Đảm bảo Backend AuthController trả về đủ các trường này
      const { token, username, avatar, id, role } = response.data;

      // LƯU TOKEN VÀO STORAGE
      localStorage.setItem("token", token);

      // LƯU USER INFO (QUAN TRỌNG: CÓ ROLE)
      localStorage.setItem("user", JSON.stringify({
        id,
        username,
        avatar,
        role // Lưu role để Navbar check quyền
      }));

      toast({
        title: "Đăng nhập thành công!",
        description: `Chào mừng ${username} quay trở lại.`,
      });

      // ĐIỀU HƯỚNG DỰA THEO QUYỀN
      if (role === "admin") {
        navigate("/admin"); // Nếu là Admin -> Vào trang quản trị
      } else {
        navigate("/movies"); // Nếu là User -> Vào trang xem phim
      }

    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Lỗi đăng nhập",
        description: error.response?.data?.message || "Sai tài khoản hoặc mật khẩu!",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute inset-0 bg-gradient-dark opacity-50" />

        <Card className="relative z-10 w-full max-w-md p-8 space-y-6 bg-card/80 backdrop-blur-sm border-white/10 shadow-2xl">
          <div className="text-center space-y-2">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <Film className="h-8 w-8 text-primary group-hover:text-secondary transition-colors" />
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              WatchTogether
            </span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white">Chào mừng trở lại</h1>
            <p className="text-muted-foreground">Nhập thông tin để đăng nhập vào tài khoản</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email hoặc Tên đăng nhập</Label>
              <Input
                  id="email"
                  type="text"
                  placeholder="Nhập tên đăng nhập..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/50 border-border focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mật khẩu</Label>
                <Link to="#" className="text-sm text-primary hover:text-secondary transition-colors">
                  Quên mật khẩu?
                </Link>
              </div>
              <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background/50 border-border focus:border-primary transition-colors"
              />
            </div>

            <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity font-bold py-2"
                disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Đăng nhập"}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Chưa có tài khoản? </span>
            <Link to="/register" className="text-primary hover:text-secondary transition-colors font-semibold">
              Đăng ký ngay
            </Link>
          </div>
        </Card>
      </div>
  );
};

export default Login;