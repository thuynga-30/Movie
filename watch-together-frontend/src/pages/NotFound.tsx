import { useLocation, Link } from "react-router-dom"; // Import Link từ react-router-dom chuẩn hơn href
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <h1 className="text-9xl font-bold text-primary opacity-20 select-none">404</h1>
          <div className="relative -top-16">
            <h2 className="text-3xl font-bold">Trang không tồn tại</h2>
            <p className="text-muted-foreground mt-2">Có vẻ như bạn đã đi lạc vào vũ trụ điện ảnh.</p>
            <Link to="/" className="inline-block mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
              Quay về Trang chủ
            </Link>
          </div>
        </div>
      </div>
  );
};

export default NotFound;