const {By,Key,Builder} = require("selenium-webdriver");
require("chromedriver");

// login and goto order tracking page
async function example(){
 
       var username = "Yogesh";
       var password = "8329097855";
 
       //To wait for browser to build and launch properly
       let driver = await new Builder().forBrowser("chrome").build();
 
        await driver.get("http://127.0.0.1:5501/login.html");

        // page title
        var title = await driver.getTitle();
        console.log('Page title is:',title);
            
        await driver.findElement(By.id("username")).sendKeys(username);
        await driver.findElement(By.id("password")).sendKeys(password,Key.RETURN);
		
        // Capturing alert message.    
        var alertMessage = await driver.switchTo().alert().getText();		

        // Displaying alert message		
        console.log(alertMessage);
        // accept the alert message
        driver.switchTo().alert().accept();
 
        // page title
        var title = await driver.getTitle();
        console.log('Page title is:',title);

        await driver.findElement(By.className("returns-orders-text")).click();

        // page title
        var title = await driver.getTitle();
        console.log('Page title is:',title);

        var prodNameOrderPage = await driver.findElement(By.className("prod-3")).getText();
        console.log('Product is:',prodNameOrderPage);

        await driver.findElement(By.className("track-btn1")).click();

        // page title
        var title = await driver.getTitle();
        console.log('Page title is:',title);

        var prodNameTrackingPage = await driver.findElement(By.className("product-info")).getText();
        console.log('Product is:',prodNameTrackingPage);

        if (prodNameOrderPage === prodNameTrackingPage) { 
                console.log('Tracking order successful for:',prodNameOrderPage);                
        }
        else {
            console.log('Tracking order of:',prodNameTrackingPage);
            console.log('Tracking failed for:',prodNameOrderPage);
        }
        
        // Close the browser after execution
        // await driver.quit();
 
}
 
example()