//const expect = (await require("chai")).expect;
//import { expect} from "chai"
const sinon = require("sinon");

global._ = require("../common/globals.js");
const logging = require("../common/logging.js");
_.log = logging.createLogger({ name: "System", loggerCtor: logging.createLogHandler(() => {}, () => {})});

const { asyncDelay, retry } = _;

let assert, expect;
before(async () => {
	const chai = (await import("chai"));
	const chaiAsPromised = (await import("chai-as-promised")).default;
	chai.use(chaiAsPromised);
	assert = chai.assert;
	expect = chai.expect;
});

describe("retry", () => {
	it("will execute", async () => {
		const fakeFn = sinon.fake();
		const reFn = retry(fakeFn, 1, () => {
			throw new Error("should not fail.");
		});
		reFn();
		sinon.assert.callCount(fakeFn, 1);
		reFn();
		sinon.assert.callCount(fakeFn, 2);
	});
	it("will retry on error", async () => {
		const fakeFn = sinon.fake();
		let count = 1;
		const reFn = retry(() => {
			count = 1 + count;
			fakeFn();
			if (count % 2 === 0) {
				throw new Error();
			}
		}, 3);
		reFn();
		sinon.assert.callCount(fakeFn, 2);
		reFn();
		sinon.assert.callCount(fakeFn, 4);
	});
	it("will fail after retry amount", async () => {
		const fakeFn = sinon.fake();
		const reFn = retry(() => {
			fakeFn();
			throw new Error();
		}, 3);
		expect(reFn).to.throw();
		sinon.assert.callCount(fakeFn, 4);
		expect(reFn).to.throw();
		sinon.assert.callCount(fakeFn, 8);
	});
	it("will abort if onError throws", async () => {
		const fakeFn = sinon.fake();
		const reFn = retry(() => {
			fakeFn();
			throw new Error();
		}, 3, () => { throw new Error(); });
		expect(reFn).to.throw();
		sinon.assert.callCount(fakeFn, 1);
		expect(reFn).to.throw();
		sinon.assert.callCount(fakeFn, 2);
	});
	describe("async", () => {
		it("will execute", async () => {
			const fakeFn = sinon.fake();
			const reFn = retry(async () => {
				await asyncDelay(1);
				fakeFn();
			}, 1, () => {
				throw new Error("should not fail.");
			});
			await assert.isFulfilled(reFn());
			sinon.assert.callCount(fakeFn, 1);
			await assert.isFulfilled(reFn());
			sinon.assert.callCount(fakeFn, 2);
		});
		it("will retry on error", async () => {
			const fakeFn = sinon.fake();
			let count = 1;
			const reFn = retry(async () => {
				await asyncDelay(1);
				count = 1 + count;
				fakeFn();
				if (count % 2 === 0) {
					throw new Error();
				}
			}, 3, () => asyncDelay(1));
			await assert.isFulfilled(reFn());
			sinon.assert.callCount(fakeFn, 2);
			await assert.isFulfilled(reFn());
			sinon.assert.callCount(fakeFn, 4);
		});
		it("will fail after retry amount", async () => {
			const fakeFn = sinon.fake();
			const reFn = retry(async () => {
				await asyncDelay(1);
				fakeFn();
				throw new Error();
			}, 3, () => asyncDelay(1));
			await assert.isRejected(reFn(), Error);
			sinon.assert.callCount(fakeFn, 4);
			await assert.isRejected(reFn(), Error);
			sinon.assert.callCount(fakeFn, 8);
		});
		it("will abort if onError throws", async () => {
			const fakeFn = sinon.fake();
			const reFn = retry(async () => {
				await asyncDelay(1);
				fakeFn();
				throw new Error();
			}, 3, async () => {
				await asyncDelay(1)
				throw new Error();
			});
			await assert.isRejected(reFn(), Error);
			sinon.assert.callCount(fakeFn, 1);
			await assert.isRejected(reFn(), Error);
			sinon.assert.callCount(fakeFn, 2);
		});
	});
});
