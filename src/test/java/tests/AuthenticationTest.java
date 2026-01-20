package tests;

import base.BaseTest;
import org.junit.jupiter.api.Test;
import pages.HomePage;
import pages.LoginPage;

import static org.junit.jupiter.api.Assertions.*;

public class AuthenticationTest extends BaseTest {

    @Test
    void loginSuccess() throws InterruptedException {
        LoginPage login = new LoginPage(driver);
        login.login("thuynga", "1234");

        driver.get("http://10.60.39.158:8081/");

        HomePage home = new HomePage(driver);
        Thread.sleep(2000);
        assertTrue(home.isHomePageLoaded());
        assertTrue(home.isMovieListVisible());
    }

    @Test
    void loginFail() throws InterruptedException {
        LoginPage login = new LoginPage(driver);
        login.login("thuyan", "wrongpass");

        Thread.sleep(3000); // 👀 xem toast lỗi
    }

//    @Test
//    void logoutSuccess() throws InterruptedException {
//        LoginPage login = new LoginPage(driver);
//        login.login("thuynga", "1234");
//
//        HomePage home = new HomePage(driver);
//        Thread.sleep(2000);
//        home.logout();
//
//        Thread.sleep(2000);
//        assertTrue(driver.getCurrentUrl().contains("/login"));
//    }
}
