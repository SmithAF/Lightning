const { Builder, By, Key } = require('selenium-webdriver');
// const { expect } = require('chai');
function wait(t = 0, v = null) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(v), t);
  });
}

describe('Key test', () => {
  let canvas;
  let driver;
  before(async () => {
    driver = await new Builder().forBrowser('chrome').build();
    await driver.get('http://127.0.0.1:8080/');
    await wait(1000);

    canvas = await driver.findElement(By.tagName('body'));
  });
  it('Down', async () => await wait(100).then(() => canvas.sendKeys(Key.DOWN)));
  it('Down', async () => await wait(100).then(() => canvas.sendKeys(Key.DOWN)));
  it('Down', async () => await wait(100).then(() => canvas.sendKeys(Key.DOWN)));
  it('Right', async () => await wait(100).then(() => canvas.sendKeys(Key.RIGHT)));
  it('Right', async () => await wait(100).then(() => canvas.sendKeys(Key.RIGHT)));
  it('Right', async () => await wait(100).then(() => canvas.sendKeys(Key.RIGHT)));
  it('Right', async () => await wait(100).then(() => canvas.sendKeys(Key.RIGHT)));
  it('Right', async () => await wait(100).then(() => canvas.sendKeys(Key.RIGHT)));
  it('Right', async () => await wait(100).then(() => canvas.sendKeys(Key.RIGHT)));
  it('Right', async () => await wait(100).then(() => canvas.sendKeys(Key.RIGHT)));
  it('Right', async () => await wait(100).then(() => canvas.sendKeys(Key.RIGHT)));
  it('Right', async () => await wait(100).then(() => canvas.sendKeys(Key.RIGHT)));
  it('Right', async () => await wait(100).then(() => canvas.sendKeys(Key.RIGHT)));
  it('Right', async () => await wait(100).then(() => canvas.sendKeys(Key.RIGHT)));
  it('Right', async () => await wait(100).then(() => canvas.sendKeys(Key.RIGHT)));
  it('Right', async () => await wait(100).then(() => canvas.sendKeys(Key.RIGHT)));

  it('Left', async () => await wait(100).then(() => canvas.sendKeys(Key.LEFT)));
  it('Left', async () => await wait(100).then(() => canvas.sendKeys(Key.LEFT)));
  it('Left', async () => await wait(100).then(() => canvas.sendKeys(Key.LEFT)));
  it('Left', async () => await wait(100).then(() => canvas.sendKeys(Key.LEFT)));
  it('Left', async () => await wait(100).then(() => canvas.sendKeys(Key.LEFT)));
  it('Left', async () => await wait(100).then(() => canvas.sendKeys(Key.LEFT)));
  it('Left', async () => await wait(100).then(() => canvas.sendKeys(Key.LEFT)));
  it('Left', async () => await wait(100).then(() => canvas.sendKeys(Key.LEFT)));
  it('Left', async () => await wait(100).then(() => canvas.sendKeys(Key.LEFT)));

  after(async () => driver.quit());
});
