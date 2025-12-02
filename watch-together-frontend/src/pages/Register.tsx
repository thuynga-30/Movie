import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Film, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api"; // Import api

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState(""); // Thêm trường Họ tên
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Lỗi", description: "Mật khẩu xác nhận không khớp!" });
      return;
    }

    setIsLoading(true);

    try {
      // GỌI API ĐĂNG KÝ
      await api.post("/api/auth/register", {
        username,
        email,
        password,
        fullName: fullName || username // Nếu không nhập tên thì lấy username
      });

      toast({
        title: "Đăng ký thành công!",
        description: "Vui lòng đăng nhập để tiếp tục.",
      });

      navigate("/login");
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Lỗi đăng ký",
        description: error.response?.data || "Tên đăng nhập hoặc Email đã tồn tại!",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute inset-0 bg-gradient-dark opacity-50" />

        <Card className="relative z-10 w-full max-w-md p-8 space-y-6 bg-card/80 backdrop-blur-xl border-border shadow-card">
          <div className="text-center space-y-2">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <Film className="h-10 w-10 text-primary group-hover:text-secondary transition-colors" />
              <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              WatchTogether
            </span>
            </Link>
            <h2 className="text-2xl font-bold text-foreground">Tạo tài khoản</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                  id="fullName"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập (*)</Label>
              <Input
                  id="username"
                  placeholder="nguyenvana"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (*)</Label>
              <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu (*)</Label>
              <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu (*)</Label>
              <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-background border-border"
              />
            </div>

            <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Tạo tài khoản"}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Đã có tài khoản? </span>
            <Link to="/login" className="text-primary hover:text-secondary transition-colors font-semibold">
              Đăng nhập
            </Link>
          </div>
        </Card>
      </div>
  );
};

export default Register;