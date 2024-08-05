//const expect = (await require("chai")).expect;
//import { expect} from "chai"

const simplifyItem = require("../server/components/inventory/simplifyItem");
const Faction = require("../server/config/factions");

describe("Inventory.SimplifyItem", function() {
	let expect;
	before(async () => {
		expect = (await import("chai")).expect;
		global._ = require("../server/misc/helpers");
		const logging = require("../common/logging.js");
		_.log = logging.createLogger({ name: "System", loggerCtor: logging.createLogHandler((thisLogger, logLevel, args) => console.info.apply(console, args), () => true)});

		Faction.init({
			0: "factions/hostile"
		});
	});
	it("can convert an item to JSON", function() {
		const itemObj = {
			factions: [{
				id: 0
				, tier: 1
			}]
		};
		const simplifiedItem = simplifyItem(null, itemObj);
		expect(simplifiedItem).to.deep.equal({
			"factions": [
				{ "id": 0
					, "name": "Hostile"
					, "tier": 1
					, "tierName": "Hostile"
				}
			]
		});
	});
});
