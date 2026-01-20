package com.mv.movie;

import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.*;

import java.time.Duration;

public class LoginTest {

    WebDriver driver;
    WebDriverWait wait;

    @BeforeEach
    void setUp() {
        System.setProperty("webdriver.chrome.driver", "C:\\Browser file\\chromedriver.exe");
        driver = new ChromeDriver();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        driver.manage().window().maximize();
        driver.get("http://10.60.39.158:8081/login");   // React chạy port 3000
    }

    @Test
    void loginSuccess() {

        // nhập username / email
        WebElement email = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("email")));
        WebElement password = driver.findElement(By.id("password"));

        email.sendKeys("thuyan");
        password.sendKeys("123");

        // click nút Đăng nhập
        driver.findElement(By.xpath("//button[@type='submit']")).click();

        // chờ chuyển trang
        wait.until(ExpectedConditions.or(
                ExpectedConditions.urlContains("/movies")
//                ExpectedConditions.urlContains("/admin")
        ));

        String url = driver.getCurrentUrl();
        Assertions.assertTrue(
                url.contains("/movies") || url.contains("/admin"),
                "Login không thành công, URL hiện tại: " + url
        );
    }

    // ===================================
    // 2️⃣ Test nhập sai mật khẩu
    // ===================================
    @Test
    void loginWrongPassword() {

        driver.findElement(By.id("email")).sendKeys("thuyan");
        driver.findElement(By.id("password")).sendKeys("sai_mat_khau");
        driver.findElement(By.xpath("//button[@type='submit']")).click();

        // Toast hiển thị "Lỗi đăng nhập"
        WebElement toast = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.xpath("//*[contains(text(),'Lỗi đăng nhập')]")
                )
        );

        Assertions.assertTrue(toast.isDisplayed());
    }

    // ===================================
    // 3️⃣ Test bỏ trống email
    // ===================================
    @Test
    void loginEmptyEmail() {

        driver.findElement(By.id("password")).sendKeys("123");
        driver.findElement(By.xpath("//button[@type='submit']")).click();

        // Browser sẽ block do required
        WebElement email = driver.findElement(By.id("email"));
        String validationMessage = email.getAttribute("validationMessage");

        Assertions.assertTrue(validationMessage.length() > 0);
    }

    @AfterEach
    void tearDown() {
        driver.quit();
    }
}
