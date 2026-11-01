const {By,Key,Builder} = require("selenium-webdriver");
require("chromedriver");

// prevent access to homepage when not logged in
async function example(){

       //To wait for browser to build and launch properly
       let driver = await new Builder().forBrowser("chrome").build();
 
        await driver.get("http://127.0.0.1:5501/amazon.html");
        // page title
        var title = await driver.getTitle();
        console.log('On Page:',title);

        var searchbarEnabled = await driver.findElement(By.className("search-bar")).isEnabled();
        console.log('Is search bar enabled: ',searchbarEnabled);

        var searchiconEnabled = await driver.findElement(By.className("search-button")).isEnabled();
        console.log('Is search icon enabled: ',searchiconEnabled);

        driver.manage().window().maximize();
 
}
 
example()