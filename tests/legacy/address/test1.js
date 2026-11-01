const {By,Key,Builder} = require("selenium-webdriver");
require("chromedriver");

// prevent access to homepage when not logged in
async function example(){

       //To wait for browser to build and launch properly
       let driver = await new Builder().forBrowser("chrome").build();
 
        await driver.get("http://127.0.0.1:5501/user_details.html");

        // page title
        var title = await driver.getTitle();
        console.log('On Page:',title);
            
        await driver.findElement(By.id("city")).sendKeys("Example City");
        await driver.findElement(By.id("country")).sendKeys("United States");
        await driver.findElement(By.id("zipcode")).sendKeys("123"); 
        await driver.findElement(By.id("zipcode")).sendKeys(Key.RETURN); 
      
        var alertMessage = await driver.switchTo().alert().getText();
        console.log(alertMessage);
        driver.switchTo().alert().accept();
 
        // Close the browser after execution
        // await driver.quit();
 
}
 
example()