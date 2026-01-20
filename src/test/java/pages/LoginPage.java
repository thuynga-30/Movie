package pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class LoginPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    public LoginPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(20));
    }

    private final By loginForm = By.cssSelector("form");
    private final By emailInput = By.id("email");
    private final By passwordInput = By.id("password");
    private final By submitButton = By.cssSelector("button[type='submit']");

    public void login(String email, String password) throws InterruptedException{

        // 1. Chờ form render xong
        wait.until(ExpectedConditions.presenceOfElementLocated(loginForm));

        // 2. Email / username
        WebElement emailEl = wait.until(
                ExpectedConditions.elementToBeClickable(emailInput)
        );
        emailEl.clear();
        emailEl.sendKeys(email);
        Thread.sleep(1000);
        // 3. Password
        WebElement passEl = wait.until(
                ExpectedConditions.elementToBeClickable(passwordInput)
        );
        passEl.clear();
        passEl.sendKeys(password);
        Thread.sleep(1000);

        // 4. Submit
        wait.until(
                ExpectedConditions.elementToBeClickable(submitButton)
        ).click();
        Thread.sleep(1000);

    }
}
