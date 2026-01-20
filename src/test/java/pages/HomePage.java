package pages;

import base.BasePage;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;

public class HomePage extends BasePage {

    public HomePage(WebDriver driver) {
        super(driver);
    }

    private final By heroTitle =
            By.xpath("//h1[contains(text(),'Xem cùng nhau')]");

    private final By exploreButton =
            By.xpath("//button[contains(text(),'Khám phá')]");

    private final By movieSection =
            By.id("movie-section");

    private final By movieCard =
            By.cssSelector("#movie-section div");

    private final By searchResultTitle =
            By.xpath("//h2[contains(text(),'Kết quả tìm kiếm')]");

    private final By emptyResultText =
            By.xpath("//*[contains(text(),'Không tìm thấy phim')]");

    private final By clearSearchButton =
            By.xpath("//button[contains(text(),'Quay lại trang chủ')]");

    private final By avatarButton =
            By.cssSelector("button[aria-haspopup='menu']");

    private final By logoutButton =
            By.xpath("//button[contains(text(),'Đăng xuất')]");



    public boolean isHomePageLoaded() {
        return isDisplayed(movieSection);
    }


    public boolean isHeroVisible() {
        return isDisplayed(heroTitle);
    }


    public void clickExplore() {
        click(exploreButton);
    }

    public void scrollToMovieSection() {
        ((JavascriptExecutor) driver)
                .executeScript(
                        "arguments[0].scrollIntoView({behavior:'smooth', block:'center'});",
                        waitVisible(movieSection)
                );
    }

    public boolean isMovieListVisible() {
        return isDisplayed(movieCard);
    }


    public boolean isSearchResultPage() {
        return isDisplayed(searchResultTitle);
    }


    public boolean isEmptyResultVisible() {
        return isDisplayed(emptyResultText);
    }


    public void clearSearch() {
        click(clearSearchButton);
    }


    public void logout() {
        click(avatarButton);
        click(logoutButton);
    }
}
