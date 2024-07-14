//const expect = (await require("chai")).expect;
//import { expect} from "chai"
const sinon = require("sinon");

global._ = require("../common/globals.js");
const logging = require("../common/logging.js");
_.log = logging.createLogger({ name: "System", loggerCtor: logging.createLogHandler(() => {}, () => {})});

const { asyncDelay, Lock } = _;

let assert, expect;
before(async () => {
	const chai = (await import("chai"));
	const chaiAsPromised = (await import("chai-as-promised")).default;
	console.log(chaiAsPromised);
	chai.use(chaiAsPromised);
	assert = chai.assert;
	expect = chai.expect;
});

describe("Lock", () => {
	it("will execute one at a time", async () => {
		const lock = new Lock("test_lock");
		const fakeFn = sinon.fake();
		lock.request(async () => {
			await asyncDelay(500);
		});
		lock.request(fakeFn);
		sinon.assert.notCalled(fakeFn);
		await lock.request(() => {
			sinon.assert.callCount(fakeFn, 1);
			fakeFn();
		});
		sinon.assert.callCount(fakeFn, 2);
	});
	it("will release on error", async () => {
		const lock = new Lock("test_lock");
		const fakeFn = sinon.fake();
		const failedPromise = lock.request(async () => {
			await asyncDelay(500);
			throw new Error("Unexpected test error!");
		});
		lock.request(fakeFn);
		sinon.assert.notCalled(fakeFn);
		await expect(failedPromise).to.eventually.be.rejectedWith(Error);
		await expect(lock.request(() => 4)).to.eventually.be.equal(4);
		sinon.assert.called(fakeFn);
	});
});
